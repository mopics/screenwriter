import { Hono } from 'hono'
import { db } from '../db'

type Row = { data: string }

export const projectsRoutes = new Hono()

projectsRoutes.get('/', (c) => {
  const rows = db.prepare('SELECT data FROM projects').all() as Row[]
  return c.json(rows.map(r => JSON.parse(r.data)))
})

projectsRoutes.get('/:id', (c) => {
  const row = db.prepare('SELECT data FROM projects WHERE id = ?')
    .get(c.req.param('id')) as Row | undefined
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(JSON.parse(row.data))
})

projectsRoutes.post('/', async (c) => {
  const project = await c.req.json()
  db.prepare('INSERT INTO projects (id, data, updated_at) VALUES (?, ?, ?)').run(
    project.id,
    JSON.stringify(project),
    new Date().toISOString()
  )
  return c.json(project, 201)
})

projectsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const project = await c.req.json()
  const result = db.prepare(
    'UPDATE projects SET data = ?, updated_at = ? WHERE id = ?'
  ).run(JSON.stringify(project), new Date().toISOString(), id)
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(project)
})

projectsRoutes.delete('/:id', (c) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?')
    .run(c.req.param('id'))
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
