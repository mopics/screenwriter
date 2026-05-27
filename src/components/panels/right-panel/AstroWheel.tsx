import { useEffect, useRef, useState } from 'react'
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
  const [size, setSize] = useState(280)

  useEffect(() => {
    if (!svgRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width)
      if (w > 0) setSize(w)
    })
    ro.observe(svgRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current) return
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
  }, [bodies, size])

  return (
    <svg
      ref={svgRef}
      data-testid="astro-wheel"
      viewBox={`0 0 ${size} ${size}`}
      className="w-full"
      style={{ aspectRatio: '1 / 1', maxHeight: 'calc(100vh - 200px)' }}
    />
  )
}
