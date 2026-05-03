/** Map URL/query skill keys → DB-style domain substring & YouTube query boosters */
exports.SKILL_MAP = {
  aiml: { label: 'AI / ML', query: 'AI machine learning beginner project tutorial' },
  datascience: { label: 'Data Science', query: 'data science pandas python beginner project tutorial' },
  robotics: { label: 'Robotics', query: 'robotics arduino robotics project tutorial' },
  iot: { label: 'IoT', query: 'IoT ESP32 sensors MQTT beginner project tutorial' },
  cybersec: { label: 'Cybersecurity', query: 'cybersecurity ethical hacking beginner lab tutorial' },
  webdev: { label: 'Web Dev', query: 'web development react node beginner project tutorial' }
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
