#!/usr/bin/env node
/**
 * Ria Bootstrap Admin Seed Script
 * --------------------------------
 * Creates the first global admin from environment variables.
 * Safe to re-run: if any admin already exists, does nothing.
 *
 * Usage (from repo root or backend directory):
 *   DATABASE_URL="..." BOOTSTRAP_ADMIN_PASSWORD="..." node scripts/seed-admin.js
 *
 * Required env vars:
 *   DATABASE_URL              — PostgreSQL connection string
 *   BOOTSTRAP_ADMIN_PASSWORD  — Password for the bootstrap admin
 *
 * Optional overrides (defaults to Emmanuel Chesco / Rotaract Muhimbili):
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_NAME
 *   BOOTSTRAP_ADMIN_CLUB
 *   BOOTSTRAP_ADMIN_PHONE
 *   BOOTSTRAP_ADMIN_TITLE
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password) {
    console.error('ERROR: BOOTSTRAP_ADMIN_PASSWORD env var is required.');
    process.exit(1);
  }

  const name  = process.env.BOOTSTRAP_ADMIN_NAME  || 'Emmanuel Chesco';
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'echesco05@gmail.com';
  const club  = process.env.BOOTSTRAP_ADMIN_CLUB  || 'Rotaract Muhimbili';
  const phone = process.env.BOOTSTRAP_ADMIN_PHONE || '0778495969';
  const title = process.env.BOOTSTRAP_ADMIN_TITLE || 'President';

  // Check if any admin already exists
  const existing = await pool.query('SELECT COUNT(*) AS cnt FROM admins');
  if (parseInt(existing.rows[0].cnt) > 0) {
    console.log('An admin account already exists — skipping seed. Safe to re-run.');
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admins (name, email, password_hash, scope, club, phone, title)
     VALUES ($1, $2, $3, 'global', $4, $5, $6)`,
    [name, email.toLowerCase(), hash, club, phone, title]
  );

  console.log(`✅ Bootstrap admin created:`);
  console.log(`   Name:  ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Club:  ${club}`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Title: ${title}`);
  console.log(`   Scope: global`);

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
