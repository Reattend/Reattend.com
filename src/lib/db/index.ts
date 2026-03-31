import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const dbPath = path.resolve(process.cwd(), 'data', 'reattend.db')

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// Load sqlite-vec extension for ANN vector search
export let vecLoaded = false
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqliteVec = require('sqlite-vec')
  sqliteVec.load(sqlite)

  // Rowid ↔ UUID mapping table (vec0 needs integer rowids)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS vec_rowid_map (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE NOT NULL,
      workspace_id TEXT NOT NULL
    )
  `)

  // vec0 virtual table — 768-dim cosine distance (BGE-base-en-v1.5)
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_embeddings USING vec0(
      rowid INTEGER PRIMARY KEY,
      embedding float[768] distance_metric=cosine
    )
  `)

  vecLoaded = true
  console.log('[db] sqlite-vec loaded — ANN search active')
} catch (e) {
  console.warn('[db] sqlite-vec unavailable, using JS cosine fallback:', (e as Error).message)
}

export const db = drizzle(sqlite, { schema })
export { schema, sqlite }
export type DB = typeof db
