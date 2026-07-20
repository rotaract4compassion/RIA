-- Ria Database Schema
-- Compatible with PostgreSQL (Supabase)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Roles enum
CREATE TYPE user_role AS ENUM ('field_user', 'admin', 'super_admin');
CREATE TYPE user_identity AS ENUM ('rotaractor', 'rotarian', 'unknown');
CREATE TYPE admin_scope AS ENUM ('project', 'global');
CREATE TYPE project_status AS ENUM ('active', 'archived');

-- Admins table (separate from field users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  scope admin_scope NOT NULL DEFAULT 'project',
  club TEXT,
  phone TEXT,
  title TEXT,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Field users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  club TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  identity user_identity NOT NULL DEFAULT 'unknown',
  is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  leaderboard_visible BOOLEAN NOT NULL DEFAULT TRUE,
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_owner CHECK (
    (user_id IS NOT NULL AND admin_id IS NULL) OR
    (user_id IS NULL AND admin_id IS NOT NULL)
  )
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  briefing_content TEXT,   -- markdown/rich-text per-project briefing for field users
  club_org TEXT,
  status project_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-project scoping (which admins can manage which projects)
CREATE TABLE IF NOT EXISTS admin_projects (
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_id, project_id)
);

-- Questionnaire versions (schema versioning)
CREATE TABLE IF NOT EXISTS questionnaire_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  schema JSONB NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, version_number)
);

-- User-project affiliations
CREATE TABLE IF NOT EXISTS user_projects (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  affiliated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  questionnaire_version_id UUID NOT NULL REFERENCES questionnaire_versions(id),
  answers JSONB NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  region TEXT,
  is_duplicate_flag BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  local_id TEXT -- client-side local ID for dedup
);

-- Achievements definitions
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_sw TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_sw TEXT NOT NULL,
  icon TEXT,
  threshold INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL -- 'submissions', 'regions', 'projects', 'tenure_days'
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievement_definitions(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin audit log (extended to cover project edits, questionnaire changes, user actions, broadcasts)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Broadcasts (admin → field user announcements, pull-based)
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,                         -- Supabase Storage URL (free-tier bucket)
  audience TEXT NOT NULL DEFAULT 'all',  -- 'all' | 'project' | 'club'
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  club TEXT,
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which users have read which broadcasts
CREATE TABLE IF NOT EXISTS broadcast_reads (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, broadcast_id)
);

-- User briefing views — tracks which users have seen a project's briefing
CREATE TABLE IF NOT EXISTS user_briefing_views (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_project ON submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_region ON submissions(region);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_expires ON suggestions(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_broadcasts_expires ON broadcasts(expires_at);
CREATE INDEX IF NOT EXISTS idx_broadcasts_audience ON broadcasts(audience);

-- Seed achievements
INSERT INTO achievement_definitions (key, name_en, name_sw, description_en, description_sw, icon, threshold, type)
VALUES
  ('first_submission', 'First Submission', 'Uwasilishaji wa Kwanza', 'Submit your first project data', 'Wasilisha data yako ya kwanza ya mradi', '🌟', 1, 'submissions'),
  ('5_submissions', '5 Submissions', 'Uwasilishaji 5', 'Submit data 5 times', 'Wasilisha data mara 5', '🏅', 5, 'submissions'),
  ('25_submissions', 'Data Champion', 'Bingwa wa Data', 'Submit data 25 times', 'Wasilisha data mara 25', '🏆', 25, 'submissions'),
  ('50_submissions', 'Impact Master', 'Mkuu wa Athari', 'Submit data 50 times', 'Wasilisha data mara 50', '🔥', 50, 'submissions'),
  ('100_submissions', 'Legend', 'Shujaa', 'Submit data 100 times', 'Wasilisha data mara 100', '👑', 100, 'submissions'),
  ('3_regions', 'Region Explorer', 'Mchunguzi wa Mkoa', 'Work in 3 different regions', 'Fanya kazi katika mikoa 3 tofauti', '🗺️', 3, 'regions'),
  ('5_regions', 'Multi-Region Hero', 'Shujaa wa Mikoa Mingi', 'Work in 5 different regions', 'Fanya kazi katika mikoa 5', '🌍', 5, 'regions'),
  ('10_regions', 'National Hero', 'Shujaa wa Taifa', 'Work in 10 different regions', 'Fanya kazi katika mikoa 10 tofauti', '🦅', 10, 'regions'),
  ('30_days', 'Month of Service', 'Mwezi wa Huduma', 'Active for 30 days', 'Amilifu kwa siku 30', '📅', 30, 'tenure_days'),
  ('180_days', 'Half-Year Hero', 'Shujaa wa Nusu Mwaka', 'Active for 180 days', 'Amilifu kwa siku 180', '⏳', 180, 'tenure_days'),
  ('3_projects', 'Multi-Project Volunteer', 'Mwanakuzi wa Miradi Mingi', 'Contribute to 3 projects', 'Changia katika miradi 3', '📋', 3, 'projects'),
  ('10_projects', 'Global Citizen', 'Raia wa Dunia', 'Contribute to 10 projects', 'Changia katika miradi 10', '🌐', 10, 'projects')
ON CONFLICT (key) DO NOTHING;

-- Migration helpers: safely add columns if upgrading from v1 schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS briefing_content TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS club TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS title TEXT;
