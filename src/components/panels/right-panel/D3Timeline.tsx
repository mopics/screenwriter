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
  if (year <= -1_000) return `${(-year).toLocaleString()} BCE`
  if (year < 0) return `${-year} BCE`
  if (year === 0) return '1 BCE / 1 CE'
  return `${year} CE`
}

const PAD = { top: 20, right: 10, bottom: 20, left: 55 }

export function D3Timeline({ futureCutoff = 2100 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // D3 rendering in Task 2
  useEffect(() => {}, [futureCutoff])

  return (
    <div ref={containerRef} className="flex-1 relative min-h-0 w-full overflow-hidden">
      <svg ref={svgRef} data-testid="d3-timeline" style={{ display: 'block' }} />
      {tooltip && (
        <div className="absolute z-20 pointer-events-none rounded border border-[#c9a227]/40 bg-[#0d0d14]/95 shadow-lg px-3 py-2"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          <div className="text-[#c9a227] font-medium text-sm">{tooltip.label}</div>
          <div className="text-[#c8c8d8] text-xs mt-0.5">{formatYear(tooltip.year)}</div>
        </div>
      )}
    </div>
  )
}
