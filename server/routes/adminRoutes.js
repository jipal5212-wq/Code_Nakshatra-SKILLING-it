const express = require('express');
const jwt = require('jsonwebtoken');
const { requireSiteAdmin } = require('../middleware/requireSiteAdmin');
const { mapTaskRow } = require('./mapTask');

function mapNewsRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    details: row.details,
    relatedTasks: row.related_tasks || '',
    imageUrl: row.image_url,
    createdAt: row.created_at
  };
}

module.exports = function adminRoutes(admin, upload) {
  const r = express.Router();

  r.post('/api/admin/site-login', (req, res) => {
    const pass = process.env.ADMIN_SITE_PASSWORD;
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!pass || !secret)
      return res.status(503).json({ error: 'ADMIN_SITE_PASSWORD and ADMIN_JWT_SECRET must be set.' });
    if (String(req.body?.password || '') !== pass) return res.status(401).json({ error: 'Invalid password.' });
    const token = jwt.sign({ role: 'site_admin' }, secret, { expiresIn: '18h' });
    res.cookie('skilling_site_admin', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 18 * 3600 * 1000,
      path: '/'
    });
    res.json({ ok: true });
  });

  r.post('/api/admin/site-logout', (_req, res) => {
    res.clearCookie('skilling_site_admin', { path: '/' });
    res.json({ ok: true });
  });

  r.get('/api/admin/session', requireSiteAdmin, (_req, res) => {
    res.json({ ok: true, role: 'site_admin' });
  });

  r.post('/api/admin/be-relevant', requireSiteAdmin, upload.single('image'), async (req, res) => {
    try {
      const title = String(req.body?.title || '').trim();
      const details = String(req.body?.details || '').trim();
      const relatedTasks = String(req.body?.relatedTasks || '').trim();
      if (!title || !details) return res.status(400).json({ error: 'Title and details required.' });
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const { data, error } = await admin
        .from('be_relevant_posts')
        .insert({
          title,
          details,
          related_tasks: relatedTasks,
          image_url: imageUrl
        })
        .select('*')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, news: mapNewsRow(data) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.get('/api/admin/users-with-pending', requireSiteAdmin, async (_req, res) => {
    try {
      const { data: bundles, error } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('status', 'pending_review')
        .order('updated_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });

      const userIds = [...new Set((bundles || []).map((b) => b.user_id))];
      const { data: profiles } = await admin.from('profiles').select('*').in('id', userIds);

      const profMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      const grouped = {};
      for (const b of bundles || []) {
        if (!grouped[b.user_id]) grouped[b.user_id] = { user: profMap[b.user_id] || { id: b.user_id }, submissions: [] };
        let task = null;
        if (b.task_id) {
          const { data: t } = await admin.from('tasks').select('*').eq('id', b.task_id).maybeSingle();
          task = t ? mapTaskRow(t) : null;
        }
        grouped[b.user_id].submissions.push({ ...b, task });
      }

      res.json({ groups: Object.values(grouped) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.get('/api/admin/all-submissions', requireSiteAdmin, async (_req, res) => {
    try {
      const { data, error } = await admin
        .from('submission_bundles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ submissions: data || [] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/api/admin/review-submission', requireSiteAdmin, async (req, res) => {
    try {
      const submissionId = req.body?.submissionId;
      const status = req.body?.status === 'accepted' ? 'accepted' : 'rejected';
      const feedback = String(req.body?.feedback || '').slice(0, 2000);
      const points = Math.max(0, parseInt(req.body?.points || '0', 10) || 0);
      if (!submissionId) return res.status(400).json({ error: 'submissionId required' });

      const { data: row, error: fErr } = await admin
        .from('submission_bundles')
        .select('*')
        .eq('id', submissionId)
        .single();
      if (fErr || !row) return res.status(404).json({ error: 'Submission not found' });
      if (row.status === 'accepted') return res.status(400).json({ error: 'Already reviewed as accepted.' });

      if (status === 'accepted' && points > 0) {
        const { data: prof } = await admin.from('profiles').select('points').eq('id', row.user_id).single();
        const next = (prof?.points || 0) + points;
        await admin.from('profiles').update({ points: next, updated_at: new Date().toISOString() }).eq('id', row.user_id);
      }

      const { data: updated, error: uErr } = await admin
        .from('submission_bundles')
        .update({
          status,
          admin_feedback: feedback,
          points_awarded: status === 'accepted' ? points : 0,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select('*')
        .single();
      if (uErr) return res.status(500).json({ error: uErr.message });

      res.json({ success: true, submission: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/api/admin/tasks', requireSiteAdmin, async (req, res) => {
    try {
      const { domain, level, title, desc, objective, watchSegment, expectedOutput, effort, ytQuery } = req.body;
      if (!title || !domain) return res.status(400).json({ error: 'Title and domain required' });
      const row = {
        domain,
        level: level || 'Beginner',
        title,
        description: desc || '',
        objective: objective || '',
        watch_segment: watchSegment || '',
        expected_output: expectedOutput || '',
        effort: effort || '~1 hr',
        yt_query: ytQuery || `${title} tutorial`
      };
      const { data, error } = await admin.from('tasks').insert(row).select('*').single();
      if (error) return res.status(500).json({ error: error.message });
      res.json({ success: true, task: mapTaskRow(data) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
};
