import { db } from './db'
import { mockProjects } from '../src/data/mockProjects'

export function seed() {
  const row = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }
  if (row.count > 0) return

  const insert = db.prepare(
    'INSERT INTO projects (id, data, updated_at) VALUES (?, ?, ?)'
  )
  for (const project of mockProjects) {
    insert.run(project.id, JSON.stringify(project), new Date().toISOString())
  }
  console.log(`[seed] Inserted ${mockProjects.length} demo projects`)
}
