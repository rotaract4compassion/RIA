require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (required for rate-limit in proxied environments like Replit/Render)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' })); // raised to 2mb to support broadcast image_url payloads

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use(limiter);

// Routes
app.use('/api/auth', authLimiter, require('./routes/userAuth'));
app.use('/api/admin/auth', authLimiter, require('./routes/adminAuth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/questionnaires', require('./routes/questionnaires'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/health', require('./routes/health'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/broadcasts', require('./routes/broadcasts'));

// Cleanup expired tokens/suggestions/broadcasts periodically (every 6 hours)
setInterval(async () => {
  try {
    const db = require('./db');
    await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    await db.query('DELETE FROM suggestions WHERE expires_at < NOW()');
    await db.query('DELETE FROM broadcasts WHERE expires_at IS NOT NULL AND expires_at < NOW()');
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
}, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Ria API running on port ${PORT}`);
});

module.exports = app;
