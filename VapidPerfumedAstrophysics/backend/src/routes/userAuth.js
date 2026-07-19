const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { signAccess, signRefresh, verifyRefresh, requireUser, REFRESH_TOKEN_TTL } = require('../middleware/auth');

const router = express.Router();

const REFRESH_MS = 90 * 24 * 60 * 60 * 1000;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, club, email, phone, password, identity = 'unknown' } = req.body;
  if (!name || !club || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email.toLowerCase(), phone]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with those details already exists' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (name, club, email, phone, password_hash, identity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, club, email, phone, identity, leaderboard_visible, profile_picture_url`,
      [name, club, email.toLowerCase(), phone, hash, identity]
    );
    const user = result.rows[0];
    const accessToken = signAccess({ sub: user.id, type: 'user' });
    const refreshToken = signRefresh({ sub: user.id, type: 'user' });
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + REFRESH_MS)]
    );
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password required' });
  }
  try {
    const isEmail = identifier.includes('@');
    const result = await db.query(
      isEmail
        ? 'SELECT * FROM users WHERE email = $1'
        : 'SELECT * FROM users WHERE phone = $1',
      [isEmail ? identifier.toLowerCase() : identifier]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        error: isEmail
          ? 'No account with that email, or password incorrect'
          : 'No account with that phone number, or password incorrect',
      });
    }
    if (user.is_revoked) {
      return res.status(403).json({ error: 'Account access has been revoked' });
    }
    const accessToken = signAccess({ sub: user.id, type: 'user' });
    const refreshToken = signRefresh({ sub: user.id, type: 'user' });
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, new Date(Date.now() + REFRESH_MS)]
    );
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = verifyRefresh(refreshToken);
    const stored = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
      [refreshToken, payload.sub]
    );
    if (!stored.rows.length) return res.status(401).json({ error: 'Invalid refresh token' });
    // Rotate
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const newAccess = signAccess({ sub: payload.sub, type: 'user' });
    const newRefresh = signRefresh({ sub: payload.sub, type: 'user' });
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [payload.sub, newRefresh, new Date(Date.now() + REFRESH_MS)]
    );
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireUser, async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', requireUser, async (req, res) => {
  const result = await db.query(
    `SELECT id, name, club, email, phone, identity, leaderboard_visible, profile_picture_url, created_at
     FROM users WHERE id = $1`,
    [req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// PATCH /api/auth/me — update profile fields
router.patch('/me', requireUser, async (req, res) => {
  const { name, club, email, phone, identity, leaderboard_visible, profile_picture_url } = req.body;
  const result = await db.query(
    `UPDATE users SET
      name = COALESCE($1, name),
      club = COALESCE($2, club),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone),
      identity = COALESCE($5, identity),
      leaderboard_visible = COALESCE($6, leaderboard_visible),
      profile_picture_url = COALESCE($7, profile_picture_url),
      updated_at = NOW()
     WHERE id = $8
     RETURNING id, name, club, email, phone, identity, leaderboard_visible, profile_picture_url`,
    [name, club, email?.toLowerCase(), phone, identity, leaderboard_visible, profile_picture_url, req.userId]
  );
  res.json(result.rows[0]);
});

module.exports = router;
