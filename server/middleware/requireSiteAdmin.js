const jwt = require('jsonwebtoken');

exports.requireSiteAdmin = (req, res, next) => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) return res.status(503).json({ error: 'Admin auth not configured (ADMIN_JWT_SECRET).' });
  const raw = req.cookies?.skilling_site_admin;
  if (!raw) return res.status(401).json({ error: 'Admin session required.' });
  try {
    const payload = jwt.verify(raw, secret);
    if (payload.role !== 'site_admin') return res.status(403).json({ error: 'Forbidden.' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Bad admin token.' });
  }
};
