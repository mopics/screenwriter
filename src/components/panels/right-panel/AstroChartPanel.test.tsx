import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock the hook so no real fetch happens
vi.mock('../../../hooks/useAstroChart')
// Mock AstroWheel so D3 doesn't run in jsdom
vi.mock('./AstroWheel', () => ({
  AstroWheel: () => <svg data-testid="astro-wheel" />,
}))

import { useAstroChart } from '../../../hooks/useAstroChart'
import { AstroChartPanel } from './AstroChartPanel'

const mockUseAstroChart = vi.mocked(useAstroChart)

function setup(overrides: Partial<ReturnType<typeof useAstroChart>> = {}) {
  mockUseAstroChart.mockReturnValue({
    bodies: null,
    loading: false,
    error: null,
    fetchChart: vi.fn(),
    ...overrides,
  })
}

describe('AstroChartPanel', () => {
  it('renders all 6 input labels', () => {
    setup()
    render(<AstroChartPanel />)
    expect(screen.getByText('Day')).toBeDefined()
    expect(screen.getByText('Month')).toBeDefined()
    expect(screen.getByText('Year')).toBeDefined()
    expect(screen.getByText(/Time/i)).toBeDefined()
    expect(screen.getByText('Lat')).toBeDefined()
    expect(screen.getByText('Lon')).toBeDefined()
  })

  it('renders Draw Chart button', () => {
    setup()
    render(<AstroChartPanel />)
    expect(screen.getByRole('button', { name: /Draw Chart/i })).toBeDefined()
  })

  it('calls fetchChart on form submit', () => {
    const fetchChart = vi.fn()
    setup({ fetchChart })
    render(<AstroChartPanel />)
    const form = screen.getByRole('button', { name: /Draw Chart/i }).closest('form')!
    fireEvent.submit(form)
    expect(fetchChart).toHaveBeenCalledOnce()
  })

  it('shows "Loading…" button text when loading', () => {
    setup({ loading: true })
    render(<AstroChartPanel />)
    expect(screen.getByRole('button', { name: /Loading/i })).toBeDefined()
  })

  it('disables button when loading', () => {
    setup({ loading: true })
    render(<AstroChartPanel />)
    expect((screen.getByRole('button', { name: /Loading/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows error message when error is set', () => {
    setup({ error: 'Server unreachable' })
    render(<AstroChartPanel />)
    expect(screen.getByText('Server unreachable')).toBeDefined()
  })

  it('renders AstroWheel when bodies is non-null', () => {
    setup({
      bodies: [
        { name: 'Sun', longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
      ],
    })
    const { container } = render(<AstroChartPanel />)
    expect(container.querySelector('[data-testid="astro-wheel"]')).not.toBeNull()
  })

  it('shows placeholder SVG ring when bodies is null', () => {
    setup({ bodies: null })
    const { container } = render(<AstroChartPanel />)
    // No astro-wheel, but there is a placeholder circle
    expect(container.querySelector('[data-testid="astro-wheel"]')).toBeNull()
    expect(container.querySelector('circle')).not.toBeNull()
  })
})
