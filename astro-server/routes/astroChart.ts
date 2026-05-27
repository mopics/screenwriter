import { Hono } from 'hono'
import { computeChart } from '../lib/sweph'

export const astroChartRoutes = new Hono()

astroChartRoutes.get('/getAstroChart', (c) => {
  const jdStr = c.req.query('julianDate')
  const latStr = c.req.query('lat')
  const lonStr = c.req.query('lon')

  if (!jdStr || !latStr || !lonStr) {
    return c.json({ error: 'julianDate, lat, and lon are required' }, 400)
  }

  const julianDate = Number(jdStr)
  const lat = Number(latStr)
  const lon = Number(lonStr)

  if (isNaN(julianDate) || isNaN(lat) || isNaN(lon)) {
    return c.json({ error: 'julianDate, lat, and lon must be numbers' }, 400)
  }
  if (lat < -90 || lat > 90) {
    return c.json({ error: 'lat must be between -90 and 90' }, 400)
  }
  if (lon < -180 || lon > 180) {
    return c.json({ error: 'lon must be between -180 and 180' }, 400)
  }

  try {
    const bodies = computeChart(julianDate, lat, lon)
    return c.json({ bodies })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})
