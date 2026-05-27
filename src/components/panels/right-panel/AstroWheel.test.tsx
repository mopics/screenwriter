import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AstroWheel } from './AstroWheel'

const MOCK_BODIES = [
  { name: 'Sun',  longitude: 280.37, sign: 'Capricorn', signDegree: 10.37, retrograde: false },
  { name: 'Moon', longitude: 223.32, sign: 'Scorpio',   signDegree: 13.32, retrograde: true  },
]

describe('AstroWheel', () => {
  it('renders an SVG with data-testid="astro-wheel"', () => {
    const { container } = render(<AstroWheel bodies={MOCK_BODIES} />)
    expect(container.querySelector('svg[data-testid="astro-wheel"]')).not.toBeNull()
  })
})
