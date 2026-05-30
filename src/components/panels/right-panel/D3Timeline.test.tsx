import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { D3Timeline, formatYear } from './D3Timeline'

describe('formatYear', () => {
  it('formats billions as "X.X billion years ago"', () => {
    expect(formatYear(-13_800_000_000)).toBe('13.8 billion years ago')
  })
  it('formats whole billions without trailing zero', () => {
    expect(formatYear(-13_000_000_000)).toBe('13 billion years ago')
  })
  it('formats millions as "X million BCE"', () => {
    expect(formatYear(-541_000_000)).toBe('541 million BCE')
  })
  it('formats sub-1000 BCE', () => {
    expect(formatYear(-44)).toBe('44 BCE')
  })
  it('formats year 0', () => {
    expect(formatYear(0)).toBe('1 BCE / 1 CE')
  })
  it('formats CE years', () => {
    expect(formatYear(476)).toBe('476 CE')
  })
})

describe('D3Timeline', () => {
  it('renders SVG with data-testid="d3-timeline"', () => {
    const { container } = render(<D3Timeline />)
    expect(container.querySelector('svg[data-testid="d3-timeline"]')).not.toBeNull()
  })
})
