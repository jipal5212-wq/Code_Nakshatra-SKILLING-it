/**
 * One-time sync: copy existing be_relevant_posts → tfeed_posts
 * Run: node sync-news-to-tfeed.js
 */
require('dotenv').config({ path: '.env' });
const { getAdminClient } = require('./server/lib/supabase');

(async () => {
  const admin = getAdminClient();
  if (!admin) { console.error('❌ Supabase not configured'); process.exit(1); }

  // 1. Fetch all be_relevant_posts
  const { data: newsPosts, error: fetchErr } = await admin
    .from('be_relevant_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchErr) { console.error('❌ Fetch error:', fetchErr.message); process.exit(1); }
  console.log(`Found ${newsPosts.length} posts in be_relevant_posts`);

  // 2. Check which ones are already in tfeed_posts (by matching title + source_hint=Admin)
  const { data: existing } = await admin
    .from('tfeed_posts')
    .select('title')
    .eq('source_hint', 'Admin');

  const existingTitles = new Set((existing || []).map(p => p.title));
  const toInsert = newsPosts.filter(p => !existingTitles.has(p.title));
  console.log(`${toInsert.length} posts need to be synced (${existingTitles.size} already in tfeed)`);

  if (!toInsert.length) { console.log('✅ All posts already synced!'); process.exit(0); }

  // 3. Insert missing posts
  const rows = toInsert.map(p => {
    const tags = p.related_tasks
      ? p.related_tasks.split(/[,·\s]+/).map(t => t.trim()).filter(Boolean)
      : ['admin', 'news'];
    return {
      title: p.title,
      summary: p.details,
      tags,
      domain: 'General',
      source_hint: 'Admin',
      article_url: '',
      image_url: p.image_url || '',
      pub_date: p.created_at,
      project_idea: '',
      project_stack: '',
      project_effort: '',
      like_count: 0,
      comment_count: 0
    };
  });

  let { data: inserted, error: insErr } = await admin.from('tfeed_posts').insert(rows).select();

  // Fall back to legacy schema if new columns don't exist
  if (insErr && (insErr.message.includes('article_url') || insErr.message.includes('image_url') || insErr.message.includes('pub_date') || insErr.code === '42703')) {
    console.log('⚠️  New columns not found — using legacy schema (run ALTER TABLE to add article_url, image_url, pub_date)');
    const legacyRows = rows.map(({ article_url, image_url, pub_date, ...rest }) => rest);
    ({ data: inserted, error: insErr } = await admin.from('tfeed_posts').insert(legacyRows).select());
  }
  if (insErr) { console.error('❌ Insert error:', insErr.message); process.exit(1); }

  console.log(`✅ Successfully synced ${inserted.length} posts to tfeed_posts!`);
  inserted.forEach(p => console.log(`   → ${p.title}`));
  process.exit(0);
})();
