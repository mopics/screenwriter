import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./D3Timeline', () => ({
  D3Timeline: () => <svg data-testid="d3-timeline" />,
}))

import { TimelinePanel } from './TimelinePanel'

describe('TimelinePanel', () => {
  it('renders D3Timeline', () => {
    const { container } = render(<TimelinePanel />)
    expect(container.querySelector('[data-testid="d3-timeline"]')).not.toBeNull()
  })
})
