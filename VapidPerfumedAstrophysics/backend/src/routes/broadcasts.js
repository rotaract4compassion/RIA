const express = require('express');
const db = require('../db');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- FIELD USER ROUTES ----

// GET /api/broadcasts — fetch broadcasts for the current user (pull-based, piggybacked on sync)
router.get('/', requireUser, async (req, res) => {
  try {
    // Fetch broadcasts relevant to this user:
    // 'all' audience, or their affiliated projects, or their club
    const result = await db.query(
      `SELECT b.*,
        (SELECT COUNT(*) FROM broadcast_reads br WHERE br.broadcast_id = b.id AND br.user_id = $1) > 0 AS is_read
       FROM broadcasts b
       WHERE
         (b.expires_at IS NULL OR b.expires_at > NOW())
         AND (
           b.audience = 'all'
           OR (b.audience = 'project' AND b.project_id IN (
             SELECT project_id FROM user_projects WHERE user_id = $1
           ))
           OR (b.audience = 'club' AND b.club IN (
             SELECT club FROM users WHERE id = $1
           ))
         )
       ORDER BY b.is_priority DESC, b.created_at DESC
       LIMIT 50`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Broadcasts fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// GET /api/broadcasts/unread-count — lightweight badge count
router.get('/unread-count', requireUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COUNT(b.id)::int AS count
       FROM broadcasts b
       WHERE
         (b.expires_at IS NULL OR b.expires_at > NOW())
         AND (
           b.audience = 'all'
           OR (b.audience = 'project' AND b.project_id IN (
             SELECT project_id FROM user_projects WHERE user_id = $1
           ))
           OR (b.audience = 'club' AND b.club IN (
             SELECT club FROM users WHERE id = $1
           ))
         )
         AND NOT EXISTS (
           SELECT 1 FROM broadcast_reads br WHERE br.broadcast_id = b.id AND br.user_id = $1
         )`,
      [req.userId]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.json({ count: 0 });
  }
});

// POST /api/broadcasts/:id/read — mark as read
router.post('/:id/read', requireUser, async (req, res) => {
  try {
    await db.query(
      'INSERT INTO broadcast_reads (user_id, broadcast_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, req.params.id]
    );
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// ---- ADMIN ROUTES ----

// GET /api/broadcasts/admin — all broadcasts (admin view)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, a.name AS created_by_name,
         (SELECT COUNT(*) FROM broadcast_reads br WHERE br.broadcast_id = b.id)::int AS read_count
       FROM broadcasts b
       LEFT JOIN admins a ON a.id = b.created_by
       ORDER BY b.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// POST /api/broadcasts/admin — create broadcast
router.post('/admin', requireAdmin, async (req, res) => {
  const { title, body, image_url, audience, project_id, club, is_priority, expires_at } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  if (!['all', 'project', 'club'].includes(audience)) {
    return res.status(400).json({ error: 'audience must be all | project | club' });
  }
  // Project-scoped admins can only broadcast to their own project or club
  if (req.adminScope !== 'global' && audience === 'all') {
    return res.status(403).json({ error: 'Only global admins can broadcast to all users' });
  }
  try {
    const result = await db.query(
      `INSERT INTO broadcasts (title, body, image_url, audience, project_id, club, is_priority, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, body, image_url || null, audience, project_id || null, club || null,
       is_priority || false, expires_at || null, req.adminId]
    );
    await db.query(
      `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id, metadata)
       VALUES ($1, 'send_broadcast', 'broadcast', $2, $3)`,
      [req.adminId, result.rows[0].id, JSON.stringify({ audience, title })]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Broadcast create error:', err);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

// DELETE /api/broadcasts/admin/:id — delete broadcast
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM broadcasts WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
