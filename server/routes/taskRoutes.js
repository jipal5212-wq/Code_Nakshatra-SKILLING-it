const express = require('express');
const { mapTaskRow } = require('./mapTask');

module.exports = function taskRoutes(admin) {
  const r = express.Router();

  r.get('/api/tasks', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ tasks: [], error: 'No database.' });
      let { data } = await admin.from('tasks').select('*').order('domain', { ascending: true }).order('title', { ascending: true });
      let list = data || [];
      if (req.query.domain)
        list = list.filter((t) => String(t.domain) === req.query.domain);
      if (req.query.level)
        list = list.filter((t) => String(t.level) === req.query.level);
      res.json({ tasks: list.map(mapTaskRow) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message, tasks: [] });
    }
  });

  return r;
};
