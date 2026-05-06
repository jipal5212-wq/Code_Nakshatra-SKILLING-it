const express = require('express');
const { SKILL_MAP, normalizeSkillKey } = require('../lib/skills');
const { searchYouTube } = require('../lib/youtubeVideos');
const { loadMatchingTasks } = require('../services/cycleService');
const { mapTaskRow } = require('./mapTask');

module.exports = function publicRoutes(admin) {
  const r = express.Router();

  r.get('/api/public/content-pack', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ error: 'Database not configured.' });
      const skillKey = normalizeSkillKey(req.query.skill || 'aiml');
      const level = req.query.level || 'Beginner';
      const sm = SKILL_MAP[skillKey] || SKILL_MAP.aiml;

      const { source, videos: rawVideos } = await searchYouTube(`${sm.query} ${level}`, 8);
      const videos = rawVideos.slice(0, 7);

      let pool = await loadMatchingTasks(admin, skillKey, level);
      if (!pool.length) {
        const { data: fallback } = await admin.from('tasks').select('*').limit(20);
        pool = fallback || [];
      }

      const items = videos.map((v, i) => ({
        video: v,
        task: pool.length ? mapTaskRow(pool[i % pool.length]) : null,
        suggestedTaskId: pool.length ? pool[i % pool.length].id : null
      }));

      res.json({ skillKey, level, source, items });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Pack failed.' });
    }
  });

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

  /** Explore: beginner tasks + clips for any domain. Auth-optional. */
  r.get('/api/public/explore', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ error: 'Database not configured.' });
      const skillKey = normalizeSkillKey(req.query.skill || 'aiml');
      const sm = SKILL_MAP[skillKey] || SKILL_MAP.aiml;

      // Always beginner for exploration
      let pool = await loadMatchingTasks(admin, skillKey, 'Beginner');
      if (!pool.length) {
        const { data: fallback } = await admin.from('tasks').select('*').eq('level', 'Beginner').limit(10);
        pool = fallback || [];
      }
      const tasks = pool.slice(0, 7).map(mapTaskRow);

      // YouTube clips for this domain
      const { source, videos: rawVideos } = await searchYouTube(`${sm.query} beginner tutorial`, 4);
      const videos = rawVideos.slice(0, 4);

      // Domain task counts (for the card badges)
      const { data: allTasks } = await admin.from('tasks').select('domain, level');
      const counts = {};
      for (const key of Object.keys(SKILL_MAP)) {
        counts[key] = (allTasks || []).filter(t => {
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

      res.json({ skillKey, label: sm.label, tasks, videos, source, counts });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Explore failed.' });
    }
  });

  return r;
};
