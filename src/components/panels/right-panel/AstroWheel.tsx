import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { ChartBody } from '../../../types/astro'

type Props = { bodies: ChartBody[] }

type Tooltip = { body: ChartBody; x: number; y: number }

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const SIGN_GLYPHS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  'North Node': '☊', 'South Node': '☋',
}

// Element colour by sign (muted, dark-theme friendly)
const ELEMENT_FILL: Record<string, string> = {
  Aries: '#4a1515', Leo: '#4a1515', Sagittarius: '#4a1515',   // fire
  Taurus: '#153320', Virgo: '#153320', Capricorn: '#153320',     // earth
  Gemini: '#112840', Libra: '#112840', Aquarius: '#112840',      // air
  Cancer: '#1a1240', Scorpio: '#1a1240', Pisces: '#1a1240',        // water
}

// Geocentric distance order: 0 = Moon (closest), 9 = Pluto (furthest).
// Nodes are mathematical points placed at the outer ring.
const GEOCENTRIC_ORDER: Record<string, number> = {
  Moon: 0, Mercury: 1, Venus: 2, Sun: 3, Mars: 4,
  Jupiter: 5, Saturn: 6, Uranus: 7, Neptune: 8, Pluto: 9,
  'North Node': 9, 'South Node': 9,
}

// Convention: 0° Aries at 9 o'clock (left), degrees increase counter-clockwise.
function lonToSvgAngle(lon: number): number {
  return (270 - lon) * (Math.PI / 180)
}

function polarToXY(cx: number, cy: number, r: number, svgAngle: number) {
  return {
    x: cx + r * Math.sin(svgAngle),
    y: cy - r * Math.cos(svgAngle),
  }
}

export function AstroWheel({ bodies }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState(280)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

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
    const outerR = size * 0.48
    const zodiacInner = size * 0.36
    const innerR = size * 0.18
    const minPlanetR = innerR + size * 0.015
    const maxPlanetR = zodiacInner - size * 0.025

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g')

    // ── Zodiac ring ──────────────────────────────────────────────
    SIGNS.forEach((sign, i) => {
      const startAngle = lonToSvgAngle((i + 1) * 30)
      const endAngle = lonToSvgAngle(i * 30)

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

      const midAngle = lonToSvgAngle((i + 0.5) * 30)
      const glyphR = (zodiacInner + outerR) / 2
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

    g.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', zodiacInner - 2)
      .attr('fill', 'none')
      .attr('stroke', '#2a2a3e')
      .attr('stroke-width', 0.5)

    // ── Planet glyphs ────────────────────────────────────────────
    bodies.forEach(body => {
      const distIdx = GEOCENTRIC_ORDER[body.name] ?? 5
      const planetR = minPlanetR + (distIdx / 9) * (maxPlanetR - minPlanetR)
      const angle = lonToSvgAngle(body.longitude)
      const { x, y } = polarToXY(cx, cy, planetR, angle)
      const glyph = PLANET_GLYPHS[body.name] ?? body.name[0]
      const fontSize = size * 0.052

      const planetG = g.append('g')
        .attr('transform', `translate(${x},${y})`)
        .attr('cursor', 'pointer')
        .attr('opacity', 0.32)
        .on('mouseover mousemove', (event: MouseEvent) => {
          d3.select(event.currentTarget as Element).raise().attr('opacity', 1)
          const rect = containerRef.current?.getBoundingClientRect()
          if (!rect) return
          setTooltip({ body, x: event.clientX - rect.left, y: event.clientY - rect.top })
        })
        .on('mouseleave', (event: MouseEvent) => {
          d3.select(event.currentTarget as Element).attr('opacity', 0.32)
          setTooltip(null)
        })

      // Larger invisible hit area so the tiny glyph is easy to hover
      planetG.append('circle')
        .attr('r', fontSize * 0.8)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')

      planetG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', fontSize)
        .attr('fill', '#c9a227')
        .attr('pointer-events', 'none')
        .text(glyph)

      if (body.retrograde) {
        planetG.append('text')
          .attr('x', fontSize * 0.45)
          .attr('y', -fontSize * 0.38)
          .attr('font-size', fontSize * 0.5)
          .attr('fill', '#c9a227')
          .attr('opacity', 0.8)
          .attr('pointer-events', 'none')
          .text('ʀ')
      }
    })
  }, [bodies, size])

  // Flip tooltip left when it would overflow the container right edge
  const containerWidth = containerRef.current?.offsetWidth ?? 0
  const tooltipStyle = tooltip
    ? {
      left: tooltip.x + 120 > containerWidth ? tooltip.x - 124 : tooltip.x + 12,
      top: tooltip.y - 10,
    }
    : undefined

  return (
    <div ref={containerRef} className="relative w-full flex justify-center">
      <svg
        ref={svgRef}
        data-testid="astro-wheel"
        viewBox={`0 0 ${size} ${size}`}
        className="w-full"
        style={{ aspectRatio: '1 / 1', maxHeight: 'calc(100vh - 200px)' }}
      />
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none rounded border border-[#2a2a3e] bg-[#0d0d14]/95 shadow-lg px-3 py-2 min-w-[112px]"
          style={tooltipStyle}
        >
          <div className="text-[#c9a227] font-medium text-sm leading-tight">
            {tooltip.body.signDegree.toFixed(1)}° {tooltip.body.sign}
          </div>
          <div className="text-[#c8c8d8] text-xs mt-1">
            {PLANET_GLYPHS[tooltip.body.name] ?? ''} {tooltip.body.name}
          </div>
          {tooltip.body.retrograde && (
            <div className="text-[#888] text-[10px] mt-0.5">ʀ retrograde</div>
          )}
        </div>
      )}
    </div>
  )
}
