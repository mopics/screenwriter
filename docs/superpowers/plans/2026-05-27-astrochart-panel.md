# AstroChart Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AstroChart tab to RightPanel that fetches planet positions from `http://localhost:3002` and renders a circular D3 SVG wheel.

**Architecture:** React owns all state and data fetching via a `useAstroChart` hook; a pure `AstroWheel` component receives `bodies[]` and drives D3 to draw the SVG, re-running on every props change. `AstroChartPanel` wires the form, hook, and wheel together.

**Tech Stack:** React 19, D3 v7, TypeScript, Vitest, @testing-library/react, Tailwind CSS

---

## File Map

| Action  | Path                                                            | Responsibility                                      |
|---------|-----------------------------------------------------------------|-----------------------------------------------------|
| Create  | `src/types/astro.ts`                                            | `ChartBody` and `AstroChartParams` types            |
| Create  | `src/hooks/useAstroChart.ts`                                    | Fetch from astro-server, return bodies/loading/error|
| Create  | `src/hooks/useAstroChart.test.ts`                               | Hook tests (mock fetch)                             |
| Create  | `src/components/panels/right-panel/AstroWheel.tsx`              | Pure D3 SVG wheel, no fetch                         |
| Create  | `src/components/panels/right-panel/AstroWheel.test.tsx`         | Smoke test: SVG renders                             |
| Create  | `src/components/panels/right-panel/AstroChartPanel.tsx`         | Form + layout, owns fetch state                     |
| Create  | `src/components/panels/right-panel/AstroChartPanel.test.tsx`    | Panel tests (mock hook + wheel)                     |
| Modify  | `src/components/RightPanel.tsx`                                 | Add `'astrochart'` tab                              |
| Modify  | `package.json`                                                  | Add `d3` dependency                                 |

---

## Task 1: Install d3 and create types

**Files:**
- Modify: `package.json`
- Create: `src/types/astro.ts`

- [ ] **Step 1: Install d3**

```bash
npm install d3
npm install --save-dev @types/d3
```

Expected: `d3` appears in `dependencies`, `@types/d3` in `devDependencies`.

- [ ] **Step 2: Create `src/types/astro.ts`**

```typescript
export type ChartBody = {
  name: string
  longitude: number
  sign: string
  signDegree: number
  retrograde: boolean
}

export type AstroChartParams = {
  day: number
  month: number
  year: number
  time: number
  lat: number
  lon: number
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/types/astro.ts
git commit -m "feat: install d3, add astro types"
```

---

## Task 2: useAstroChart hook with tests

**Files:**
- Create: `src/hooks/useAstroChart.ts`
- Create: `src/hooks/useAstroChart.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useAstroChart.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAstroChart } from './useAstroChart'

const MOCK_BODIES = [
  { name: 'Sun', longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
]
const PARAMS = { day: 1, month: 1, year: 2000, time: 12, lat: 51.5, lon: -0.12 }

beforeEach(() => { vi.restoreAllMocks() })

describe('useAstroChart', () => {
  it('starts with bodies null, loading false, error null', () => {
    const { result } = renderHook(() => useAstroChart())
    expect(result.current.bodies).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading true while fetching', async () => {
    let resolve: (v: Response) => void = () => {}
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(r => { resolve = r })
    )
    const { result } = renderHook(() => useAstroChart())
    act(() => { result.current.fetchChart(PARAMS) })
    expect(result.current.loading).toBe(true)
    await act(async () =>
      resolve(new Response(JSON.stringify({ bodies: [] }), { status: 200 }))
    )
  })

  it('sets bodies on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bodies: MOCK_BODIES }), { status: 200 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.bodies).toEqual(MOCK_BODIES)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets error from response body on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'lat out of range' }), { status: 400 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.error).toBe('lat out of range')
    expect(result.current.bodies).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets "Server unreachable" on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed to fetch'))
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.error).toBe('Server unreachable')
  })

  it('builds the correct URL', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bodies: [] }), { status: 200 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() =>
      result.current.fetchChart({ day: 17, month: 4, year: 1998, time: 12, lat: 52.725, lon: 5.744 })
    )
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3002/api/getAstroChart?day=17&month=4&year=1998&time=12&lat=52.725&lon=5.744'
    )
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/hooks/useAstroChart.test.ts
```

Expected: FAIL — `Cannot find module './useAstroChart'`

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useAstroChart.ts`:

```typescript
import { useState } from 'react'
import type { ChartBody, AstroChartParams } from '../types/astro'

type State = {
  bodies: ChartBody[] | null
  loading: boolean
  error: string | null
}

export function useAstroChart() {
  const [state, setState] = useState<State>({ bodies: null, loading: false, error: null })

  async function fetchChart(params: AstroChartParams) {
    const { day, month, year, time, lat, lon } = params
    setState({ bodies: null, loading: true, error: null })
    const url = `http://localhost:3002/api/getAstroChart?day=${day}&month=${month}&year=${year}&time=${time}&lat=${lat}&lon=${lon}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setState({ bodies: null, loading: false, error: body.error ?? `HTTP ${res.status}` })
        return
      }
      const data = await res.json() as { bodies: ChartBody[] }
      setState({ bodies: data.bodies, loading: false, error: null })
    } catch {
      setState({ bodies: null, loading: false, error: 'Server unreachable' })
    }
  }

  return { ...state, fetchChart }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/hooks/useAstroChart.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAstroChart.ts src/hooks/useAstroChart.test.ts
git commit -m "feat: add useAstroChart hook"
```

---

## Task 3: AstroWheel D3 SVG component

**Files:**
- Create: `src/components/panels/right-panel/AstroWheel.tsx`
- Create: `src/components/panels/right-panel/AstroWheel.test.tsx`

D3 manipulates real SVG DOM; jsdom has limited SVG support. Tests are kept to a smoke test only.

- [ ] **Step 1: Write the smoke test**

Create `src/components/panels/right-panel/AstroWheel.test.tsx`:

```typescript
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AstroWheel } from './AstroWheel'

const MOCK_BODIES = [
  { name: 'Sun',  longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
  { name: 'Moon', longitude: 223.32, sign: 'Scorpio',   signDegree: 13.32, retrograde: true  },
]

describe('AstroWheel', () => {
  it('renders an SVG with data-testid="astro-wheel"', () => {
    const { container } = render(<AstroWheel bodies={MOCK_BODIES} />)
    expect(container.querySelector('svg[data-testid="astro-wheel"]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/components/panels/right-panel/AstroWheel.test.tsx
```

Expected: FAIL — `Cannot find module './AstroWheel'`

- [ ] **Step 3: Implement AstroWheel**

Create `src/components/panels/right-panel/AstroWheel.tsx`:

```typescript
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { ChartBody } from '../../../types/astro'

type Props = { bodies: ChartBody[] }

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
]

const SIGN_GLYPHS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋',
  Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏',
  Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇',
  'North Node':'☊', 'South Node':'☋',
}

// Element colour by sign (muted, dark-theme friendly)
const ELEMENT_FILL: Record<string, string> = {
  Aries:'#4a1515',    Leo:'#4a1515',    Sagittarius:'#4a1515',   // fire
  Taurus:'#153320',   Virgo:'#153320',  Capricorn:'#153320',     // earth
  Gemini:'#112840',   Libra:'#112840',  Aquarius:'#112840',      // air
  Cancer:'#1a1240',   Scorpio:'#1a1240',Pisces:'#1a1240',        // water
}

// Convert ecliptic longitude to D3/SVG angle (radians, clockwise from top).
// Convention: 0° Aries at 9 o'clock (left), degrees increase counter-clockwise.
// SVG angle formula: (270 - lon) * π/180
function lonToSvgAngle(lon: number): number {
  return (270 - lon) * (Math.PI / 180)
}

// Convert SVG angle to (x, y) on a circle of radius r centred at (cx, cy).
function polarToXY(cx: number, cy: number, r: number, svgAngle: number) {
  return {
    x: cx + r * Math.sin(svgAngle),
    y: cy - r * Math.cos(svgAngle),
  }
}

export function AstroWheel({ bodies }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const size = svgRef.current.clientWidth || 280
    const cx = size / 2
    const cy = size / 2
    const outerR      = size * 0.48
    const zodiacInner = size * 0.36
    const planetR     = size * 0.29
    const innerR      = size * 0.18

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g')

    // ── Zodiac ring ──────────────────────────────────────────────
    SIGNS.forEach((sign, i) => {
      // D3 arc angles (radians, clockwise from top):
      // sign segment covers ecliptic i*30 → (i+1)*30
      const startAngle = lonToSvgAngle((i + 1) * 30)
      const endAngle   = lonToSvgAngle(i * 30)

      const pathData = d3.arc()({
        innerRadius: zodiacInner,
        outerRadius: outerR,
        startAngle,
        endAngle,
      })

      g.append('path')
        .attr('d', pathData)
        .attr('transform', `translate(${cx},${cy})`)
        .attr('fill', ELEMENT_FILL[sign])
        .attr('stroke', '#080810')
        .attr('stroke-width', 1)

      // Sign glyph at midpoint of segment
      const midAngle = lonToSvgAngle((i + 0.5) * 30)
      const glyphR   = (zodiacInner + outerR) / 2
      const { x, y } = polarToXY(cx, cy, glyphR, midAngle)
      g.append('text')
        .attr('x', x).attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', size * 0.05)
        .attr('fill', '#c8c8d8')
        .attr('pointer-events', 'none')
        .text(SIGN_GLYPHS[sign])
    })

    // Division ticks at sign boundaries
    for (let i = 0; i < 12; i++) {
      const angle = lonToSvgAngle(i * 30)
      const inner = polarToXY(cx, cy, zodiacInner, angle)
      const outer = polarToXY(cx, cy, outerR, angle)
      g.append('line')
        .attr('x1', inner.x).attr('y1', inner.y)
        .attr('x2', outer.x).attr('y2', outer.y)
        .attr('stroke', '#080810')
        .attr('stroke-width', 1.5)
    }

    // ── Inner dark discs ─────────────────────────────────────────
    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', zodiacInner)
      .attr('fill', '#0d0d14')
      .attr('stroke', '#1a1a2e')
      .attr('stroke-width', 0.5)

    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', innerR)
      .attr('fill', '#080810')

    // Planet ring separator
    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', zodiacInner - 2)
      .attr('fill', 'none')
      .attr('stroke', '#2a2a3e')
      .attr('stroke-width', 0.5)

    // ── Planet glyphs ────────────────────────────────────────────
    bodies.forEach(body => {
      const angle       = lonToSvgAngle(body.longitude)
      const { x, y }   = polarToXY(cx, cy, planetR, angle)
      const glyph       = PLANET_GLYPHS[body.name] ?? body.name[0]
      const fontSize    = size * 0.052

      const planetG = g.append('g').attr('transform', `translate(${x},${y})`)

      planetG.append('title')
        .text(`${body.name} · ${body.sign} ${body.signDegree.toFixed(1)}°${body.retrograde ? ' ℞' : ''}`)

      planetG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', fontSize)
        .attr('fill', '#c9a227')
        .text(glyph)

      if (body.retrograde) {
        planetG.append('text')
          .attr('x', fontSize * 0.45)
          .attr('y', -fontSize * 0.38)
          .attr('font-size', fontSize * 0.5)
          .attr('fill', '#c9a227')
          .attr('opacity', 0.8)
          .text('ʀ')
      }
    })
  }, [bodies])

  return (
    <svg
      ref={svgRef}
      data-testid="astro-wheel"
      viewBox="0 0 280 280"
      className="w-full max-w-[320px]"
      style={{ aspectRatio: '1 / 1' }}
    />
  )
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/components/panels/right-panel/AstroWheel.test.tsx
```

Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/right-panel/AstroWheel.tsx src/components/panels/right-panel/AstroWheel.test.tsx
git commit -m "feat: add AstroWheel D3 SVG component"
```

---

## Task 4: AstroChartPanel with tests

**Files:**
- Create: `src/components/panels/right-panel/AstroChartPanel.tsx`
- Create: `src/components/panels/right-panel/AstroChartPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/panels/right-panel/AstroChartPanel.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock the hook so no real fetch happens
vi.mock('../../../hooks/useAstroChart')
// Mock AstroWheel so D3 doesn't run in jsdom
vi.mock('./AstroWheel', () => ({
  AstroWheel: () => <svg data-testid="astro-wheel" />,
}))

import { useAstroChart } from '../../../hooks/useAstroChart'
import { AstroChartPanel } from './AstroChartPanel'

const mockUseAstroChart = vi.mocked(useAstroChart)

function setup(overrides: Partial<ReturnType<typeof useAstroChart>> = {}) {
  mockUseAstroChart.mockReturnValue({
    bodies: null,
    loading: false,
    error: null,
    fetchChart: vi.fn(),
    ...overrides,
  })
}

describe('AstroChartPanel', () => {
  it('renders all 6 input labels', () => {
    setup()
    render(<AstroChartPanel />)
    expect(screen.getByText('Day')).toBeDefined()
    expect(screen.getByText('Month')).toBeDefined()
    expect(screen.getByText('Year')).toBeDefined()
    expect(screen.getByText(/Time/i)).toBeDefined()
    expect(screen.getByText('Lat')).toBeDefined()
    expect(screen.getByText('Lon')).toBeDefined()
  })

  it('renders Draw Chart button', () => {
    setup()
    render(<AstroChartPanel />)
    expect(screen.getByRole('button', { name: /Draw Chart/i })).toBeDefined()
  })

  it('calls fetchChart on form submit', () => {
    const fetchChart = vi.fn()
    setup({ fetchChart })
    render(<AstroChartPanel />)
    const form = screen.getByRole('button', { name: /Draw Chart/i }).closest('form')!
    fireEvent.submit(form)
    expect(fetchChart).toHaveBeenCalledOnce()
  })

  it('shows "Loading…" button text when loading', () => {
    setup({ loading: true })
    render(<AstroChartPanel />)
    expect(screen.getByRole('button', { name: /Loading/i })).toBeDefined()
  })

  it('disables button when loading', () => {
    setup({ loading: true })
    render(<AstroChartPanel />)
    expect((screen.getByRole('button', { name: /Loading/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows error message when error is set', () => {
    setup({ error: 'Server unreachable' })
    render(<AstroChartPanel />)
    expect(screen.getByText('Server unreachable')).toBeDefined()
  })

  it('renders AstroWheel when bodies is non-null', () => {
    setup({
      bodies: [
        { name: 'Sun', longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
      ],
    })
    const { container } = render(<AstroChartPanel />)
    expect(container.querySelector('[data-testid="astro-wheel"]')).not.toBeNull()
  })

  it('shows placeholder SVG ring when bodies is null', () => {
    setup({ bodies: null })
    const { container } = render(<AstroChartPanel />)
    // No astro-wheel, but there is a placeholder circle
    expect(container.querySelector('[data-testid="astro-wheel"]')).toBeNull()
    expect(container.querySelector('circle')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/panels/right-panel/AstroChartPanel.test.tsx
```

Expected: FAIL — `Cannot find module './AstroChartPanel'`

- [ ] **Step 3: Implement AstroChartPanel**

Create `src/components/panels/right-panel/AstroChartPanel.tsx`:

```typescript
import { useState } from 'react'
import { useAstroChart } from '../../../hooks/useAstroChart'
import { AstroWheel } from './AstroWheel'
import type { AstroChartParams } from '../../../types/astro'

const INPUT_CLASS = 'bg-[#0d0d14] border border-[#1a1a2e] rounded px-2 py-1 text-xs text-[#c8c8d8] w-full'
const LABEL_CLASS = 'text-[10px] text-[#555] uppercase tracking-wide'

export function AstroChartPanel() {
  const { bodies, loading, error, fetchChart } = useAstroChart()
  const [params, setParams] = useState<AstroChartParams>({
    day: 17, month: 4, year: 1998, time: 12,
    lat: 52.72518188565001, lon: 5.744661612787922,
  })

  function set(field: keyof AstroChartParams) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setParams(prev => ({ ...prev, [field]: Number(e.target.value) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchChart(params)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-4 gap-1">
          {([
            ['Day',     'day',   {}],
            ['Month',   'month', {}],
            ['Year',    'year',  {}],
            ['Time (h)','time',  { step: '0.1' }],
          ] as const).map(([label, field, extra]) => (
            <label key={field} className="flex flex-col gap-0.5">
              <span className={LABEL_CLASS}>{label}</span>
              <input
                type="number"
                value={params[field as keyof AstroChartParams]}
                onChange={set(field as keyof AstroChartParams)}
                className={INPUT_CLASS}
                {...extra}
              />
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {([['Lat', 'lat'], ['Lon', 'lon']] as const).map(([label, field]) => (
            <label key={field} className="flex flex-col gap-0.5">
              <span className={LABEL_CLASS}>{label}</span>
              <input
                type="number"
                step="any"
                value={params[field]}
                onChange={set(field)}
                className={INPUT_CLASS}
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Draw Chart'}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      <div className="flex-1 flex items-center justify-center min-h-0">
        {bodies ? (
          <AstroWheel bodies={bodies} />
        ) : (
          <svg viewBox="0 0 200 200" className="w-full max-w-[280px] opacity-10">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#c8c8d8" strokeWidth="1" />
          </svg>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/panels/right-panel/AstroChartPanel.test.tsx
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/right-panel/AstroChartPanel.tsx src/components/panels/right-panel/AstroChartPanel.test.tsx
git commit -m "feat: add AstroChartPanel"
```

---

## Task 5: Wire up RightPanel tab

**Files:**
- Modify: `src/components/RightPanel.tsx`

- [ ] **Step 1: Update RightPanel.tsx**

Replace the full contents of `src/components/RightPanel.tsx` with:

```typescript
import { useState } from 'react'
import { useResize } from '../hooks/useResize'
import { SketchesPanel } from './panels/right-panel/SketchesPanel'
import { OutlinerPanel } from './panels/right-panel/OutlinerPanel'
import { AstroChartPanel } from './panels/right-panel/AstroChartPanel'
import type { Project } from '../types/project'

type Tab = 'sketches' | 'outliner' | 'astrochart'

const TABS: { key: Tab; label: string }[] = [
  { key: 'sketches',   label: 'Sketches' },
  { key: 'outliner',   label: 'Outliner' },
  { key: 'astrochart', label: 'AstroChart' },
]

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function RightPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const { width, dragHandleProps } = useResize(360, 200, 1300, 'left', 200)
  const [activeTab, setActiveTab] = useState<Tab>('sketches')

  return (
    <div
      className="relative shrink-0 flex flex-col overflow-hidden border-l border-[#1a1a2e]"
      style={{ width }}
    >
      <div {...dragHandleProps} />
      <div className="flex border-b border-[#1a1a2e] shrink-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-xs tracking-wide transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? 'border-b-[#c9a227] text-[#c9a227]'
                : 'border-b-transparent text-[#555] hover:text-[#888]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'sketches' && (
        <SketchesPanel
          project={project}
          onUpdate={onUpdate}
          selectedId={selectedId}
          onSelectId={onSelectId}
        />
      )}
      {activeTab === 'outliner' && <OutlinerPanel />}
      {activeTab === 'astrochart' && <AstroChartPanel />}
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: All astro-server and new src tests pass. The pre-existing 5 failing panel tests (ActsPanel, CharactersPanel, ScenesPanel) were failing before this task — they are not regressions.

- [ ] **Step 3: Commit**

```bash
git add src/components/RightPanel.tsx
git commit -m "feat: add AstroChart tab to RightPanel"
```

---

## Task 6: Smoke test in browser

- [ ] **Step 1: Start all servers**

```bash
npm run dev:astro   # terminal 1 — astro server on port 3002
npm run dev:client  # terminal 2 — Vite on port 5173
```

- [ ] **Step 2: Open a project and navigate to AstroChart tab**

Open `http://localhost:5173`, open any project, click the **AstroChart** tab in the right panel.

Expected: The tab is visible and active. The form shows Day/Month/Year/Time/Lat/Lon inputs pre-filled with the example values. A dim placeholder circle is shown below.

- [ ] **Step 3: Draw a chart**

Click **Draw Chart** with the default values:
```
Day=17  Month=4  Year=1998  Time=12
Lat=52.72518188565001  Lon=5.744661612787922
```

Expected:
- Button briefly shows "Loading…"
- The zodiac wheel appears with 12 coloured segments and sign glyphs
- Planet glyphs (☉ ☽ ☿ …) are visible on the planet ring
- Hovering a glyph shows a tooltip like `Sun · Aries 27.1°`

- [ ] **Step 4: Test error handling**

Stop the astro server (`Ctrl+C` in terminal 1) and click Draw Chart again.

Expected: Button returns to "Draw Chart", red error message "Server unreachable" appears below the button.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: AstroChart panel smoke test verified"
```
