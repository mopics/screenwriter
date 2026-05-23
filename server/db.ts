import Database from 'better-sqlite3'
import { join } from 'path'
import { migrations } from './migrations'

const dbPath = join(process.cwd(), 'db.sqlite')

export const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

for (const migration of migrations) {
  migration.run(db)
}
