import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { projectsRoutes } from './routes/projects'
import { seed } from './seed'

seed()

const app = new Hono()
app.use('*', cors())
app.route('/api/projects', projectsRoutes)

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server running on http://localhost:3001')
})
