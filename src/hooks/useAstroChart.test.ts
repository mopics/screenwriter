import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAstroChart } from './useAstroChart'

const MOCK_BODIES = [
  { name: 'Sun', longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
]
const PARAMS = { day: 1, month: 1, year: 2000, time: 12, lat: 51.5, lon: -0.12 }

beforeEach(() => { vi.restoreAllMocks() })

describe('useAstroChart', () => {
  it('starts with bodies null, loading false, error null', () => {
    const { result } = renderHook(() => useAstroChart())
    expect(result.current.bodies).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading true while fetching', async () => {
    let resolve: (v: Response) => void = () => {}
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(r => { resolve = r })
    )
    const { result } = renderHook(() => useAstroChart())
    act(() => { result.current.fetchChart(PARAMS) })
    expect(result.current.loading).toBe(true)
    await act(async () =>
      resolve(new Response(JSON.stringify({ bodies: [] }), { status: 200 }))
    )
  })

  it('sets bodies on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bodies: MOCK_BODIES }), { status: 200 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.bodies).toEqual(MOCK_BODIES)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets error from response body on non-ok response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'lat out of range' }), { status: 400 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.error).toBe('lat out of range')
    expect(result.current.bodies).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets "Server unreachable" on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed to fetch'))
    const { result } = renderHook(() => useAstroChart())
    await act(() => result.current.fetchChart(PARAMS))
    expect(result.current.error).toBe('Server unreachable')
  })

  it('builds the correct URL', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bodies: [] }), { status: 200 })
    )
    const { result } = renderHook(() => useAstroChart())
    await act(() =>
      result.current.fetchChart({ day: 17, month: 4, year: 1998, time: 12, lat: 52.725, lon: 5.744 })
    )
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3002/api/getAstroChart?day=17&month=4&year=1998&time=12&lat=52.725&lon=5.744'
    )
  })
})
