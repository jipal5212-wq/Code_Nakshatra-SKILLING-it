/** Map URL/query skill keys → DB-style domain substring & YouTube query boosters */
exports.SKILL_MAP = {
  aiml:        { label: 'AI / ML',        query: 'build machine learning model from scratch python project' },
  datascience: { label: 'Data Science',   query: 'data science project pandas python build analyze' },
  robotics:    { label: 'Robotics',       query: 'arduino robot project build from scratch tutorial' },
  iot:         { label: 'IoT',            query: 'ESP32 IoT project build sensor dashboard MQTT' },
  cybersec:    { label: 'Cybersecurity',  query: 'ethical hacking python project build network scanner CTF' },
  webdev:      { label: 'Web Dev',        query: 'build full stack web app react node project tutorial' }
};

exports.normalizeSkillKey = (raw) => {
  if (!raw) return 'aiml';
  const rl = String(raw).toLowerCase();
  if (rl.includes('data science')) return 'datascience';
  if (rl.includes('web dev')) return 'webdev';
  if (rl.includes('cyber')) return 'cybersec';
  if (rl.includes('robot')) return 'robotics';
  if (rl.includes('iot')) return 'iot';
  if ((rl.includes('ai') || rl.includes('machine learning')) && !rl.includes('data')) return 'aiml';

  const k = String(raw).toLowerCase().replace(/\s+/g, '');
  if (exports.SKILL_MAP[k]) return k;
  if (k.includes('ai')) return 'aiml';
  if (k.includes('data')) return 'datascience';
  if (k.includes('robot')) return 'robotics';
  if (k.includes('iot')) return 'iot';
  if (k.includes('cyber') || k.includes('sec')) return 'cybersec';
  if (k.includes('web')) return 'webdev';
  return 'aiml';
};

exports.domainMatchesSkill = (taskDomain, skillKey) => {
  const d = String(taskDomain || '').toLowerCase();
  switch (skillKey) {
    case 'aiml':
      return d.includes('ai') || d.includes('ml');
    case 'datascience':
      return d.includes('data');
    case 'robotics':
      return d.includes('robot');
    case 'iot':
      return d.includes('iot');
    case 'cybersec':
      return d.includes('cyber') || d.includes('sec') || d.includes('security');
    case 'webdev':
      return d.includes('web');
    default:
      return true;
  }
};
