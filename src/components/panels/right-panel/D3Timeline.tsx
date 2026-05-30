import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

type Props = { futureCutoff?: number }

type TimelineEvent = {
  year: number
  label: string
  category: 'cosmic' | 'geological' | 'biological' | 'historical' | 'modern'
}

type Tooltip = { year: number; label: string; category: string; x: number; y: number }

const CATEGORY_COLOR: Record<string, string> = {
  cosmic:     '#4488cc',
  geological: '#886644',
  biological: '#448844',
  historical: '#c9a227',
  modern:     '#5588ff',
}

const NOW_YEAR = new Date().getFullYear()

const EVENTS: TimelineEvent[] = [
  { year: -13_800_000_000, label: 'Big Bang',               category: 'cosmic'     },
  { year: -13_600_000_000, label: 'Milky Way forms',        category: 'cosmic'     },
  { year: -13_000_000_000, label: 'First stars',            category: 'cosmic'     },
  { year:  -4_500_000_000, label: 'Earth forms',            category: 'geological' },
  { year:  -4_400_000_000, label: 'First oceans',           category: 'geological' },
  { year:  -3_800_000_000, label: 'First life',             category: 'biological' },
  { year:  -2_700_000_000, label: 'Photosynthesis',         category: 'biological' },
  { year:    -541_000_000, label: 'Cambrian explosion',     category: 'biological' },
  { year:    -530_000_000, label: 'First fish',             category: 'biological' },
  { year:    -470_000_000, label: 'First land plants',      category: 'biological' },
  { year:    -230_000_000, label: 'Dinosaurs appear',       category: 'biological' },
  { year:     -66_000_000, label: 'K-Pg extinction',        category: 'biological' },
  { year:     -65_000_000, label: 'First primates',         category: 'biological' },
  { year:        -300_000, label: 'Homo sapiens',           category: 'biological' },
  { year:         -10_000, label: 'Agricultural revolution',category: 'historical' },
  { year:          -3_200, label: 'First writing',          category: 'historical' },
  { year:          -3_100, label: 'Ancient Egypt',          category: 'historical' },
  { year:            -800, label: 'Classical Greece',       category: 'historical' },
  { year:             -44, label: 'Julius Caesar',          category: 'historical' },
  { year:             476, label: 'Fall of Rome',           category: 'historical' },
  { year:           1_492, label: 'Columbus',               category: 'historical' },
  { year:           1_760, label: 'Industrial Revolution',  category: 'historical' },
  { year:           1_789, label: 'French Revolution',      category: 'historical' },
  { year:           1_914, label: 'World War I',            category: 'modern'     },
  { year:           1_939, label: 'World War II',           category: 'modern'     },
  { year:           1_969, label: 'Moon landing',           category: 'modern'     },
  { year:           1_991, label: 'Internet',               category: 'modern'     },
  { year:        NOW_YEAR, label: 'Now',                    category: 'modern'     },
]

export function formatYear(year: number): string {
  if (year <= -1_000_000_000) {
    const b = -year / 1_000_000_000
    return `${+b.toFixed(1)} billion years ago`
  }
  if (year <= -1_000_000) return `${Math.round(-year / 1_000_000)} million BCE`
  if (year <= -1_000) return `${(-year).toLocaleString('en-US')} BCE`
  if (year < 0) return `${-year} BCE`
  if (year === 0) return '1 BCE / 1 CE'
  return `${year} CE`
}

const PAD = { top: 20, right: 10, bottom: 20, left: 55 }

export function D3Timeline({ futureCutoff = 2100 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    function draw() {
      const W = container!.clientWidth
      const H = container!.clientHeight
      if (W === 0 || H === 0) return

      const innerH = H - PAD.top - PAD.bottom
      const innerW = W - PAD.left - PAD.right

      const yBase = d3.scaleSymlog()
        .domain([-13_800_000_000, futureCutoff])
        .range([innerH, 0])
        .constant(1)

      const s = d3.select(svg)
      s.attr('width', W).attr('height', H)
      s.selectAll('*').remove()

      s.append('defs').append('clipPath').attr('id', 'timeline-clip')
        .append('rect').attr('x', 0).attr('y', 0)
        .attr('width', innerW + PAD.right).attr('height', innerH)

      const g = s.append('g').attr('transform', `translate(${PAD.left},${PAD.top})`)
      const axisG = g.append('g')
      const eventsG = g.append('g').attr('clip-path', 'url(#timeline-clip)')

      function renderAxis(y: d3.ScaleSymLog<number, number>) {
        axisG.selectAll('*').remove()
        axisG.call(
          d3.axisLeft(y).tickFormat((d: d3.NumberValue) => formatYear(+d))
        )
        axisG.select<SVGPathElement>('.domain').attr('stroke', '#333')
        axisG.selectAll<SVGTextElement, unknown>('text').attr('fill', '#666').attr('font-size', '10px')
        axisG.selectAll<SVGLineElement, unknown>('.tick line').attr('stroke', '#333')
      }

      function renderEvents(y: d3.ScaleSymLog<number, number>) {
        eventsG.selectAll('*').remove()

        const withPx = EVENTS.map(e => ({ ...e, py: y(e.year) }))
        const sorted = [...withPx].sort((a, b) => a.py - b.py)

        const showLabel = new Set<number>()
        for (let i = 0; i < sorted.length; i++) {
          const prev = sorted[i - 1]
          const next = sorted[i + 1]
          const clearPrev = !prev || Math.abs(sorted[i].py - prev.py) >= 12
          const clearNext = !next || Math.abs(next.py - sorted[i].py) >= 12
          if (clearPrev && clearNext) showLabel.add(sorted[i].year)
        }

        withPx.forEach(ev => {
          const isNow = ev.year === NOW_YEAR
          const color = CATEGORY_COLOR[ev.category]

          if (isNow) {
            eventsG.append('line')
              .attr('x1', 0).attr('x2', innerW)
              .attr('y1', ev.py).attr('y2', ev.py)
              .attr('stroke', color).attr('stroke-width', 1)
              .attr('stroke-dasharray', '4 3').attr('opacity', 0.5)
          }

          eventsG.append('circle')
            .attr('cx', 0).attr('cy', ev.py)
            .attr('r', isNow ? 6 : 4)
            .attr('fill', color)
            .attr('cursor', 'default')
            .on('mouseenter', (event: MouseEvent) => {
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              setTooltip({
                year: ev.year, label: ev.label, category: ev.category,
                x: event.clientX - rect.left, y: event.clientY - rect.top,
              })
            })
            .on('mouseleave', () => setTooltip(null))

          if (showLabel.has(ev.year)) {
            eventsG.append('line')
              .attr('x1', 0).attr('x2', 8)
              .attr('y1', ev.py).attr('y2', ev.py)
              .attr('stroke', color).attr('stroke-width', 1)
              .attr('pointer-events', 'none')
            eventsG.append('text')
              .attr('x', 12).attr('y', ev.py)
              .attr('dominant-baseline', 'central')
              .attr('font-size', '10px')
              .attr('fill', color)
              .attr('pointer-events', 'none')
              .text(ev.label)
          }
        })
      }

      renderAxis(yBase)
      renderEvents(yBase)

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 1_000_000])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          const zy = event.transform.rescaleY(yBase as unknown as any) as d3.ScaleSymLog<number, number>
          renderAxis(zy)
          renderEvents(zy)
        })

      d3.select(svg).call(zoom as any)
        .on('dblclick.zoom', () => {
          d3.select(svg).transition().duration(300).call(zoom.transform as any, d3.zoomIdentity)
        })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(container)
    return () => ro.disconnect()
  }, [futureCutoff])

  const containerW = containerRef.current?.offsetWidth ?? 0
  const tooltipStyle = tooltip ? {
    left: tooltip.x + 150 > containerW ? tooltip.x - 154 : tooltip.x + 12,
    top:  tooltip.y - 10,
  } : undefined

  return (
    <div ref={containerRef} className="flex-1 relative min-h-0 w-full overflow-hidden">
      <svg ref={svgRef} data-testid="d3-timeline" style={{ display: 'block' }} />
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none rounded border border-[#c9a227]/40 bg-[#0d0d14]/95 shadow-lg px-3 py-2"
          style={tooltipStyle}
        >
          <div className="text-[#c9a227] font-medium text-sm">{tooltip.label}</div>
          <div className="text-[#c8c8d8] text-xs mt-0.5">{formatYear(tooltip.year)}</div>
        </div>
      )}
    </div>
  )
}
