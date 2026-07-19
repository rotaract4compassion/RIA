const express = require('express');
const db = require('../db');
const { requireUser } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/leaderboard?metric=submissions&scope=global&project_id=<uuid>&view=individual
 * metric: submissions | minutes | regions
 * scope: global | project (requires project_id)
 * view: individual | club
 */
router.get('/', requireUser, async (req, res) => {
  const { metric = 'submissions', scope = 'global', project_id, view = 'individual' } = req.query;

  const LIMIT = 50;

  try {
    if (view === 'club') {
      // ---- BY CLUB ----
      let query, params;
      if (metric === 'submissions') {
        if (scope === 'project' && project_id) {
          query = `
            SELECT u.club, COUNT(s.id)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE s.project_id = $1 AND u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $2`;
          params = [project_id, LIMIT];
        } else {
          query = `
            SELECT u.club, COUNT(s.id)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $1`;
          params = [LIMIT];
        }
      } else if (metric === 'minutes') {
        if (scope === 'project' && project_id) {
          query = `
            SELECT u.club, COALESCE(SUM((s.answers->>'minutes_of_impact')::numeric), 0)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE s.project_id = $1 AND u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $2`;
          params = [project_id, LIMIT];
        } else {
          query = `
            SELECT u.club, COALESCE(SUM((s.answers->>'minutes_of_impact')::numeric), 0)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $1`;
          params = [LIMIT];
        }
      } else {
        // regions
        if (scope === 'project' && project_id) {
          query = `
            SELECT u.club, COUNT(DISTINCT s.region)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE s.project_id = $1 AND s.region IS NOT NULL AND u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $2`;
          params = [project_id, LIMIT];
        } else {
          query = `
            SELECT u.club, COUNT(DISTINCT s.region)::int AS score
            FROM submissions s
            JOIN users u ON u.id = s.user_id
            WHERE s.region IS NOT NULL AND u.leaderboard_visible = TRUE
            GROUP BY u.club ORDER BY score DESC LIMIT $1`;
          params = [LIMIT];
        }
      }
      const result = await db.query(query, params);
      return res.json(result.rows.map((r, i) => ({ rank: i + 1, name: r.club, score: r.score })));
    }

    // ---- BY INDIVIDUAL ----
    let query, params;
    if (metric === 'submissions') {
      if (scope === 'project' && project_id) {
        query = `
          SELECT u.id, u.name, u.club, COUNT(s.id)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE s.project_id = $2 AND u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $3`;
        params = [req.userId, project_id, LIMIT];
      } else {
        query = `
          SELECT u.id, u.name, u.club, COUNT(s.id)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $2`;
        params = [req.userId, LIMIT];
      }
    } else if (metric === 'minutes') {
      if (scope === 'project' && project_id) {
        query = `
          SELECT u.id, u.name, u.club,
            COALESCE(SUM((s.answers->>'minutes_of_impact')::numeric), 0)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE s.project_id = $2 AND u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $3`;
        params = [req.userId, project_id, LIMIT];
      } else {
        query = `
          SELECT u.id, u.name, u.club,
            COALESCE(SUM((s.answers->>'minutes_of_impact')::numeric), 0)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $2`;
        params = [req.userId, LIMIT];
      }
    } else {
      // regions
      if (scope === 'project' && project_id) {
        query = `
          SELECT u.id, u.name, u.club,
            COUNT(DISTINCT s.region)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE s.project_id = $2 AND s.region IS NOT NULL AND u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $3`;
        params = [req.userId, project_id, LIMIT];
      } else {
        query = `
          SELECT u.id, u.name, u.club,
            COUNT(DISTINCT s.region)::int AS score,
            u.profile_picture_url, u.id = $1 AS is_me
          FROM submissions s
          JOIN users u ON u.id = s.user_id
          WHERE s.region IS NOT NULL AND u.leaderboard_visible = TRUE
          GROUP BY u.id ORDER BY score DESC LIMIT $2`;
        params = [req.userId, LIMIT];
      }
    }

    const result = await db.query(query, params);
    return res.json(
      result.rows.map((r, i) => ({
        rank: i + 1,
        id: r.id,
        name: r.name,
        club: r.club,
        score: r.score,
        profile_picture_url: r.profile_picture_url,
        is_me: r.is_me,
      }))
    );
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

module.exports = router;
