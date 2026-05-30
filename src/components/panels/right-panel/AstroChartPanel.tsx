import { useState } from 'react'
import { useAstroChart } from '../../../hooks/useAstroChart'
import { AstroWheel } from './AstroWheel'
import type { AstroChartParams } from '../../../types/astro'

const INPUT_CLASS = 'border border-[#1a1a2e] rounded px-2 py-1 text-xs text-[#c8c8d8] w-full'
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
