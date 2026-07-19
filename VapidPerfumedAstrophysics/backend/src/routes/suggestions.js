const express = require('express');
const db = require('../db');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/suggestions — user submits suggestion
router.post('/', requireUser, async (req, res) => {
  const { content, is_anonymous = false, project_id } = req.body;
  if (!content || content.trim().length < 5) {
    return res.status(400).json({ error: 'Suggestion must be at least 5 characters' });
  }
  if (content.length > 1000) {
    return res.status(400).json({ error: 'Suggestion must be under 1000 characters' });
  }
  const result = await db.query(
    `INSERT INTO suggestions (user_id, project_id, content, is_anonymous)
     VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [is_anonymous ? null : req.userId, project_id || null, content.trim(), is_anonymous]
  );
  res.status(201).json(result.rows[0]);
});

// GET /api/suggestions/admin — admin views all suggestions
router.get('/admin', requireAdmin, async (req, res) => {
  // Clean up expired suggestions first
  await db.query('DELETE FROM suggestions WHERE expires_at < NOW()');
  const result = await db.query(
    `SELECT s.id, s.content, s.is_anonymous, s.is_read, s.created_at, s.expires_at,
      s.project_id, p.name as project_name,
      CASE WHEN s.is_anonymous THEN NULL ELSE u.name END as user_name,
      CASE WHEN s.is_anonymous THEN NULL ELSE u.email END as user_email
     FROM suggestions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN projects p ON p.id = s.project_id
     ORDER BY s.created_at DESC`
  );
  res.json(result.rows);
});

// PATCH /api/suggestions/admin/:id/read — mark as read
router.patch('/admin/:id/read', requireAdmin, async (req, res) => {
  await db.query('UPDATE suggestions SET is_read = true WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
