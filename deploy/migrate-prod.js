#!/usr/bin/env node
/**
 * Production DB migration runner.
 * Run via: node deploy/migrate-prod.js
 * Safe to re-run — all statements are idempotent.
 */
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.resolve(process.cwd(), 'data', 'reattend.db'))
db.pragma('foreign_keys = ON')

function run(sql, label) {
  try {
    db.exec(sql)
    console.log(`  ✓ ${label}`)
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate')) {
      console.log(`  — ${label} (already exists)`)
    } else {
      console.error(`  ✗ ${label}: ${e.message}`)
    }
  }
}

function addColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.find(c => c.name === column)) {
    run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, `${table}.${column}`)
  } else {
    console.log(`  — ${table}.${column} (already exists)`)
  }
}

console.log('Running production migrations...')

// ─── chat_sessions ───────────────────────────────────────
run(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`, 'chat_sessions table')
run(`CREATE INDEX IF NOT EXISTS cs_user_idx ON chat_sessions(user_id)`, 'cs_user_idx')
run(`CREATE INDEX IF NOT EXISTS cs_updated_idx ON chat_sessions(updated_at)`, 'cs_updated_idx')

// ─── records: source / source_id / occurred_at / meta ────
addColumn('records', 'source', 'TEXT')
addColumn('records', 'source_id', 'TEXT')
addColumn('records', 'occurred_at', 'TEXT')
addColumn('records', 'meta', 'TEXT')

// ─── users: onboarding_completed ─────────────────────────
addColumn('users', 'onboarding_completed', 'INTEGER DEFAULT 0')

// ─── inbox_notifications: snoozed_until ──────────────────
addColumn('inbox_notifications', 'snoozed_until', 'TEXT')

// ─── Indexes ──────────────────────────────────────────────
run(`CREATE INDEX IF NOT EXISTS ri_external_id_idx ON raw_items(external_id)`, 'ri_external_id_idx')
run(`CREATE INDEX IF NOT EXISTS ri_source_idx ON raw_items(source_id)`, 'ri_source_idx')

console.log('Migrations complete.')
db.close()
