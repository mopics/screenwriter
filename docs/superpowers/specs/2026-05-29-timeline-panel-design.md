# Timeline Panel — Design Spec

**Date:** 2026-05-29  
**Status:** Approved

---

## Overview

Add a D3.js vertical timeline to `TimelinePanel` spanning from the Big Bang to a configurable future year (default 2100 CE). The timeline is a reference/navigation tool — hover tooltips only, no click interaction. Mouse-scroll zooms in/out; double-click resets to full view.

---

## Component Structure

Mirrors the existing `AstroChartPanel` / `AstroWheel` split:

| File | Role |
|------|------|
| `src/components/panels/right-panel/TimelinePanel.tsx` | Thin wrapper; renders `<D3Timeline futureCutoff={2100} />` |
| `src/components/panels/right-panel/D3Timeline.tsx` | All D3 logic — scale, zoom, SVG rendering, tooltip state |

`TimelinePanel` stays a one-liner wrapper. All complexity lives in `D3Timeline`.

---

## Props

```ts
// D3Timeline
type Props = {
  futureCutoff?: number  // CE year, default 2100
}
```

---

## Data

A static array of `TimelineEvent` objects defined inside `D3Timeline.tsx`:

```ts
type TimelineEvent = {
  year: number      // CE year; negative = BCE (Big Bang ≈ -13_800_000_000)
  label: string
  category: 'cosmic' | 'geological' | 'biological' | 'historical' | 'modern'
}
```

### Included events (~25)

| Category | Events |
|----------|--------|
| cosmic | Big Bang (−13.8B), First stars (−13B), Milky Way forms (−13.6B) |
| geological | Earth forms (−4.5B), First oceans (−4.4B) |
| biological | First life (−3.8B), Photosynthesis (−2.7B), Cambrian explosion (−541M), First fish (−530M), First land plants (−470M), Dinosaurs appear (−230M), K-Pg extinction (−66M), First primates (−65M), Homo sapiens (−300K) |
| historical | Agricultural revolution (−10K), First writing (−3200), Ancient Egypt (−3100), Classical Greece (−800), Julius Caesar (−44), Fall of Rome (476), Columbus (1492), Industrial Revolution (1760), French Revolution (1789) |
| modern | WWI (1914), WWII (1939), Moon landing (1969), Internet (1991), Now (dynamic: `new Date().getFullYear()`) |

---

## Scale

- **Type:** `d3.scaleSymlog()`
- **Domain:** `[-13_800_000_000, futureCutoff]`
- **Range:** `[svgHeight, 0]` — inverted so past=bottom, future=top
- **Constant:** `C = 1` — symlog handles negative (BCE) years natively; compresses large magnitudes without singularity at year 0

---

## Zoom

- `d3.zoom()` attached to the SVG element
- On each zoom event: `transform.rescaleY(yBase)` produces a rescaled symlog copy (works because `rescaleY` adjusts pixel-space range, not the domain)
- `scaleExtent([1, 1_000_000])` — allows zooming from full view down to individual-year resolution
- Double-click resets to the initial full-range view
- D3 axis (`d3.axisLeft()`) redrawn on every zoom event using the current zoomed scale

---

## Visual Design

### Layout
```
padding: { top: 20, right: 10, bottom: 20, left: 55 }
SVG fills 100% of the container div (flex-1)
Axis line at x = left padding, running full height
```

### Event markers
- Circle r=4 on the axis, colour-coded by category
- Short horizontal tick extending right → label text
- When two events are < 12px apart (zoomed out), label suppressed — dot only; label reappears on zoom-in

### Colour palette
| Category | Colour |
|----------|--------|
| cosmic | `#4488cc` |
| geological | `#886644` |
| biological | `#448844` |
| historical | `#c9a227` (app gold) |
| modern | `#5588ff` |

### "Now" marker
- Larger circle (r=6) at `new Date().getFullYear()`
- Dashed horizontal line spanning full SVG width
- Label "Now" in `#5588ff`

### Tooltip
- React state: `{ year, label, category, x, y } | null`
- Triggered on SVG circle `mouseenter` / `mouseleave`
- Positioned as absolute `div` over the SVG
- Styling: `bg-[#0d0d14]`, `#c8c8d8` text, 1px gold border — matches right panel aesthetic
- Content: label + formatted year string

### Year formatting
```ts
year <= -1_000_000_000  →  "13.8 billion years ago"
year <= -1_000_000      →  "541 million BCE"
year <= -1_000          →  "3,200 BCE"
year < 0                →  "44 BCE"
year === 0              →  "1 BCE / 1 CE"
year > 0                →  "476 CE"
```

### Resize handling
`ResizeObserver` on the container div — redraws SVG on panel resize.

### Axis
- `d3.axisLeft()` — D3 auto-selects tick density based on zoom level
- Stroke `#333`, tick text `#666`
- Background: transparent (panel provides dark bg)

---

## Implementation Notes

- Pattern: `useRef` for SVG element + `useEffect` for D3 setup/teardown — identical to `AstroWheel.tsx`
- D3 zoom state stored via `d3.zoom().on('zoom', handler)` — not in React state (avoids re-render on every scroll tick)
- Tooltip position stored in React state (triggers re-render only on hover change — acceptable)
- D3 is already installed (`d3@^7.9.0`, `@types/d3@^7.4.3`)
- No new dependencies required
