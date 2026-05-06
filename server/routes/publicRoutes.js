const express = require('express');
const { SKILL_MAP, normalizeSkillKey } = require('../lib/skills');
const { searchYouTube } = require('../lib/youtubeVideos');
const { generateTasks } = require('../lib/geminiTasks');

module.exports = function publicRoutes(admin, geminiModel) {
  const r = express.Router();

  /* ─────────────────────────────────────────────────────────────────
   * GET /api/public/content-pack?skill=aiml&level=Beginner
   * Returns 7 video+task pairs, each task AI-generated and each
   * video specifically matched to that task's ytQuery.
   * ─────────────────────────────────────────────────────────────── */
  r.get('/api/public/content-pack', async (req, res) => {
    try {
      const skillKey = normalizeSkillKey(req.query.skill || 'aiml');
      const level    = req.query.level || 'Beginner';

      // 1. Generate 7 tasks via Gemini (falls back to static if Gemini unavailable)
      const tasks = await generateTasks(geminiModel, skillKey, level);

      // 2. Fetch a matching video per task using the task's ytQuery
      //    Run all fetches in parallel for speed, fall back individually
      const sm = SKILL_MAP[skillKey] || SKILL_MAP.aiml;
      const videoPromises = tasks.map(async (task) => {
        const q = task.ytQuery || `${task.title} tutorial project`;
        try {
          const { videos } = await searchYouTube(q, 3);
          return videos[0] || null;
        } catch {
          const { videos } = await searchYouTube(`${sm.query} project`, 2);
          return videos[0] || null;
        }
      });

      const videos = await Promise.all(videoPromises);

      // 3. Pair each task with its video
      const items = tasks.map((task, i) => ({
        video: videos[i] || null,
        task,
        suggestedTaskId: task.id
      }));

      res.json({ skillKey, level, source: tasks[0]?.source || 'gemini', items });
    } catch (e) {
      console.error('[content-pack]', e);
      res.status(500).json({ error: e.message || 'Pack failed.' });
    }
  });

  /* ─────────────────────────────────────────────────────────────────
   * GET /api/youtube/search?q=...&maxResults=6
   * ─────────────────────────────────────────────────────────────── */
  r.get('/api/youtube/search', async (req, res) => {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'Query required' });
    try {
      const { source, videos } = await searchYouTube(q, parseInt(req.query.maxResults || '6', 10));
      res.json({ success: true, source, videos });
    } catch {
      const { videos } = await searchYouTube(q);
      res.json({ success: true, source: 'fallback', videos });
    }
  });

  /* ─────────────────────────────────────────────────────────────────
   * GET /api/public/explore?skill=aiml
   * Explore page: beginner tasks + clips for any domain.
   * ─────────────────────────────────────────────────────────────── */
  r.get('/api/public/explore', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ error: 'Database not configured.' });
      const skillKey = normalizeSkillKey(req.query.skill || 'aiml');
      const sm = SKILL_MAP[skillKey] || SKILL_MAP.aiml;

      // Generate beginner tasks for explore
      const allTasks = await generateTasks(geminiModel, skillKey, 'Beginner');
      const tasks = allTasks.slice(0, 7);

      // Fetch 4 videos matched to the first 4 tasks
      const videoPromises = tasks.slice(0, 4).map(async (task) => {
        try {
          const { videos } = await searchYouTube(task.ytQuery || sm.query, 2);
          return videos[0] || null;
        } catch {
          return null;
        }
      });
      const videos = (await Promise.all(videoPromises)).filter(Boolean);

      // Domain task counts (from DB if available)
      let counts = {};
      try {
        const { data: allDBTasks } = await admin.from('tasks').select('domain, level');
        const { SKILL_MAP: SM } = require('../lib/skills');
        for (const key of Object.keys(SM)) {
          counts[key] = (allDBTasks || []).filter(t => {
            const d = String(t.domain || '').toLowerCase();
            if (key === 'aiml')        return d.includes('ai') || d.includes('ml');
            if (key === 'datascience') return d.includes('data');
            if (key === 'robotics')    return d.includes('robot');
            if (key === 'iot')         return d.includes('iot');
            if (key === 'cybersec')    return d.includes('cyber') || d.includes('sec');
            if (key === 'webdev')      return d.includes('web');
            return false;
          }).length;
        }
      } catch { counts = {}; }

      res.json({ skillKey, label: sm.label, tasks, videos, source: tasks[0]?.source || 'gemini', counts });
    } catch (e) {
      console.error('[explore]', e);
      res.status(500).json({ error: e.message || 'Explore failed.' });
    }
  });

  return r;
};
