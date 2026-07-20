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
      totals: totalsRes.rows[0] || { total_submissions: 0, total_users: 0, total_minutes: 0, flagged_submissions: 0 },
      heatmap: heatmapRes.rows
    });
  } catch (err) {
    console.error('Global analytics error:', err);
    res.status(500).json({ error: 'Failed to load global analytics' });
  }
});

// DELETE /api/submissions/admin/purge — Global data purging
router.delete('/admin/purge', requireAdmin, async (req, res) => {
  if (req.adminScope !== 'global') {
    return res.status(403).json({ error: 'Global admins only' });
  }
  const days = parseInt(req.query.days);
  if (!days || isNaN(days)) {
    return res.status(400).json({ error: 'Valid days parameter required' });
  }
  try {
    const result = await db.query(
      `DELETE FROM submissions WHERE submitted_at < NOW() - $1::interval RETURNING id`,
      [`${days} days`]
    );
    res.json({ message: `Purged ${result.rowCount} submissions older than ${days} days`, count: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Purge failed' });
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

// GET /api/submissions/admin/:projectId/export — CSV download
router.get('/admin/:projectId/export', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT s.id, u.name as user_name, u.club as user_club, s.answers, s.region,
              s.location_lat, s.location_lng, s.submitted_at, s.is_duplicate_flag
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       WHERE s.project_id = $1
       ORDER BY s.submitted_at DESC`,
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(200).send('No submissions yet');
    }
    // Collect all answer keys across all submissions
    const allKeys = new Set();
    result.rows.forEach(r => {
      if (r.answers && typeof r.answers === 'object') {
        Object.keys(r.answers).forEach(k => allKeys.add(k));
      }
    });
    const answerKeys = Array.from(allKeys).sort();
    const headers = ['id', 'user_name', 'user_club', 'region', 'lat', 'lng', 'submitted_at', 'duplicate_flag', ...answerKeys];
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const csvRows = [headers.join(',')];
    result.rows.forEach(r => {
      const base = [r.id, r.user_name, r.user_club, r.region, r.location_lat, r.location_lng, r.submitted_at, r.is_duplicate_flag];
      const answerVals = answerKeys.map(k => r.answers?.[k] ?? '');
      csvRows.push([...base, ...answerVals].map(escape).join(','));
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="submissions_${projectId}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Export failed' });
  }
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
  const { start_date, end_date } = req.query; // season/round filtering
  let dateFilter = '';
  const params = [projectId];
  if (start_date) { params.push(start_date); dateFilter += ` AND s.submitted_at >= $${params.length}`; }
  if (end_date) { params.push(end_date); dateFilter += ` AND s.submitted_at <= $${params.length}`; }

  const [projRes, statsRes, regionsRes, usersRes, trendRes, topAnswersRes] = await Promise.all([
    db.query('SELECT name, description, club_org FROM projects WHERE id = $1', [projectId]),
    db.query(
      `SELECT COUNT(*) as total_submissions,
        COUNT(DISTINCT user_id) as unique_participants,
        MIN(submitted_at) as first_submission,
        MAX(submitted_at) as last_submission,
        COALESCE(SUM((answers->>'minutes_of_impact')::numeric), 0) as total_minutes
       FROM submissions s WHERE s.project_id = $1${dateFilter}`,
      params
    ),
    db.query(
      `SELECT region, COUNT(*) as count FROM submissions s
       WHERE s.project_id = $1${dateFilter} AND region IS NOT NULL GROUP BY region ORDER BY count DESC`,
      params
    ),
    db.query(
      `SELECT DISTINCT u.name, u.club FROM submissions s
       JOIN users u ON u.id = s.user_id WHERE s.project_id = $1${dateFilter} LIMIT 100`,
      params
    ),
    db.query(
      `SELECT DATE(submitted_at) as date, COUNT(*) as count
       FROM submissions s WHERE s.project_id = $1${dateFilter}
       GROUP BY DATE(submitted_at) ORDER BY date`,
      params
    ),
    db.query(
      `SELECT answers FROM submissions s WHERE s.project_id = $1${dateFilter} LIMIT 500`,
      params
    ),
  ]);

  // Aggregate top answer values for each field
  const fieldAggregates = {};
  (topAnswersRes.rows || []).forEach(r => {
    if (!r.answers || typeof r.answers !== 'object') return;
    Object.entries(r.answers).forEach(([key, val]) => {
      if (!fieldAggregates[key]) fieldAggregates[key] = {};
      const v = String(val);
      fieldAggregates[key][v] = (fieldAggregates[key][v] || 0) + 1;
    });
  });

  res.json({
    project: projRes.rows[0],
    stats: statsRes.rows[0],
    regions: regionsRes.rows,
    participants: usersRes.rows,
    trend: trendRes.rows,
    field_aggregates: fieldAggregates,
    generated_at: new Date().toISOString(),
  });
});

// POST /api/submissions/admin/:projectId/import — CSV import
router.post('/admin/:projectId/import', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { rows, importTag } = req.body; // Array of { answers: {...}, region?, submitted_at? }
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows provided' });
  }
  // Get the current questionnaire version
  const qvRes = await db.query(
    `SELECT id FROM questionnaire_versions WHERE project_id = $1 ORDER BY version_number DESC LIMIT 1`,
    [projectId]
  );
  if (!qvRes.rows.length) {
    return res.status(400).json({ error: 'No questionnaire configured for this project' });
  }
  const qvId = qvRes.rows[0].id;
  let imported = 0;
  let errors = 0;
  for (const row of rows) {
    try {
      const answers = row.answers || row;
      if (importTag) {
        answers.season_round = importTag;
      }
      await db.query(
        `INSERT INTO submissions (project_id, user_id, questionnaire_version_id, answers, region, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          projectId,
          req.adminId, // attribute to admin who imported
          qvId,
          JSON.stringify(answers),
          row.region || null,
          row.submitted_at || new Date().toISOString(),
        ]
      );
      imported++;
    } catch (err) {
      errors++;
    }
  }
  res.json({ imported, errors, total: rows.length });
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
