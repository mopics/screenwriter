import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

type Props = {
  futureCutoff?: number
  extraEvents?: TimelineEvent[]
  showAllTrigger?: number
  onAddEvent?: () => void
  onShowAll?: () => void
  onUpdateEvent?: (updated: TimelineEvent, index: number) => void
}

export type TimeLineEventCategory = 'cosmic' | 'geological' | 'biological' | 'historical' | 'modern' | 'fictional' | 'birth' | 'death'
export type TimelineEvent = {
  year: number
  label: string
  description?: string
  category: TimeLineEventCategory
}

type Tooltip = { year: number; label: string; category: string; x: number; y: number }
type Detail = {
  year: number; label: string; description?: string
  category: TimelineEvent['category']; color: string
  x: number; y: number
  extraIndex?: number
}

const CATEGORY_COLOR: Record<string, string> = {
  cosmic: '#4488cc',
  geological: '#886644',
  biological: '#448844',
  historical: '#c9a227',
  modern: '#5588ff',
  fictional: '#9b59b6',
  birth: '#44cc88',
  death: '#cc4444',
}

const NOW_YEAR = new Date().getFullYear()

const EVENTS: TimelineEvent[] = [
  { year: -13_800_000_000, label: 'Big Bang', category: 'cosmic' },
  { year: -13_600_000_000, label: 'Milky Way forms', category: 'cosmic' },
  { year: -13_000_000_000, label: 'First stars', category: 'cosmic' },
  { year: -4_500_000_000, label: 'Earth forms', category: 'geological' },
  { year: -4_400_000_000, label: 'First oceans', category: 'geological' },
  { year: -3_800_000_000, label: 'First life', category: 'biological' },
  { year: -2_700_000_000, label: 'Photosynthesis', category: 'biological' },
  { year: -541_000_000, label: 'Cambrian explosion', category: 'biological' },
  { year: -530_000_000, label: 'First fish', category: 'biological' },
  { year: -470_000_000, label: 'First land plants', category: 'biological' },
  { year: -230_000_000, label: 'Dinosaurs appear', category: 'biological' },
  { year: -66_000_000, label: 'K-Pg extinction', category: 'biological' },
  { year: -65_000_000, label: 'First primates', category: 'biological' },
  { year: -300_000, label: 'Homo sapiens', category: 'biological' },
  { year: -10_000, label: 'Agricultural revolution', category: 'historical' },
  { year: -3_200, label: 'First writing', category: 'historical' },
  { year: -3_100, label: 'Ancient Egypt', category: 'historical' },
  { year: -800, label: 'Classical Greece', category: 'historical' },
  { year: -44, label: 'Julius Caesar', category: 'historical' },
  { year: 476, label: 'Fall of Rome', category: 'historical' },
  { year: 1_492, label: 'Columbus', category: 'historical' },
  { year: 1_760, label: 'Industrial Revolution', category: 'historical' },
  { year: 1_789, label: 'French Revolution', category: 'historical' },
  { year: 1_914, label: 'World War I', category: 'modern' },
  { year: 1_939, label: 'World War II', category: 'modern' },
  { year: 1_969, label: 'Moon landing', category: 'modern' },
  { year: 1_991, label: 'Internet', category: 'modern' },
  { year: NOW_YEAR, label: 'Now', category: 'modern' },
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

const PAD = { top: 20, right: 10, bottom: 20, left: 105 }

type DrawScale = d3.ScaleLogarithmic<number, number> | d3.ScaleLinear<number, number>

export function D3Timeline({ futureCutoff = 2100, extraEvents, showAllTrigger, onAddEvent, onShowAll, onUpdateEvent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [editDraft, setEditDraft] = useState<{ label: string; year: string; description: string } | null>(null)
  const [logScale, setLogScale] = useState(true)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    // Reset zoom when scale type changes so the view starts fresh
    d3.select(svg).property('__zoom', d3.zoomIdentity)

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 1_000_000])

    function draw() {
      const W = container!.clientWidth
      const H = container!.clientHeight
      if (W === 0 || H === 0) return

      const innerH = H - PAD.top - PAD.bottom
      const innerW = W - PAD.left - PAD.right

      // Log mode: transform CE years → "years before future anchor" (strictly positive
      // domain, avoids BCE/CE zero-crossing distortion).
      // Linear mode: use CE years directly.
      const FUTURE_ANCHOR = futureCutoff + 50_000
      const toLogInput = (ceYear: number) => FUTURE_ANCHOR - ceYear
      const fromLogInput = (s: number) => FUTURE_ANCHOR - s

      const SCALE_PAD_PX = 30
      const yBase: DrawScale = logScale
        ? d3.scaleLog()
          .domain([toLogInput(futureCutoff), toLogInput(-13_800_000_000)])
          .range([SCALE_PAD_PX, innerH - SCALE_PAD_PX])
        : d3.scaleLinear()
          .domain([-13_800_000_000, futureCutoff])
          .range([innerH - SCALE_PAD_PX, SCALE_PAD_PX])

      const makePosYear = (scale: DrawScale) => logScale
        ? (ceYear: number) => (scale as d3.ScaleLogarithmic<number, number>)(toLogInput(ceYear))
        : (ceYear: number) => (scale as d3.ScaleLinear<number, number>)(ceYear)

      const tickFmt = logScale
        ? (d: d3.NumberValue) => formatYear(fromLogInput(+d))
        : (d: d3.NumberValue) => formatYear(+d)

      const s = d3.select(svg)
      s.attr('width', W).attr('height', H)
      s.selectAll('*').remove()

      s.append('defs').append('clipPath').attr('id', 'timeline-clip')
        .append('rect').attr('x', 0).attr('y', 0)
        .attr('width', innerW + PAD.right).attr('height', innerH)

      const g = s.append('g').attr('transform', `translate(${PAD.left},${PAD.top})`)
      const axisG = g.append('g')
      const eventsG = g.append('g').attr('clip-path', 'url(#timeline-clip)')

      function renderAxis(scale: DrawScale) {
        axisG.selectAll('*').remove()
        axisG.call(
          d3.axisLeft(scale as unknown as d3.AxisScale<number>).tickFormat(tickFmt)
        )
        axisG.select<SVGPathElement>('.domain').attr('stroke', '#333')
        axisG.selectAll<SVGTextElement, unknown>('text').attr('fill', '#666').attr('font-size', '10px')
        axisG.selectAll<SVGLineElement, unknown>('.tick line').attr('stroke', '#333')
      }

      function renderEvents(posYear: (ceYear: number) => number) {
        eventsG.selectAll('*').remove()

        const allEvents = [
          ...EVENTS.map(e => ({ ...e, extraIndex: -1 })),
          ...(extraEvents ?? []).map((e, i) => ({ ...e, extraIndex: i })),
        ]
        const withPx = allEvents.map(e => ({ ...e, py: posYear(e.year) }))
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
          const isBigBang = ev.year === -13_800_000_000
          const color = CATEGORY_COLOR[ev.category]

          if (isNow || isBigBang) {
            eventsG.append('line')
              .attr('x1', 0).attr('x2', innerW)
              .attr('y1', ev.py).attr('y2', ev.py)
              .attr('stroke', color).attr('stroke-width', 1)
              .attr('stroke-dasharray', '4 3').attr('opacity', 0.5)

            eventsG.append('text')
              .attr('x', innerW / 2).attr('y', ev.py - 5)
              .attr('text-anchor', 'middle')
              .attr('font-size', '10px').attr('font-weight', 'bold')
              .attr('fill', color).attr('pointer-events', 'none')
              .text(isNow ? 'NOW' : 'BIG BANG')

            if (isBigBang && logScale) {
              eventsG.append('text')
                .attr('x', innerW / 2).attr('y', ev.py + 14)
                .attr('text-anchor', 'middle')
                .attr('font-size', '9px').attr('fill', color).attr('opacity', 0.5)
                .attr('pointer-events', 'none')
                .text('Scale is logarithmic — the further back, the more compressed')
            }
          }

          eventsG.append('circle')
            .attr('cx', 0).attr('cy', ev.py)
            .attr('r', isNow ? 6 : 4)
            .attr('fill', color).attr('cursor', 'default')
            .on('mouseenter', (event: MouseEvent) => {
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              setTooltip({
                year: ev.year, label: ev.label, category: ev.category,
                x: event.clientX - rect.left, y: event.clientY - rect.top,
              })
            })
            .on('mouseleave', () => setTooltip(null))
            .on('click', (event: MouseEvent) => {
              event.stopPropagation()
              const rect = containerRef.current?.getBoundingClientRect()
              if (!rect) return
              const extraIdx = ev.extraIndex >= 0 ? ev.extraIndex : undefined
              setDetail({
                year: ev.year, label: ev.label, description: ev.description,
                category: ev.category,
                color: CATEGORY_COLOR[ev.category] ?? '#888',
                x: event.clientX - rect.left, y: event.clientY - rect.top,
                extraIndex: extraIdx,
              })
              if (extraIdx !== undefined) {
                setEditDraft({ label: ev.label, year: String(ev.year), description: ev.description ?? '' })
              } else {
                setEditDraft(null)
              }
            })

          if (showLabel.has(ev.year)) {
            eventsG.append('line')
              .attr('x1', 0).attr('x2', 8)
              .attr('y1', ev.py).attr('y2', ev.py)
              .attr('stroke', color).attr('stroke-width', 1)
              .attr('pointer-events', 'none')
            eventsG.append('text')
              .attr('x', 12).attr('y', ev.py)
              .attr('dominant-baseline', 'central')
              .attr('font-size', '10px').attr('fill', color)
              .attr('pointer-events', 'none')
              .text(ev.label)
          }
        })
      }

      zoom.on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const zy = event.transform.rescaleY(yBase as unknown as d3.ZoomScale) as unknown as DrawScale
        renderAxis(zy)
        renderEvents(makePosYear(zy))
      })

      d3.select(svg!)
        .call(zoom)
        .on('dblclick.zoom', () => {
          d3.select(svg!).transition().duration(300).call(zoom.transform, d3.zoomIdentity)
        })

      renderAxis(yBase)
      renderEvents(makePosYear(yBase))
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(container)
    return () => ro.disconnect()
  }, [futureCutoff, logScale, extraEvents, showAllTrigger])

  const containerW = containerRef.current?.offsetWidth ?? 0
  const tooltipStyle = tooltip ? {
    left: tooltip.x + 150 > containerW ? tooltip.x - 154 : tooltip.x + 12,
    top: tooltip.y - 10,
  } : undefined

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 h-8 border-b border-[#1a1a2e]">
        <span className="text-[10px] text-[#444] uppercase tracking-wide">Scale</span>
        <button
          onClick={() => setLogScale(v => !v)}
          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${logScale
            ? 'border-[#c9a227]/50 text-[#c9a227] bg-[#c9a227]/5'
            : 'border-[#333] text-[#555] hover:text-[#888]'
            }`}
        >
          {logScale ? 'Logarithmic' : 'Linear'}
        </button>
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="text-[10px] px-2 py-0.5 rounded border border-[#333] text-[#555] hover:text-[#888] transition-colors"
          >
            Show All
          </button>
        )}
        {onAddEvent && (
          <button
            onClick={onAddEvent}
            className="ml-auto text-[10px] px-2 py-0.5 rounded border border-[#9b59b6]/50 text-[#9b59b6] hover:bg-[#9b59b6]/10 transition-colors"
          >
            + Story Event
          </button>
        )}
      </div>
      <div ref={containerRef} className="relative flex-1 min-h-0 w-full overflow-hidden" onClick={() => { setDetail(null); setEditDraft(null) }}>
        <svg ref={svgRef} data-testid="d3-timeline" style={{ display: 'block' }} />
        {tooltip && !detail && (
          <div
            className="absolute z-20 pointer-events-none rounded border border-[#c9a227]/40 bg-[#0d0d14]/95 shadow-lg px-3 py-2"
            style={tooltipStyle}
          >
            <div className="text-[#c9a227] font-medium text-sm">{tooltip.label}</div>
            <div className="text-[#c8c8d8] text-xs mt-0.5">{formatYear(tooltip.year)}</div>
          </div>
        )}
        {detail && (() => {
          const W = containerRef.current?.offsetWidth ?? 0
          const H = containerRef.current?.offsetHeight ?? 0
          const cardW = Math.max(160, W / 2 - 16)
          const top = Math.min(detail.y, Math.max(0, H - 130))
          const isEditable = detail.extraIndex !== undefined
          const iBase = 'border border-[#1a1a2e] rounded px-2 py-1 text-xs text-[#c8c8d8] w-full focus:outline-none'
          const iClass = iBase
          const close = () => { setDetail(null); setEditDraft(null) }
          return (
            <div
              className="absolute z-30 rounded border bg-[#0d0d14]/98 shadow-xl px-3 py-2.5 max-h-[60%] overflow-y-auto"
              style={{ right: 8, top, width: cardW, borderColor: `${detail.color}55` }}
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-1.5 right-2 text-[#444] hover:text-[#888] text-xs leading-none" onClick={close}>✕</button>

              {isEditable && editDraft ? (
                <div className="flex flex-col gap-2 pr-4">
                  <input
                    className={iClass}
                    value={editDraft.label}
                    onChange={e => setEditDraft(d => d && ({ ...d, label: e.target.value }))}
                    placeholder="Event name"
                    style={{ color: detail.color, fontWeight: 500 }}
                  />
                  <input
                    className={iClass}
                    type="number"
                    value={editDraft.year}
                    onChange={e => setEditDraft(d => d && ({ ...d, year: e.target.value }))}
                    placeholder="Year (negative = BCE)"
                  />
                  <textarea
                    className={`${iBase} resize-none`}
                    rows={3}
                    value={editDraft.description}
                    onChange={e => setEditDraft(d => d && ({ ...d, description: e.target.value }))}
                    placeholder="Description…"
                  />
                  <div className="flex gap-2 justify-end pt-1">
                    <button className="text-[10px] px-2 py-0.5 rounded border border-[#333] text-[#555] hover:text-[#888]" onClick={close}>Cancel</button>
                    <button
                      className="text-[10px] px-2 py-0.5 rounded border text-[#c8c8d8] hover:bg-white/5 disabled:opacity-40"
                      style={{ borderColor: `${detail.color}80` }}
                      disabled={!editDraft.label.trim() || !editDraft.year.trim()}
                      onClick={() => {
                        const y = parseInt(editDraft.year, 10)
                        if (isNaN(y) || !editDraft.label.trim()) return
                        onUpdateEvent?.({
                          year: y, label: editDraft.label.trim(), category: detail.category,
                          ...(editDraft.description.trim() ? { description: editDraft.description.trim() } : {}),
                        }, detail.extraIndex!)
                        close()
                      }}
                    >Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium text-sm pr-4" style={{ color: detail.color }}>{detail.label}</div>
                  <div className="text-[#666] text-[10px] mt-0.5">{formatYear(detail.year)}</div>
                  {detail.description && (
                    <div className="text-[#c8c8d8] text-xs mt-2 leading-relaxed border-t border-[#1a1a2e] pt-2">{detail.description}</div>
                  )}
                </>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
