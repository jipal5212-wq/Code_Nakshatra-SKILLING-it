const express = require('express');
const { requireUser } = require('../middleware/requireUser');

module.exports = function tfeedRoutes(admin, geminiModel) {
  const r = express.Router();

  // ── helpers ────────────────────────────────────────────────────────────────
  function mapPost(row, likeCount, commentCount, userLiked) {
    return {
      id:            row.id,
      title:         row.title,
      summary:       row.summary,
      tags:          row.tags || [],
      domain:        row.domain || '',
      sourceHint:    row.source_hint || '',
      articleUrl:    row.article_url || '',
      imageUrl:      row.image_url || '',
      pubDate:       row.pub_date || '',
      projectIdea:   row.project_idea || '',
      projectStack:  row.project_stack || '',
      projectEffort: row.project_effort || '~2 hrs',
      likeCount:     likeCount ?? row.like_count ?? 0,
      commentCount:  commentCount ?? row.comment_count ?? 0,
      userLiked:     userLiked || false,
      createdAt:     row.created_at
    };
  }

  async function tablesExist() {
    const { error } = await admin.from('tfeed_posts').select('id').limit(1);
    return !error;
  }

  // Domain keyword map — used when Gemini is unavailable
  const DOMAIN_KEYWORDS = {
    'AI/ML':         ['ai','artificial intelligence','machine learning','deep learning','llm','gpt','openai','neural','chatgpt','gemini','mistral','claude','anthropic'],
    'Cybersecurity': ['cyber','hack','security','breach','ransomware','malware','phishing','vulnerability','exploit','zero-day','cve'],
    'Web Dev':       ['javascript','react','node','web','frontend','backend','html','css','framework','nextjs','vite','typescript','api'],
    'Data Science':  ['data','analytics','bigdata','pandas','spark','dataset','visualization','statistics'],
    'Robotics':      ['robot','drone','autonomous','automation','actuator','humanoid'],
    'IoT':           ['iot','sensor','embedded','raspberry','arduino','smart home','wearable','edge computing']
  };
  function classifyDomain(text) {
    const t = text.toLowerCase();
    for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
      if (kws.some(k => t.includes(k))) return domain;
    }
    return 'General';
  }

  // ── GET /api/tfeed ─────────────────────────────────────────────────────────
  r.get('/api/tfeed', async (req, res) => {
    try {
      if (!admin) return res.json({ posts: [] });
      if (!await tablesExist()) return res.json({ posts: [], setup: true });

      const { data: posts, error } = await admin
        .from('tfeed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return res.json({ posts: [] });

      // Get auth user if present
      const authHeader = req.headers.authorization || '';
      let userId = null;
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user } } = await admin.auth.getUser(token).catch(() => ({ data: {} }));
        userId = user?.id || null;
      }

      // Fetch like counts and user likes in bulk
      const ids = (posts || []).map(p => p.id);
      let likesMap = {}, userLikesSet = new Set();
      if (ids.length) {
        const { data: likes } = await admin.from('tfeed_likes').select('post_id, user_id').in('post_id', ids);
        (likes || []).forEach(l => {
          likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
          if (userId && l.user_id === userId) userLikesSet.add(l.post_id);
        });
      }

      res.json({
        posts: (posts || []).map(p => mapPost(p, likesMap[p.id] || 0, p.comment_count, userLikesSet.has(p.id)))
      });
    } catch (e) {
      console.error('[tfeed]', e);
      res.json({ posts: [] });
    }
  });

  // ── POST /api/tfeed/refresh (NewsData.io → optional Gemini enrichment) ─────
  r.post('/api/tfeed/refresh', async (req, res) => {
    try {
      if (!admin) return res.status(503).json({ error: 'DB not configured.' });
      if (!await tablesExist()) return res.status(503).json({ error: 'Run DB setup first.', setup: true });

      const ndKey = process.env.NEWSDATA_API_KEY;
      if (!ndKey) return res.status(503).json({ error: 'NEWSDATA_API_KEY not set.' });

      // 1. Fetch latest Tech news from NewsData.io
      const ndUrl = `https://newsdata.io/api/1/latest?apikey=${ndKey}&q=Tech%20news&language=en&size=10`;
      const ndRes = await fetch(ndUrl);
      if (!ndRes.ok) return res.status(502).json({ error: 'NewsData.io fetch failed: ' + ndRes.status });
      const ndData = await ndRes.json();
      const articles = (ndData.results || []).filter(a => a.title && (a.description || a.content)).slice(0, 10);
      if (!articles.length) return res.status(502).json({ error: 'No articles returned from NewsData.io.' });

      console.log(`[tfeed/refresh] Fetched ${articles.length} articles from NewsData.io`);

      // 2. Enrich — Gemini is fully optional.
      //    Once a quota/429 error is hit, geminiOk flips false and we stop calling it.
      let geminiOk = !!geminiModel;
      const enriched = [];

      for (const a of articles) {
        const summary = String(a.description || a.content || '').slice(0, 400);

        // Always-available: tags from NewsData keywords + categories
        const rawTags = [
          ...(Array.isArray(a.keywords) ? a.keywords : []),
          ...(Array.isArray(a.category)  ? a.category  : [])
        ].map(t => String(t).toLowerCase().replace(/\s+/g, '-')).filter(Boolean);
        let tags = [...new Set(rawTags)].slice(0, 4);
        if (!tags.length) tags = ['tech', 'news'];

        // Always-available: domain classification by keyword scan
        const domain = classifyDomain(a.title + ' ' + summary);

        // Optional Gemini project-idea enrichment
        let projectIdea = '', projectStack = '', projectEffort = '~2 hrs';
        if (geminiOk) {
          try {
            const prompt =
              `Tech news article:\nTitle: "${a.title}"\nSummary: "${summary.slice(0, 300)}"\n\n` +
              `Return ONLY valid JSON (no markdown):\n` +
              `{"projectIdea":"hands-on project a dev can build (60 words max)","projectStack":"e.g. Python, React","projectEffort":"e.g. ~3 hours"}`;
            const result = await geminiModel.generateContent(prompt);
            const match  = result.response.text().match(/\{[\s\S]*\}/);
            if (match) {
              const p = JSON.parse(match[0]);
              projectIdea   = p.projectIdea   || '';
              projectStack  = p.projectStack  || '';
              projectEffort = p.projectEffort || '~2 hrs';
            }
          } catch (geminiErr) {
            const msg = String(geminiErr?.message || '');
            if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many') || msg.includes('limit')) {
              console.warn('[tfeed/refresh] Gemini quota exceeded — skipping enrichment for rest of batch.');
              geminiOk = false;
            }
            // Transient error: leave projectIdea empty, keep trying for next articles
          }
        }

        enriched.push({
          title:          String(a.title || '').slice(0, 200),
          summary:        summary.slice(0, 1000),
          tags,
          domain,
          source_hint:    a.source_name || a.source_id || (Array.isArray(a.creator) ? a.creator[0] : '') || 'Tech News',
          article_url:    a.link        || '',
          image_url:      a.image_url   || '',
          pub_date:       a.pubDate     || a.pubDateTZ || '',
          project_idea:   projectIdea,
          project_stack:  projectStack,
          project_effort: projectEffort,
          like_count:     0,
          comment_count:  0
        });
      }

      // 3. Insert — try full schema; fall back silently if new columns aren't migrated yet
      let inserted, insErr;
      ({ data: inserted, error: insErr } = await admin.from('tfeed_posts').insert(enriched).select());

      if (insErr) {
        const colErr = insErr.message && (
          insErr.message.includes('article_url') ||
          insErr.message.includes('image_url')   ||
          insErr.message.includes('pub_date')     ||
          insErr.code === '42703'
        );
        if (colErr) {
          console.warn('[tfeed/refresh] New columns not found — falling back to legacy schema. Run the ALTER TABLE migration.');
          const legacy = enriched.map(({ article_url, image_url, pub_date, ...rest }) => rest);
          ({ data: inserted, error: insErr } = await admin.from('tfeed_posts').insert(legacy).select());
        }
      }

      if (insErr) return res.status(500).json({ error: insErr.message });

      res.json({
        ok: true,
        count: inserted.length,
        geminiUsed: !!geminiModel && geminiOk,
        posts: inserted.map(p => mapPost(p, 0, 0, false))
      });
    } catch (e) {
      console.error('[tfeed/refresh]', e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── POST /api/tfeed/:id/like ───────────────────────────────────────────────
  r.post('/api/tfeed/:id/like', requireUser, async (req, res) => {
    try {
      if (!await tablesExist()) return res.status(503).json({ error: 'Setup required.' });
      const postId = req.params.id;
      const userId = req.user.id;

      const { data: existing } = await admin.from('tfeed_likes').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
      let liked;
      if (existing) {
        await admin.from('tfeed_likes').delete().eq('id', existing.id);
        liked = false;
      } else {
        await admin.from('tfeed_likes').insert({ post_id: postId, user_id: userId });
        liked = true;
      }

      const { count } = await admin.from('tfeed_likes').select('id', { count: 'exact' }).eq('post_id', postId);
      res.json({ liked, likeCount: count || 0 });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── GET /api/tfeed/:id/comments ───────────────────────────────────────────
  r.get('/api/tfeed/:id/comments', async (req, res) => {
    try {
      if (!await tablesExist()) return res.json({ comments: [] });
      const { data, error } = await admin.from('tfeed_comments').select('*').eq('post_id', req.params.id).order('created_at', { ascending: true }).limit(50);
      if (error) return res.json({ comments: [] });
      res.json({ comments: data || [] });
    } catch (e) {
      res.json({ comments: [] });
    }
  });

  // ── POST /api/tfeed/:id/comment ───────────────────────────────────────────
  r.post('/api/tfeed/:id/comment', requireUser, async (req, res) => {
    try {
      if (!await tablesExist()) return res.status(503).json({ error: 'Setup required.' });
      const content = String(req.body?.content || '').trim().slice(0, 500);
      if (!content) return res.status(400).json({ error: 'Comment cannot be empty.' });

      const { data: profile } = await admin.from('profiles').select('display_name').eq('id', req.user.id).maybeSingle();
      const displayName = profile?.display_name || 'Learner';

      const { data: comment, error } = await admin.from('tfeed_comments').insert({
        post_id:      req.params.id,
        user_id:      req.user.id,
        display_name: displayName,
        content
      }).select().single();
      if (error) return res.status(500).json({ error: error.message });

      // bump comment_count
      await admin.from('tfeed_posts').update({ comment_count: admin.raw?.('comment_count + 1') }).eq('id', req.params.id).catch(() => {});

      res.json({ comment });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
};
