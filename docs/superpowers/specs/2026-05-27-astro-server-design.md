# Astro Chart Server — Design Spec

**Date:** 2026-05-27

## Overview

A second Hono server (`astro-server/`) running on port 3002, integrated into the existing monorepo. Exposes a single GET endpoint that computes planetary positions for a given Julian date and geographic coordinates using the Swiss Ephemeris (`sweph` npm package).

## File Structure

```
astro-server/
  index.ts          — Hono app, port 3002, CORS middleware
  routes/
    astroChart.ts   — GET /api/getAstroChart handler + input validation
  lib/
    sweph.ts        — thin wrapper: initialises sweph, maps body names to IDs, runs swe_calc_ut
```

## Endpoint

```
GET /api/getAstroChart?julianDate=2451545.0&lat=51.5&lon=-0.12
```

### Query Parameters (all required)

| Param        | Type  | Constraints      |
|-------------|-------|-----------------|
| `julianDate` | float | Julian Day Number (UT) |
| `lat`        | float | −90 to 90       |
| `lon`        | float | −180 to 180     |

### Response — 200 OK

```json
{
  "bodies": [
    {
      "name": "Sun",
      "longitude": 280.46,
      "sign": "Capricorn",
      "signDegree": 10.46,
      "retrograde": false
    }
  ]
}
```

### Bodies Returned (in order)

Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node, South Node.

South Node is derived: `(northNodeLongitude + 180) % 360`.

### Error Responses

- `400 { "error": "<message>" }` — missing or invalid query params
- `500 { "error": "<message>" }` — sweph computation failure

## Implementation Details

### sweph usage

- `sweph.swe_set_ephe_path('')` called once at startup — uses bundled ephemeris data from the package
- `sweph.swe_calc_ut(julianDate, bodyId, sweph.SEFLG_SWIEPH)` returns `[longitude, latitude, distance, speedLon, speedLat, speedDist]`
- North Node: `sweph.SE_MEAN_NODE`
- Retrograde: `speedLon < 0`

### Zodiac computation

```ts
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const sign = SIGNS[Math.floor(longitude / 30)]
const signDegree = longitude % 30
```

### Body ID map

| Body        | sweph constant     |
|------------|-------------------|
| Sun         | `SE_SUN` (0)       |
| Moon        | `SE_MOON` (1)      |
| Mercury     | `SE_MERCURY` (2)   |
| Venus       | `SE_VENUS` (3)     |
| Mars        | `SE_MARS` (4)      |
| Jupiter     | `SE_JUPITER` (5)   |
| Saturn      | `SE_SATURN` (6)    |
| Uranus      | `SE_URANUS` (7)    |
| Neptune     | `SE_NEPTUNE` (8)   |
| Pluto       | `SE_PLUTO` (9)     |
| North Node  | `SE_MEAN_NODE` (10)|

## Monorepo Wiring

Changes to `package.json`:

- Add `sweph` to `dependencies`
- Add script: `"dev:astro": "tsx watch astro-server/index.ts"`
- Update `"dev"` to run client, server, and astro-server concurrently via `concurrently`

## Out of Scope

- House cusps, aspects, or other chart features
- Authentication or rate limiting
- Caching of results
