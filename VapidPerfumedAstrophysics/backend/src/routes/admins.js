const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admins — list all admins + audit log
router.get('/', requireAdmin, async (req, res) => {
  const [adminsRes, auditRes] = await Promise.all([
    db.query(
      `SELECT a.id, a.name, a.email, a.scope, a.created_at,
        c.name as created_by_name
       FROM admins a
       LEFT JOIN admins c ON c.id = a.created_by
       ORDER BY a.created_at DESC`
    ),
    db.query(
      `SELECT l.*, a.name as actor_name
       FROM admin_audit_log l
       LEFT JOIN admins a ON a.id = l.actor_admin_id
       ORDER BY l.created_at DESC LIMIT 100`
    ),
  ]);
  res.json({ admins: adminsRes.rows, audit_log: auditRes.rows });
});

// PATCH /api/admins/:id/scope — promote/demote admin (global only)
router.patch('/:id/scope', requireAdmin, async (req, res) => {
  if (req.adminScope !== 'global') {
    return res.status(403).json({ error: 'Only global admins can change scopes' });
  }
  const { scope } = req.body;
  if (!['project', 'global'].includes(scope)) {
    return res.status(400).json({ error: 'scope must be project or global' });
  }
  await db.query('UPDATE admins SET scope = $1 WHERE id = $2', [scope, req.params.id]);
  await db.query(
    `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id, metadata)
     VALUES ($1, 'change_admin_scope', 'admin', $2, $3)`,
    [req.adminId, req.params.id, JSON.stringify({ new_scope: scope })]
  );
  res.json({ ok: true });
});

module.exports = router;
