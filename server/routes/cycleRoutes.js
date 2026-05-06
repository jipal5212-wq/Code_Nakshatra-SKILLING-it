const express = require('express');
const { requireUser } = require('../middleware/requireUser');
const { ensureUserCycle, loadMatchingTasks, pickWeightedRandom, mapProfileRow } = require('../services/cycleService');
const { mapTaskRow } = require('./mapTask');

/**
 * Bridges /api/cycles/* (called by arena.html) to the real cycleService.
 *
 * Rules implemented:
 *  - Day 1 (first cycle ever): if selection window is still open →
 *      show tasks, user picks. If window closes with no pick → auto-assign.
 *  - Day 1 instant-auto: if user clicks "Auto-Assign" → auto-assign immediately.
 *  - Day 2+ (any subsequent cycle): user picks normally every morning.
 *      Window still auto-assigns after 2 h if they miss it.
 */
module.exports = function cycleRoutes(admin) {
  const r = express.Router();

  /* ─── GET /api/cycles/current ─────────────────────────────────────── */
  r.get('/api/cycles/current', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();

      // Check if this is truly the user's first-ever cycle
      const { data: history } = await admin
        .from('user_cycle_state')
        .select('cycle_start_iso')
        .eq('user_id', uid);
      const isFirstCycle = !history || history.length === 0;

      const cycle = await ensureUserCycle(admin, uid, profile);

      // Fetch the locked task details (if any)
      let lockedTask = cycle.lockedTask || null;

      res.json({
        cycle: {
          ...cycle,
          isFirstCycle,
          locked_task_id: cycle.lockedTaskId,
          auto_assigned: cycle.autoAssigned,
          selection_window_open: cycle.selectionWindowOpen,
          selection_deadline_ms: cycle.selectionDeadlineMs,
          cycle_ends_ms: cycle.cycleEndsMs,
          locked_task: lockedTask
        }
      });
    } catch (e) {
      console.error('[cycles/current]', e);
      res.status(500).json({ error: e.message });
    }
  });

  /* ─── POST /api/cycles/select-task ──────────────────────────────────── */
  r.post('/api/cycles/select-task', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { taskId } = req.body || {};
      if (!taskId) return res.status(400).json({ error: 'taskId required' });

      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const cycle = await ensureUserCycle(admin, uid, profile);

      // Validate task exists
      const { data: t } = await admin.from('tasks').select('*').eq('id', taskId).maybeSingle();
      if (!t) return res.status(404).json({ error: 'Task not found' });

      // Only allow selection if window is open OR task not already locked by admin/auto
      if (!cycle.selectionWindowOpen && cycle.lockedTaskId) {
        return res.status(400).json({ error: 'Selection window has closed. Your task is already locked.' });
      }

      await admin
        .from('user_cycle_state')
        .upsert({
          user_id: uid,
          locked_task_id: taskId,
          auto_assigned: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      const freshCycle = await ensureUserCycle(admin, uid, profile);
      res.json({ success: true, message: 'Task confirmed!', task: mapTaskRow(t), cycle: freshCycle });
    } catch (e) {
      console.error('[cycles/select-task]', e);
      res.status(500).json({ error: e.message });
    }
  });

  /* ─── POST /api/cycles/auto-assign ──────────────────────────────────── */
  /* User explicitly clicks "Auto-Assign" button */
  r.post('/api/cycles/auto-assign', requireUser, async (req, res) => {
    try {
      const uid = req.user.id;
      const { data: profile } = await admin.from('profiles').select('*').eq('id', uid).single();
      const p = mapProfileRow(profile);

      // Ensure cycle row exists before updating it
      await ensureUserCycle(admin, uid, profile);

      const pool = await loadMatchingTasks(admin, p.skill_domain, p.level);
      const picked = pickWeightedRandom(pool);
      if (!picked) return res.status(404).json({ error: 'No tasks available for your domain. Use the pool to pick one.' });

      await admin
        .from('user_cycle_state')
        .upsert({
          user_id: uid,
          locked_task_id: picked.id,
          auto_assigned: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      const freshCycle = await ensureUserCycle(admin, uid, profile);
      res.json({ success: true, task: mapTaskRow(picked), cycle: freshCycle });
    } catch (e) {
      console.error('[cycles/auto-assign]', e);
      res.status(500).json({ error: e.message });
    }
  });

  return r;
};
