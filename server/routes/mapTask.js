exports.mapTaskRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    domain: row.domain,
    level: row.level,
    title: row.title,
    objective: row.objective || '',
    watchSegment: row.watch_segment || '',
    expectedOutput: row.expected_output || '',
    desc: row.description || '',
    effort: row.effort || '~1 hr',
    ytQuery: row.yt_query || ''
  };
};
