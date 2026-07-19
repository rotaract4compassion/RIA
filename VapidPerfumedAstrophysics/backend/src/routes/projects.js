const express = require('express');
const db = require('../db');
const { requireUser, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects — list all active projects (field users can browse)
router.get('/', requireUser, async (req, res) => {
  const { search } = req.query;
  let query = `SELECT p.id, p.name, p.description, p.club_org, p.status,
    (SELECT COUNT(*) FROM user_projects up WHERE up.project_id = p.id) as member_count,
    EXISTS(SELECT 1 FROM user_projects up2 WHERE up2.project_id = p.id AND up2.user_id = $1) as is_affiliated
    FROM projects p WHERE p.status = 'active'`;
  const params = [req.userId];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
  }
  query += ' ORDER BY p.name';
  const result = await db.query(query, params);
  res.json(result.rows);
});

// GET /api/projects/mine — user's affiliated projects
router.get('/mine', requireUser, async (req, res) => {
  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.club_org,
      up.affiliated_at,
      (SELECT COUNT(*) FROM submissions s WHERE s.project_id = p.id AND s.user_id = $1) as my_submission_count,
      (SELECT COUNT(*) FROM submissions s2 WHERE s2.project_id = p.id
        AND s2.submitted_at > NOW() - INTERVAL '30 days') as recent_count
     FROM projects p
     JOIN user_projects up ON up.project_id = p.id
     WHERE up.user_id = $1 AND p.status = 'active'
     ORDER BY p.name`,
    [req.userId]
  );
  res.json(result.rows);
});

// POST /api/projects/:id/affiliate — self-affiliate
router.post('/:id/affiliate', requireUser, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'INSERT INTO user_projects (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, id]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to affiliate' });
  }
});

// POST /api/projects/:id/mark-briefing-viewed — track that user has seen the briefing
router.post('/:id/mark-briefing-viewed', requireUser, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      'INSERT INTO user_briefing_views (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.userId, id]
    );
  } catch { /* table may not exist in older deploys — non-fatal */ }
  res.json({ ok: true });
});

// GET /api/projects/:id — project detail + current questionnaire
router.get('/:id', requireUser, async (req, res) => {
  const { id } = req.params;
  const pResult = await db.query(
    `SELECT p.*, EXISTS(SELECT 1 FROM user_projects up WHERE up.project_id = p.id AND up.user_id = $2) as is_affiliated
     FROM projects p WHERE p.id = $1`,
    [id, req.userId]
  );
  if (!pResult.rows.length) return res.status(404).json({ error: 'Project not found' });
  const project = pResult.rows[0];
  const qResult = await db.query(
    'SELECT * FROM questionnaire_versions WHERE project_id = $1 AND is_current = true',
    [id]
  );
  project.current_questionnaire = qResult.rows[0] || null;
  const countResult = await db.query(
    'SELECT COUNT(*) as total FROM submissions WHERE project_id = $1 AND user_id = $2',
    [id, req.userId]
  );
  project.my_submission_count = parseInt(countResult.rows[0].total);
  res.json(project);
});

// ---- ADMIN ROUTES ----

// GET /api/projects/admin/all — admin: all projects
router.get('/admin/all', requireAdmin, async (req, res) => {
  const result = await db.query(
    `SELECT p.*,
      (SELECT COUNT(*) FROM submissions s WHERE s.project_id = p.id) as submission_count,
      (SELECT COUNT(*) FROM user_projects up WHERE up.project_id = p.id) as user_count,
      (SELECT MAX(s2.submitted_at) FROM submissions s2 WHERE s2.project_id = p.id) as last_activity
     FROM projects p ORDER BY p.created_at DESC`
  );
  res.json(result.rows);
});

// POST /api/projects/admin — create project
router.post('/admin', requireAdmin, async (req, res) => {
  const { name, description, instructions, briefing_content, club_org } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  try {
    const result = await db.query(
      `INSERT INTO projects (name, description, instructions, briefing_content, club_org, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, instructions, briefing_content || null, club_org, req.adminId]
    );
    const project = result.rows[0];
    // Associate admin with this project
    await db.query(
      'INSERT INTO admin_projects (admin_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.adminId, project.id]
    );
    await db.query(
      `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id)
       VALUES ($1, 'create_project', 'project', $2)`,
      [req.adminId, project.id]
    );
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/admin/:id — update project
router.patch('/admin/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, instructions, briefing_content, club_org, status } = req.body;
  const result = await db.query(
    `UPDATE projects SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      instructions = COALESCE($3, instructions),
      briefing_content = COALESCE($4, briefing_content),
      club_org = COALESCE($5, club_org),
      status = COALESCE($6, status),
      updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [name, description, instructions, briefing_content, club_org, status, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
  await db.query(
    `INSERT INTO admin_audit_log (actor_admin_id, action, target_type, target_id)
     VALUES ($1, 'update_project', 'project', $2)`,
    [req.adminId, id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
