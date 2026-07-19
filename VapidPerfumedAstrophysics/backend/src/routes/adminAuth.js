const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signAccess, signRefresh, verifyRefresh, requireAdmin, REFRESH_TOKEN_TTL } = require('../middleware/auth');

const router = express.Router();
const REFRESH_MS = 90 * 24 * 60 * 60 * 1000;

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase()]);
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const accessToken = signAccess({ sub: admin.id, type: 'admin', scope: admin.scope });
    const refreshToken = signRefresh({ sub: admin.id, type: 'admin' });
    await db.query(
      'INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)',
      [admin.id, refreshToken, new Date(Date.now() + REFRESH_MS)]
    );
    const { password_hash, ...safeAdmin } = admin;
    res.json({ admin: safeAdmin, accessToken, refreshToken });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/admin/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = verifyRefresh(refreshToken);
    if (payload.type !== 'admin') return res.status(401).json({ error: 'Invalid token type' });
    const stored = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND admin_id = $2 AND expires_at > NOW()',
      [refreshToken, payload.sub]
    );
    if (!stored.rows.length) return res.status(401).json({ error: 'Invalid refresh token' });
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const adminRes = await db.query('SELECT id, scope FROM admins WHERE id = $1', [payload.sub]);
    const admin = adminRes.rows[0];
    const newAccess = signAccess({ sub: payload.sub, type: 'admin', scope: admin.scope });
    const newRefresh = signRefresh({ sub: payload.sub, type: 'admin' });
    await db.query(
      'INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)',
      [payload.sub, newRefresh, new Date(Date.now() + REFRESH_MS)]
    );
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/admin/auth/logout
router.post('/logout', requireAdmin, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  res.json({ ok: true });
});

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res) => {
  const result = await db.query(
    'SELECT id, name, email, scope, created_at FROM admins WHERE id = $1',
    [req.adminId]
  );
  res.json(result.rows[0]);
});

// POST /api/admin/auth/create-admin (any admin can create a project-scoped admin)
router.post('/create-admin', requireAdmin, async (req, res) => {
  const { name, email, password, project_id, scope = 'project' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  // Only global admins can create global admins
  if (scope === 'global' && req.adminScope !== 'global') {
    return res.status(403).json({ error: 'Only global admins can create global admins' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO admins (name, email, password_hash, scope, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, scope, created_at`,
      [name, email.toLowerCase(), hash, scope, req.adminId]
    );
    const newAdmin = result.rows[0];
    // Scope to project if project_id provided
    if (project_id) {
      await db.query(
        'INSERT INTO admin_projects (admin_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newAdmin.id, project_id]
      );
    }
    // Audit log
    await db.query(
      `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id, metadata)
       VALUES ($1, 'create_admin', 'admin', $2, $3)`,
      [req.adminId, newAdmin.id, JSON.stringify({ scope, project_id })]
    );
    res.status(201).json(newAdmin);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

module.exports = router;
