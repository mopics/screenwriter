import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'db.sqlite')

export const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)
