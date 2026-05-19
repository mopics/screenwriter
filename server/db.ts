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

// Backfill expandedFields on characters that predate the field
const _rows = db.prepare('SELECT id, data FROM projects').all() as Array<{ id: string; data: string }>
for (const row of _rows) {
  const project = JSON.parse(row.data)
  let changed = false
  for (const char of project.characters ?? []) {
    if (!Array.isArray(char.expandedFields)) {
      char.expandedFields = []
      changed = true
    }
  }
  if (changed) {
    db.prepare('UPDATE projects SET data = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(project), new Date().toISOString(), row.id)
  }
}
