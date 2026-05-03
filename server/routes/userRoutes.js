const express = require('express');
const { requireUser } = require('../middleware/requireUser');
const { ensureUserCycle } = require('../services/cycleService');
const { normalizeSkillKey } = require('../lib/skills');
const { mapTaskRow } = require('./mapTask');

module.exports = function userRoutes(admin, upload) {
  const r = express.Router();

  /** Profile + onboarding skill */
  r.patch('/api/me/profile', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const patch = {};
      if (typeof req.body?.displayName === 'string')
        patch.display_name = req.body.displayName.trim().slice(0, 120);
      if (req.body?.skillDomain) patch.skill_domain = normalizeSkillKey(req.body.skillDomain);
      if (req.body?.level) patch.level = String(req.body.level);
      patch.updated_at = new Date().toISOString();

      await admin.from('profiles').update(patch).eq('id', uid);

      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      res.json({ profile });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Start tracking loop explicitly (stores loop_started_at and syncs cycle) */
  r.post('/api/me/start-loop', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      await admin.from('profiles').update({ loop_started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', uid);
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycle = await ensureUserCycle(admin, uid, profile);
      res.json({ ok: true, cycle, profile });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Current cycle timers + locked task + selection window */
  r.get('/api/me/cycle', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycle = await ensureUserCycle(admin, uid, profile);
      res.json({ cycle, profile });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/api/me/confirm-task', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const taskId = req.body?.taskId;
      if (!taskId) return res.status(400).json({ error: 'taskId required' });

      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycleWrap = await ensureUserCycle(admin, uid, profile);
      const { data: tid } = await admin.from('tasks').select('id').eq('id', taskId).maybeSingle();
      if (!tid) return res.status(404).json({ error: 'Task not found' });

      await admin
        .from('user_cycle_state')
        .update({
          locked_task_id: taskId,
          auto_assigned: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', uid);

      const { data: t } = await admin.from('tasks').select('*').eq('id', taskId).single();
      const freshCycle = await ensureUserCycle(admin, uid, profile);
      res.json({ ok: true, task: mapTaskRow(t), cycle: freshCycle });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Merge proof fields on current cycle bundle */
  r.patch('/api/me/submission', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycleWrap = await ensureUserCycle(admin, uid, profile);
      const bounds = cycleWrap.bounds;
      const cStart = bounds.cycleStartISO;

      let { data: bundle } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('user_id', uid)
        .eq('cycle_start_iso', cStart)
        .maybeSingle();

      if (bundle?.status === 'accepted')
        return res.status(400).json({ error: 'This cycle is already approved.' });

      function pick(next, fallback) {
        return typeof next === 'string' && next.trim()
          ? next.trim()
          : fallback ?? null;
      }
      let shots = [];
      if (Array.isArray(req.body?.screenshot_urls)) shots = req.body.screenshot_urls.filter(Boolean).slice(0, 10);
      if (typeof req.body?.screenshot_url === 'string' && req.body.screenshot_url) shots.push(req.body.screenshot_url);

      const nextTask =
        req.body?.taskId || bundle?.task_id || cycleWrap.lockedTaskId || null;

      const nextShots =
        shots.length && bundle?.screenshot_urls?.length
          ? [...bundle.screenshot_urls.filter(Boolean), ...shots]
          : shots.length
            ? shots
            : bundle?.screenshot_urls?.length
              ? bundle.screenshot_urls
              : [];

      const upsertPayload = {
        user_id: uid,
        cycle_start_iso: cStart,
        task_id: nextTask,
        github_url: pick(req.body?.github_url, bundle?.github_url),
        live_url: pick(req.body?.live_url, bundle?.live_url),
        demo_video_url: pick(req.body?.demo_video_url, bundle?.demo_video_url),
        screenshot_urls: nextShots,
        file_paths: bundle?.file_paths || [],
        status: 'pending_review',
        admin_feedback: '',
        points_awarded: 0,
        reviewed_at: null,
        updated_at: new Date().toISOString()
      };

      await admin.from('submission_bundles').upsert(upsertPayload, { onConflict: 'user_id,cycle_start_iso' });

      const { data: refreshed } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('user_id', uid)
        .eq('cycle_start_iso', cStart)
        .maybeSingle();

      res.json({ ok: true, bundle: refreshed });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/api/me/submission/file', requireUser, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file required (field name file)' });
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycleWrap = await ensureUserCycle(admin, uid, profile);
      const cStart = cycleWrap.bounds.cycleStartISO;
      let { data: bundle } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('user_id', uid)
        .eq('cycle_start_iso', cStart)
        .maybeSingle();

      if (bundle?.status === 'accepted')
        return res.status(400).json({ error: 'This cycle is already approved.' });

      const rel = `/uploads/${req.file.filename}`;
      const files = [...(bundle?.file_paths || []).filter(Boolean), rel];

      const upsertPayload = {
        user_id: uid,
        cycle_start_iso: cStart,
        task_id: bundle?.task_id || cycleWrap.lockedTaskId,
        github_url: bundle?.github_url ?? null,
        live_url: bundle?.live_url ?? null,
        demo_video_url: bundle?.demo_video_url ?? null,
        screenshot_urls: bundle?.screenshot_urls || [],
        file_paths: files,
        status: 'pending_review',
        admin_feedback: '',
        points_awarded: 0,
        reviewed_at: null,
        updated_at: new Date().toISOString()
      };

      await admin.from('submission_bundles').upsert(upsertPayload, { onConflict: 'user_id,cycle_start_iso' });
      res.json({ ok: true, path: rel, file_paths: files });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  /** Task history tiles for rewards dashboard */
  r.get('/api/me/submission-history', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: rows } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);
      res.json({ bundles: rows || [] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  r.get('/api/me/summary', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycle = await ensureUserCycle(admin, uid, profile);
      const { data: bundle } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('user_id', uid)
        .eq('cycle_start_iso', cycle.bounds.cycleStartISO)
        .maybeSingle();

      res.json({
        profile,
        cycle,
        submission: bundle || null,
        reviewerNote: bundle?.admin_feedback || '',
        reviewerStatus: bundle?.status || 'none'
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  return r;
};
