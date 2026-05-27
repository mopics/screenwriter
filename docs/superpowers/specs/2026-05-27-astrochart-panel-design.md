# AstroChart Panel — Design Spec

**Date:** 2026-05-27

## Overview

Add an `AstroChart` tab to `RightPanel` that displays a circular astrological wheel chart using D3.js. The chart fetches planet positions from the local `astro-server` running on port 3002. A manual input form (day, month, year, time, lat, lon) controls what chart is drawn. The architecture is structured to support a future play/animation feature.

---

## File Structure

| Action  | Path                                                       | Responsibility                                      |
|---------|------------------------------------------------------------|-----------------------------------------------------|
| Create  | `src/types/astro.ts`                                       | `ChartBody` type                                    |
| Create  | `src/hooks/useAstroChart.ts`                               | Fetch logic — returns `{ bodies, loading, error, fetchChart }` |
| Create  | `src/components/panels/right-panel/AstroChartPanel.tsx`    | Form + layout, owns fetch state, renders wheel      |
| Create  | `src/components/panels/right-panel/AstroWheel.tsx`         | Pure D3 SVG wheel — receives `bodies[]`, no fetch   |
| Modify  | `src/components/RightPanel.tsx`                            | Add `'astrochart'` tab                              |
| Modify  | `package.json`                                             | Add `d3` and `@types/d3` dependencies               |

---

## Types

```typescript
// src/types/astro.ts
export type ChartBody = {
  name: string
  longitude: number      // 0–360 ecliptic longitude
  sign: string           // e.g. "Scorpio"
  signDegree: number     // 0–30 degrees within sign
  retrograde: boolean
}

export type AstroChartParams = {
  day: number
  month: number
  year: number
  time: number           // decimal hours, 0–24
  lat: number
  lon: number
}
```

---

## Hook: `useAstroChart`

```typescript
// src/hooks/useAstroChart.ts
function useAstroChart(): {
  bodies: ChartBody[] | null
  loading: boolean
  error: string | null
  fetchChart: (params: AstroChartParams) => void
}
```

- Calls `http://localhost:3002/api/getAstroChart?day=&month=&year=&time=&lat=&lon=`
- Sets `loading = true` before fetch, `false` after
- On HTTP error or network failure: sets `error` to the message string
- On success: sets `bodies` from `response.bodies`

---

## Component: `AstroChartPanel`

**Layout (top to bottom):**

1. **Input form** — two compact rows:
   - Row 1: Day, Month, Year, Time (decimal hours)
   - Row 2: Lat, Lon
   - "Draw Chart" button — triggers `fetchChart`
2. **Status area** — spinner while loading, red error message on failure
3. **Wheel area** — `<AstroWheel bodies={bodies} />` when bodies is non-null; dim placeholder ring otherwise

**Future play hook-in:** `AstroChartPanel` will eventually hold a `time` state (decimal hours) that a play button increments on a `setInterval`. The hook re-fetches on each tick; the wheel animates via D3 transitions. No play UI is built now — the structure just must not prevent it.

---

## Component: `AstroWheel`

**Props:** `{ bodies: ChartBody[] }`

**SVG structure (D3-drawn, square aspect ratio, fills panel width):**

```
[outermost] zodiac ring — 12 segments of 30°, colored by element
[middle]    planet ring — glyphs placed at ecliptic longitude
[inner]     empty dark disc — reserved for future aspects
```

**Coordinate system:**
- 0° Aries at 9 o'clock (leftmost point) — standard Western astrological convention (East on horizon)
- Degrees increase counter-clockwise

**Zodiac ring:**
- 12 segments, each 30°
- Colored by element:
  - Fire (Aries ♈, Leo ♌, Sagittarius ♐): `#8b2020` (muted red)
  - Earth (Taurus ♉, Virgo ♍, Capricorn ♑): `#2d5a27` (muted green)
  - Air (Gemini ♊, Libra ♎, Aquarius ♒): `#1a4a6b` (muted blue)
  - Water (Cancer ♋, Scorpio ♏, Pisces ♓): `#2d1a5a` (muted indigo)
- Sign glyph (Unicode) centered in each segment

**Planet ring:**
- Each body placed on a circle at its `longitude` angle
- Unicode glyph for each body (see table below)
- Retrograde bodies: small superscript `ʀ` next to glyph
- Hover tooltip: `"{name} · {sign} {signDegree.toFixed(1)}°"`

**Planet glyphs:**

| Body       | Glyph |
|-----------|-------|
| Sun        | ☉     |
| Moon       | ☽     |
| Mercury    | ☿     |
| Venus      | ♀     |
| Mars       | ♂     |
| Jupiter    | ♃     |
| Saturn     | ♄     |
| Uranus     | ♅     |
| Neptune    | ♆     |
| Pluto      | ♇     |
| North Node | ☊     |
| South Node | ☋     |

**D3 rendering:**
- `useEffect` re-runs whenever `bodies` changes
- Uses `d3.select(svgRef.current)` to draw/update
- No React state inside `AstroWheel` — purely driven by props

---

## RightPanel Changes

```typescript
type Tab = 'sketches' | 'outliner' | 'astrochart'

const TABS = [
  { key: 'sketches',   label: 'Sketches' },
  { key: 'outliner',   label: 'Outliner' },
  { key: 'astrochart', label: 'AstroChart' },
]
```

The panel renders `<AstroChartPanel />` when `activeTab === 'astrochart'`. `AstroChartPanel` does not receive `project` props — it is self-contained.

---

## Out of Scope

- Aspects (planned for later)
- Play/animation UI (architecture supports it, no UI built now)
- House system / Ascendant
- Saving chart params to the project
- Any proxy configuration changes (calls go directly to `http://localhost:3002`)
