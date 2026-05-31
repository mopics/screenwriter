import { useState, useCallback } from 'react'
import type { ChartBody, AstroChartParams } from '../types/astro'

type State = {
  bodies: ChartBody[] | null
  loading: boolean
  error: string | null
}

export function useAstroChart() {
  const [state, setState] = useState<State>({ bodies: null, loading: false, error: null })

  const fetchChart = useCallback(async function fetchChart(params: AstroChartParams) {
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
  }, [setState])

  return { ...state, fetchChart }
}
