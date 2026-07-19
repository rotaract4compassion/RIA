const express = require('express');
const db = require('../db');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/submissions — submit a questionnaire response
router.post('/', requireUser, async (req, res) => {
  const { project_id, questionnaire_version_id, answers, location_lat, location_lng, location_accuracy, region, local_id } = req.body;
  if (!project_id || !questionnaire_version_id || !answers) {
    return res.status(400).json({ error: 'project_id, questionnaire_version_id, and answers required' });
  }

  // Duplicate detection: same user, same project, within 5 minutes, same local_id
  if (local_id) {
    const dupCheck = await db.query(
      'SELECT id FROM submissions WHERE user_id = $1 AND project_id = $2 AND local_id = $3',
      [req.userId, project_id, local_id]
    );
    if (dupCheck.rows.length > 0) {
      return res.json({ id: dupCheck.rows[0].id, duplicate: true });
    }
  }

  // Flag near-duplicates (same user+project within 2 minutes)
  const nearDup = await db.query(
    `SELECT COUNT(*) as cnt FROM submissions
     WHERE user_id = $1 AND project_id = $2 AND submitted_at > NOW() - INTERVAL '2 minutes'`,
    [req.userId, project_id]
  );
  const isDuplicateFlag = parseInt(nearDup.rows[0].cnt) > 0;

  try {
    const result = await db.query(
      `INSERT INTO submissions
        (user_id, project_id, questionnaire_version_id, answers, location_lat, location_lng, location_accuracy, region, is_duplicate_flag, synced_at, local_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
       RETURNING id, submitted_at`,
      [req.userId, project_id, questionnaire_version_id, JSON.stringify(answers), location_lat, location_lng, location_accuracy, region, isDuplicateFlag, local_id]
    );

    // Check and unlock achievements
    await checkAchievements(req.userId, project_id, region);

    res.status(201).json({ ...result.rows[0], flagged: isDuplicateFlag });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// POST /api/submissions/batch — batch sync from offline queue
router.post('/batch', requireUser, async (req, res) => {
  const { submissions } = req.body;
  if (!Array.isArray(submissions) || !submissions.length) {
    return res.status(400).json({ error: 'submissions array required' });
  }

  const results = [];
  for (const sub of submissions) {
    try {
      if (sub.local_id) {
        const dup = await db.query(
          'SELECT id FROM submissions WHERE user_id = $1 AND local_id = $2',
          [req.userId, sub.local_id]
        );
        if (dup.rows.length > 0) {
          results.push({ local_id: sub.local_id, id: dup.rows[0].id, duplicate: true });
          continue;
        }
      }
      const nearDup = await db.query(
        `SELECT COUNT(*) as cnt FROM submissions
         WHERE user_id = $1 AND project_id = $2 AND submitted_at > NOW() - INTERVAL '2 minutes'`,
        [req.userId, sub.project_id]
      );
      const isDup = parseInt(nearDup.rows[0].cnt) > 0;
      const r = await db.query(
        `INSERT INTO submissions
          (user_id, project_id, questionnaire_version_id, answers, location_lat, location_lng, location_accuracy, region, is_duplicate_flag, synced_at, local_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10) RETURNING id, submitted_at`,
        [req.userId, sub.project_id, sub.questionnaire_version_id, JSON.stringify(sub.answers), sub.location_lat, sub.location_lng, sub.location_accuracy, sub.region, isDup, sub.local_id]
      );
      await checkAchievements(req.userId, sub.project_id, sub.region);
      results.push({ local_id: sub.local_id, id: r.rows[0].id, submitted_at: r.rows[0].submitted_at });
    } catch (err) {
      results.push({ local_id: sub.local_id, error: err.message });
    }
  }
  res.json({ results });
});

// GET /api/submissions/admin/analytics/global — deep global analytics
// NOTE: Must be before :projectId routes so Express doesn't match 'analytics' as a projectId
router.get('/admin/analytics/global', requireAdmin, async (req, res) => {
  if (req.adminScope !== 'global') {
    return res.status(403).json({ error: 'Global admins only' });
  }
  try {
    const [trendRes, regionRes, projectRes, totalsRes, heatmapRes] = await Promise.all([
      db.query(
        `SELECT DATE(submitted_at) as date, COUNT(*) as count
         FROM submissions
         WHERE submitted_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(submitted_at) ORDER BY date`
      ),
      db.query(
        `SELECT region, COUNT(*) as count FROM submissions
         WHERE region IS NOT NULL
         GROUP BY region ORDER BY count DESC LIMIT 10`
      ),
      db.query(
        `SELECT p.name, COUNT(s.id) as count
         FROM submissions s JOIN projects p ON p.id = s.project_id
         GROUP BY p.name ORDER BY count DESC LIMIT 10`
      ),
      db.query(
        `SELECT 
          COUNT(*) as total_submissions,
          COUNT(DISTINCT user_id) as total_users,
          COALESCE(SUM((answers->>'minutes_of_impact')::numeric), 0) as total_minutes,
          SUM(CASE WHEN is_duplicate_flag THEN 1 ELSE 0 END) as flagged_submissions
         FROM submissions`
      ),
      db.query(
        `SELECT s.location_lat as lat, s.location_lng as lng, p.name as project_name, p.id as project_id
         FROM submissions s
         JOIN projects p ON p.id = s.project_id
         WHERE s.location_lat IS NOT NULL AND s.location_lng IS NOT NULL`
      )
    ]);
    res.json({
      trends: trendRes.rows,
      regions: regionRes.rows,
      projects: projectRes.rows,
      totals: totalsRes.rows[0],
      heatmap: heatmapRes.rows
    });
  } catch (err) {
    console.error('Global analytics error:', err);
    res.status(500).json({ error: 'Failed to load global analytics' });
  }
});

// GET /api/submissions/admin/:projectId — admin: get all submissions for a project
router.get('/admin/:projectId', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { start_date, end_date, region, version_id } = req.query;
  let query = `
    SELECT s.*, u.name as user_name, u.club as user_club, qv.version_number
    FROM submissions s
    JOIN users u ON u.id = s.user_id
    JOIN questionnaire_versions qv ON qv.id = s.questionnaire_version_id
    WHERE s.project_id = $1`;
  const params = [projectId];
  if (start_date) { params.push(start_date); query += ` AND s.submitted_at >= $${params.length}`; }
  if (end_date) { params.push(end_date); query += ` AND s.submitted_at <= $${params.length}`; }
  if (region) { params.push(region); query += ` AND s.region = $${params.length}`; }
  if (version_id) { params.push(version_id); query += ` AND s.questionnaire_version_id = $${params.length}`; }
  query += ' ORDER BY s.submitted_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
});

// GET /api/submissions/admin/:projectId/analytics — quick analytics
router.get('/admin/:projectId/analytics', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [volumeRes, regionRes, versionRes, minutesRes] = await Promise.all([
      db.query(
        `SELECT DATE(submitted_at) as date, COUNT(*) as count
         FROM submissions WHERE project_id = $1
         GROUP BY DATE(submitted_at) ORDER BY date`,
        [projectId]
      ),
      db.query(
        `SELECT region, COUNT(*) as count FROM submissions
         WHERE project_id = $1 AND region IS NOT NULL
         GROUP BY region ORDER BY count DESC`,
        [projectId]
      ),
      db.query(
        `SELECT qv.version_number, COUNT(*) as count
         FROM submissions s JOIN questionnaire_versions qv ON qv.id = s.questionnaire_version_id
         WHERE s.project_id = $1 GROUP BY qv.version_number ORDER BY qv.version_number`,
        [projectId]
      ),
      db.query(
        `SELECT COALESCE(SUM((answers->>'minutes_of_impact')::numeric), 0) as total_minutes
         FROM submissions WHERE project_id = $1`,
        [projectId]
      ),
    ]);
    res.json({
      volume: volumeRes.rows,
      regions: regionRes.rows,
      versions: versionRes.rows,
      total_minutes: minutesRes.rows[0].total_minutes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics failed' });
  }
});

// GET /api/submissions/admin/:projectId/impact-report — report data
router.get('/admin/:projectId/impact-report', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  const [projRes, statsRes, regionsRes, usersRes] = await Promise.all([
    db.query('SELECT name, description FROM projects WHERE id = $1', [projectId]),
    db.query(
      `SELECT COUNT(*) as total_submissions,
        COUNT(DISTINCT user_id) as unique_participants,
        MIN(submitted_at) as first_submission,
        MAX(submitted_at) as last_submission,
        COALESCE(SUM((answers->>'minutes_of_impact')::numeric), 0) as total_minutes
       FROM submissions WHERE project_id = $1`,
      [projectId]
    ),
    db.query(
      `SELECT region, COUNT(*) as count FROM submissions
       WHERE project_id = $1 AND region IS NOT NULL GROUP BY region ORDER BY count DESC`,
      [projectId]
    ),
    db.query(
      `SELECT DISTINCT u.name, u.club FROM submissions s
       JOIN users u ON u.id = s.user_id WHERE s.project_id = $1 LIMIT 100`,
      [projectId]
    ),
  ]);
  res.json({
    project: projRes.rows[0],
    stats: statsRes.rows[0],
    regions: regionsRes.rows,
    participants: usersRes.rows,
    generated_at: new Date().toISOString(),
  });
});

async function checkAchievements(userId, projectId, region) {
  try {
    const [subCount, regionCount, projectCount, user] = await Promise.all([
      db.query('SELECT COUNT(*) as cnt FROM submissions WHERE user_id = $1', [userId]),
      db.query('SELECT COUNT(DISTINCT region) as cnt FROM submissions WHERE user_id = $1 AND region IS NOT NULL', [userId]),
      db.query('SELECT COUNT(DISTINCT project_id) as cnt FROM submissions WHERE user_id = $1', [userId]),
      db.query('SELECT created_at FROM users WHERE id = $1', [userId]),
    ]);
    const subs = parseInt(subCount.rows[0].cnt);
    const regions = parseInt(regionCount.rows[0].cnt);
    const projects = parseInt(projectCount.rows[0].cnt);
    const tenureDays = Math.floor((Date.now() - new Date(user.rows[0].created_at).getTime()) / 86400000);

    const defs = await db.query('SELECT * FROM achievement_definitions');
    for (const def of defs.rows) {
      let value = 0;
      if (def.type === 'submissions') value = subs;
      else if (def.type === 'regions') value = regions;
      else if (def.type === 'projects') value = projects;
      else if (def.type === 'tenure_days') value = tenureDays;
      if (value >= def.threshold) {
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, def.id]
        );
      }
    }
  } catch (err) {
    console.error('Achievement check failed:', err.message);
  }
}

module.exports = router;
