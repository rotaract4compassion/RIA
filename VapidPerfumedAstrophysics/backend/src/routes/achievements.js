const express = require('express');
const db = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

// GET /api/achievements — get all definitions + user unlock status
router.get('/', requireUser, async (req, res) => {
  const result = await db.query(
    `SELECT d.*,
      ua.unlocked_at IS NOT NULL as is_unlocked,
      ua.unlocked_at
     FROM achievement_definitions d
     LEFT JOIN user_achievements ua ON ua.achievement_id = d.id AND ua.user_id = $1
     ORDER BY d.threshold`,
    [req.userId]
  );
  res.json(result.rows);
});

// GET /api/achievements/impact — user's impact summary
router.get('/impact', requireUser, async (req, res) => {
  const [subRes, regionRes, projectRes, achieveRes, userRes] = await Promise.all([
    db.query('SELECT COUNT(*) as total FROM submissions WHERE user_id = $1', [req.userId]),
    db.query('SELECT DISTINCT region FROM submissions WHERE user_id = $1 AND region IS NOT NULL', [req.userId]),
    db.query('SELECT DISTINCT project_id FROM submissions WHERE user_id = $1', [req.userId]),
    db.query(
      `SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1`,
      [req.userId]
    ),
    db.query('SELECT name, club, identity, created_at FROM users WHERE id = $1', [req.userId]),
  ]);
  res.json({
    total_submissions: parseInt(subRes.rows[0].total),
    regions: regionRes.rows.map(r => r.region),
    region_count: regionRes.rows.length,
    project_count: projectRes.rows.length,
    achievement_count: parseInt(achieveRes.rows[0].count),
    user: userRes.rows[0],
  });
});

module.exports = router;
