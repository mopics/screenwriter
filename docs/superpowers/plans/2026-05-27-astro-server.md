# Astro Chart Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second Hono server at `astro-server/` on port 3002 exposing `GET /api/getAstroChart` that returns planetary positions for a given Julian date and geographic coordinates.

**Architecture:** A thin Hono server mirrors the pattern of `./server` — a route module handles the single endpoint, a lib module wraps the `sweph` Swiss Ephemeris native addon. Pure utility functions (zodiac sign, retrograde) live in a separate file so they can be unit-tested without touching native code.

**Tech Stack:** Hono, `sweph` (Swiss Ephemeris native addon), Vitest, TypeScript, `tsx watch`

---

## File Map

| Action  | Path                                      | Responsibility                                  |
|---------|-------------------------------------------|-------------------------------------------------|
| Create  | `astro-server/index.ts`                   | Hono app, CORS, route mounting, `serve` on 3002 |
| Create  | `astro-server/routes/astroChart.ts`       | Query param validation, calls computeChart      |
| Create  | `astro-server/routes/astroChart.test.ts`  | Route tests (mock sweph.ts)                     |
| Create  | `astro-server/lib/astroUtils.ts`          | Pure helpers: longitudeToZodiac, isRetrograde   |
| Create  | `astro-server/lib/astroUtils.test.ts`     | Unit tests for pure helpers                     |
| Create  | `astro-server/lib/sweph.ts`               | sweph wrapper: computeChart                     |
| Modify  | `package.json`                            | Install sweph, add dev:astro script, update dev |

---

## Task 1: Install sweph and update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install sweph**

```bash
npm install sweph
```

Expected output: sweph appears in `node_modules/` and `package.json` dependencies.

- [ ] **Step 2: Update the dev scripts in package.json**

In `package.json`, replace the `scripts` block:

```json
"scripts": {
  "dev": "concurrently -n client,server,astro -c cyan,yellow,magenta \"npm run dev:client\" \"npm run dev:server\" \"npm run dev:astro\"",
  "dev:client": "vite",
  "dev:server": "tsx watch server/index.ts",
  "dev:astro": "tsx watch astro-server/index.ts",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:coverage": "vitest --coverage"
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install sweph, add dev:astro script"
```

---

## Task 2: Pure utility helpers with tests

**Files:**
- Create: `astro-server/lib/astroUtils.ts`
- Create: `astro-server/lib/astroUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `astro-server/lib/astroUtils.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { longitudeToZodiac, isRetrograde } from './astroUtils'

describe('longitudeToZodiac', () => {
  it('returns Aries for 0°', () => {
    expect(longitudeToZodiac(0)).toEqual({ sign: 'Aries', signDegree: 0 })
  })

  it('returns Aries for 29.99°', () => {
    const result = longitudeToZodiac(29.99)
    expect(result.sign).toBe('Aries')
    expect(result.signDegree).toBeCloseTo(29.99, 2)
  })

  it('returns Taurus for 30°', () => {
    expect(longitudeToZodiac(30)).toEqual({ sign: 'Taurus', signDegree: 0 })
  })

  it('returns Capricorn for 280.46°', () => {
    const result = longitudeToZodiac(280.46)
    expect(result.sign).toBe('Capricorn')
    expect(result.signDegree).toBeCloseTo(10.46, 2)
  })

  it('returns Pisces for 359.99°', () => {
    const result = longitudeToZodiac(359.99)
    expect(result.sign).toBe('Pisces')
    expect(result.signDegree).toBeCloseTo(29.99, 2)
  })

  it('handles longitude >= 360 by wrapping', () => {
    expect(longitudeToZodiac(360)).toEqual({ sign: 'Aries', signDegree: 0 })
  })
})

describe('isRetrograde', () => {
  it('returns true for negative speed', () => {
    expect(isRetrograde(-0.5)).toBe(true)
  })

  it('returns false for positive speed', () => {
    expect(isRetrograde(1.2)).toBe(false)
  })

  it('returns false for zero speed', () => {
    expect(isRetrograde(0)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run astro-server/lib/astroUtils.test.ts
```

Expected: FAIL — `Cannot find module './astroUtils'`

- [ ] **Step 3: Implement astroUtils.ts**

Create `astro-server/lib/astroUtils.ts`:

```typescript
const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export function longitudeToZodiac(longitude: number): { sign: string; signDegree: number } {
  const normalized = ((longitude % 360) + 360) % 360
  const sign = SIGNS[Math.floor(normalized / 30)]
  const signDegree = normalized % 30
  return { sign, signDegree }
}

export function isRetrograde(speedLon: number): boolean {
  return speedLon < 0
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run astro-server/lib/astroUtils.test.ts
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add astro-server/lib/astroUtils.ts astro-server/lib/astroUtils.test.ts
git commit -m "feat: add astroUtils pure helpers with tests"
```

---

## Task 3: sweph wrapper

**Files:**
- Create: `astro-server/lib/sweph.ts`

No unit tests — this file wraps a native addon. It is integration-tested via the smoke test in Task 6.

- [ ] **Step 1: Create astro-server/lib/sweph.ts**

```typescript
import sweph from 'sweph'
import { longitudeToZodiac, isRetrograde } from './astroUtils'

sweph.swe_set_ephe_path('')

export type ChartBody = {
  name: string
  longitude: number
  sign: string
  signDegree: number
  retrograde: boolean
}

type BodyDef = { name: string; id: number }

const BODIES: BodyDef[] = [
  { name: 'Sun',     id: sweph.SE_SUN },
  { name: 'Moon',    id: sweph.SE_MOON },
  { name: 'Mercury', id: sweph.SE_MERCURY },
  { name: 'Venus',   id: sweph.SE_VENUS },
  { name: 'Mars',    id: sweph.SE_MARS },
  { name: 'Jupiter', id: sweph.SE_JUPITER },
  { name: 'Saturn',  id: sweph.SE_SATURN },
  { name: 'Uranus',  id: sweph.SE_URANUS },
  { name: 'Neptune', id: sweph.SE_NEPTUNE },
  { name: 'Pluto',   id: sweph.SE_PLUTO },
  { name: 'North Node', id: sweph.SE_MEAN_NODE },
]

const FLAGS = sweph.SEFLG_SWIEPH | sweph.SEFLG_SPEED

export function computeChart(julianDate: number, _lat: number, _lon: number): ChartBody[] {
  const results: ChartBody[] = []

  for (const body of BODIES) {
    // swe_calc_ut returns { flag: number, error: string, data: [lon, lat, dist, lonSpd, latSpd, distSpd] }
    const calc = sweph.swe_calc_ut(julianDate, body.id, FLAGS)
    if (calc.flag < 0) throw new Error(`sweph error for ${body.name}: ${calc.error}`)
    const longitude = calc.data[0]
    const { sign, signDegree } = longitudeToZodiac(longitude)
    results.push({
      name: body.name,
      longitude,
      sign,
      signDegree,
      retrograde: isRetrograde(calc.data[3]),
    })
  }

  // South Node is directly opposite the North Node
  const northNode = results.find(b => b.name === 'North Node')!
  const southLon = (northNode.longitude + 180) % 360
  const { sign, signDegree } = longitudeToZodiac(southLon)
  results.push({
    name: 'South Node',
    longitude: southLon,
    sign,
    signDegree,
    retrograde: false,
  })

  return results
}
```

- [ ] **Step 2: Commit**

```bash
git add astro-server/lib/sweph.ts
git commit -m "feat: add sweph wrapper"
```

---

## Task 4: Route handler with validation tests

**Files:**
- Create: `astro-server/routes/astroChart.ts`
- Create: `astro-server/routes/astroChart.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `astro-server/routes/astroChart.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/sweph', () => ({
  computeChart: vi.fn(),
}))

import { computeChart } from '../lib/sweph'
import { astroChartRoutes } from './astroChart'

const mockComputeChart = vi.mocked(computeChart)

function makeApp() {
  const app = new Hono()
  app.route('/api', astroChartRoutes)
  return app
}

const MOCK_BODY = {
  name: 'Sun',
  longitude: 280.46,
  sign: 'Capricorn',
  signDegree: 10.46,
  retrograde: false,
}

describe('GET /api/getAstroChart', () => {
  beforeEach(() => {
    mockComputeChart.mockReturnValue([MOCK_BODY])
  })

  it('returns 400 when julianDate is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when lat is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when lon is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lat=51.5')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when lat is out of range', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lat=91&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('lat')
  })

  it('returns 400 when lon is out of range', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=181')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('lon')
  })

  it('returns 200 with bodies array on valid input', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=-0.12')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bodies).toHaveLength(1)
    expect(body.bodies[0]).toEqual(MOCK_BODY)
  })

  it('calls computeChart with parsed numbers', async () => {
    const app = makeApp()
    await app.request('/api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=-0.12')
    expect(mockComputeChart).toHaveBeenCalledWith(2451545.0, 51.5, -0.12)
  })

  it('returns 500 when computeChart throws', async () => {
    mockComputeChart.mockImplementation(() => { throw new Error('sweph failed') })
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=-0.12')
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run astro-server/routes/astroChart.test.ts
```

Expected: FAIL — `Cannot find module './astroChart'`

- [ ] **Step 3: Implement the route handler**

Create `astro-server/routes/astroChart.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run astro-server/routes/astroChart.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add astro-server/routes/astroChart.ts astro-server/routes/astroChart.test.ts
git commit -m "feat: add astroChart route with validation"
```

---

## Task 5: Server entry point

**Files:**
- Create: `astro-server/index.ts`

- [ ] **Step 1: Create astro-server/index.ts**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { astroChartRoutes } from './routes/astroChart'

const app = new Hono()
app.use('*', cors())
app.route('/api', astroChartRoutes)

serve({ fetch: app.fetch, port: 3002 }, () => {
  console.log('Astro server running on http://localhost:3002')
})
```

- [ ] **Step 2: Commit**

```bash
git add astro-server/index.ts
git commit -m "feat: add astro-server entry point on port 3002"
```

---

## Task 6: Smoke test

- [ ] **Step 1: Start the astro server**

```bash
npm run dev:astro
```

Expected: `Astro server running on http://localhost:3002`

- [ ] **Step 2: Hit the endpoint with a known date**

In a second terminal (Julian Day 2451545.0 = J2000, 1 Jan 2000 noon):

```bash
curl "http://localhost:3002/api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=-0.12"
```

Expected: JSON with a `bodies` array of 12 entries (Sun through South Node). Sun longitude should be approximately 280.5° (Capricorn ~10°).

- [ ] **Step 3: Confirm error handling**

```bash
curl "http://localhost:3002/api/getAstroChart?lat=51.5&lon=-0.12"
```

Expected: `{"error":"julianDate, lat, and lon are required"}` with HTTP 400.

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass (existing React tests + new astro-server tests).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: astro-server smoke test verified"
```
