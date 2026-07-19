const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/admin — list all field users
router.get('/admin', requireAdmin, async (req, res) => {
  const { search } = req.query;
  let query = `SELECT u.id, u.name, u.club, u.email, u.phone, u.identity,
    u.is_flagged, u.is_revoked, u.created_at,
    (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as submission_count
    FROM users u WHERE 1=1`;
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.club ILIKE $${params.length})`;
  }
  query += ' ORDER BY u.created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

// PATCH /api/users/admin/:id/flag — flag/unflag user
router.patch('/admin/:id/flag', requireAdmin, async (req, res) => {
  const { flagged } = req.body;
  await db.query('UPDATE users SET is_flagged = $1 WHERE id = $2', [flagged, req.params.id]);
  await db.query(
    `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id)
     VALUES ($1, $2, 'user', $3)`,
    [req.adminId, flagged ? 'flag_user' : 'unflag_user', req.params.id]
  );
  res.json({ ok: true });
});

// PATCH /api/users/admin/:id/revoke — revoke access
router.patch('/admin/:id/revoke', requireAdmin, async (req, res) => {
  const { revoked } = req.body;
  await db.query('UPDATE users SET is_revoked = $1 WHERE id = $2', [revoked, req.params.id]);
  if (revoked) {
    // Invalidate all tokens
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.params.id]);
  }
  await db.query(
    `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id)
     VALUES ($1, $2, 'user', $3)`,
    [req.adminId, revoked ? 'revoke_user' : 'restore_user', req.params.id]
  );
  res.json({ ok: true });
});

module.exports = router;
