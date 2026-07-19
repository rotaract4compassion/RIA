const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ria-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ria-refresh-dev-secret';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '90d';

function signAccess(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefresh(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function verifyAccess(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

function requireUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccess(token);
    if (payload.type !== 'user') return res.status(403).json({ error: 'Forbidden' });
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccess(token);
    if (payload.type !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.adminId = payload.sub;
    req.adminScope = payload.scope;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireGlobalAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.adminScope !== 'global') {
      return res.status(403).json({ error: 'Global admin access required' });
    }
    next();
  });
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, requireUser, requireAdmin, requireGlobalAdmin, REFRESH_TOKEN_TTL };
