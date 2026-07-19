const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/health — basic health check (public)
router.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// GET /api/health/admin — system health for admin dashboard
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const [dbSizeRes, tableCountRes, userCountRes, submissionCountRes] = await Promise.all([
      db.query(`SELECT pg_database_size(current_database()) as bytes`),
      db.query(`SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public'`),
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM submissions'),
    ]);

    const dbBytes = parseInt(dbSizeRes.rows[0].bytes);
    const dbMB = (dbBytes / 1024 / 1024).toFixed(2);
    // Supabase free tier: 500MB
    const freeCapMB = 500;
    const usagePct = ((dbMB / freeCapMB) * 100).toFixed(1);

    res.json({
      database: {
        size_bytes: dbBytes,
        size_mb: parseFloat(dbMB),
        free_tier_cap_mb: freeCapMB,
        usage_percent: parseFloat(usagePct),
        warning: usagePct > 80,
      },
      counts: {
        users: parseInt(userCountRes.rows[0].count),
        submissions: parseInt(submissionCountRes.rows[0].count),
        tables: parseInt(tableCountRes.rows[0].tables),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
});

module.exports = router;
