import type { Database } from 'better-sqlite3'

type Migration = {
  name: string
  run: (db: Database) => void
}

/*
When you need a new migration going forward, append a new object to the array in server/migrations.ts. 
The name is just for readability — there's no tracking table, so each one runs on every startup. 
That's fine for idempotent backfills; worth noting if you ever need a one-shot destructive migration.
*/

export const migrations: Migration[] = [
  {
    name: 'backfill-character-expandedFields',
    run(db) {
      const rows = db.prepare('SELECT id, data FROM projects').all() as Array<{ id: string; data: string }>
      for (const row of rows) {
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
    },
  },
  {
    name: 'backfill-projectSettings',
    run(db) {
      const rows = db.prepare('SELECT id, data FROM projects').all() as Array<{ id: string; data: string }>
      for (const row of rows) {
        const project = JSON.parse(row.data)
        let changed = false
        if (!project.settings) {
          project.settings = { activePanel: 'synopsis', mainFontSize: 'sm' }
          changed = true
        } else {
          if (!project.settings.mainFontSize) { project.settings.mainFontSize = 'sm'; changed = true }
          if (!project.settings.activePanel) { project.settings.activePanel = 'synopsis'; changed = true }
        }
        if (changed) {
          db.prepare('UPDATE projects SET data = ?, updated_at = ? WHERE id = ?')
            .run(JSON.stringify(project), new Date().toISOString(), row.id)
        }
      }
    },
  },
  {
    name: 'backfill-settings-fontSizes',
    run(db) {
      const defaultFontSizes = { scenes: 'sm', synopsis: 'sm', characters: 'sm', acts: 'sm' }
      const rows = db.prepare('SELECT id, data FROM projects').all() as Array<{ id: string; data: string }>
      for (const row of rows) {
        const project = JSON.parse(row.data)
        let changed = false
        if (!project.settings) {
          project.settings = { activePanel: 'synopsis', fontSizes: defaultFontSizes }
          changed = true
        } else if (!project.settings.fontSizes) {
          project.settings.fontSizes = defaultFontSizes
          changed = true
        } else {
          for (const key of Object.keys(defaultFontSizes) as Array<keyof typeof defaultFontSizes>) {
            if (!project.settings.fontSizes[key]) {
              project.settings.fontSizes[key] = 'sm'
              changed = true
            }
          }
        }
        if (changed) {
          db.prepare('UPDATE projects SET data = ?, updated_at = ? WHERE id = ?')
            .run(JSON.stringify(project), new Date().toISOString(), row.id)
        }
      }
    },
  },
]
