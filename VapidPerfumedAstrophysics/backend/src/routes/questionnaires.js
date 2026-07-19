const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/questionnaires/:projectId/versions — all versions
router.get('/:projectId/versions', requireAdmin, async (req, res) => {
  const result = await db.query(
    `SELECT id, project_id, version_number, is_current, created_at
     FROM questionnaire_versions WHERE project_id = $1 ORDER BY version_number DESC`,
    [req.params.projectId]
  );
  res.json(result.rows);
});

// GET /api/questionnaires/:projectId/current — get current schema
router.get('/:projectId/current', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM questionnaire_versions WHERE project_id = $1 AND is_current = true',
    [req.params.projectId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'No questionnaire found' });
  res.json(result.rows[0]);
});

// POST /api/questionnaires/:projectId — create or update questionnaire (creates new version if submissions exist)
router.post('/:projectId', requireAdmin, async (req, res) => {
  const { projectId } = req.params;
  const { schema } = req.body;
  if (!schema || !Array.isArray(schema.fields)) {
    return res.status(400).json({ error: 'schema.fields array required' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check existing submissions
    const subCount = await client.query(
      'SELECT COUNT(*) as cnt FROM submissions WHERE project_id = $1',
      [projectId]
    );
    const hasSubmissions = parseInt(subCount.rows[0].cnt) > 0;

    // Get current version number
    const versionRes = await client.query(
      'SELECT MAX(version_number) as max_v FROM questionnaire_versions WHERE project_id = $1',
      [projectId]
    );
    const nextVersion = (versionRes.rows[0].max_v || 0) + 1;

    // Mark previous as not current
    await client.query(
      'UPDATE questionnaire_versions SET is_current = false WHERE project_id = $1',
      [projectId]
    );

    // Insert new version
    const result = await client.query(
      `INSERT INTO questionnaire_versions (project_id, version_number, schema, is_current, created_by)
       VALUES ($1, $2, $3, true, $4) RETURNING *`,
      [projectId, nextVersion, JSON.stringify(schema), req.adminId]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...result.rows[0], created_new_version: hasSubmissions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to save questionnaire' });
  } finally {
    client.release();
  }
});

module.exports = router;
