const express = require('express');

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

module.exports = function newsRoutes(admin) {
  const r = express.Router();

  r.get('/api/news', async (req, res) => {
    try {
      if (!admin) return res.json({ news: [] });
      const { data, error } = await admin
        .from('be_relevant_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message, news: [] });
      res.json({ news: (data || []).map(mapNewsRow) });
    } catch (e) {
      res.status(500).json({ news: [], error: e.message });
    }
  });

  return r;
};
