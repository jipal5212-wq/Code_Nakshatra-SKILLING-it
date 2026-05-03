const { verifyBearerUser } = require('../lib/supabase');

exports.requireUser = async (req, res, next) => {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' });
  const { user, error } = await verifyBearerUser(token);
  if (!user || error) return res.status(401).json({ error: 'Invalid or expired session.' });
  req.accessToken = token;
  req.user = user;
  next();
};
