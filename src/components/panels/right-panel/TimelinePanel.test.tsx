import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('./D3Timeline', () => ({
  D3Timeline: () => <svg data-testid="d3-timeline" />,
}))

import { TimelinePanel } from './TimelinePanel'

const mockProject = {
  id: '1', title: '', genre: 'FEATURE' as const, draftNumber: 1,
  lastEditedAt: '', createdAt: '', characters: [], acts: [], scenes: [],
  sketches: [], settings: { activePanel: 'synopsis' as const, fontSizes: { scenes: 'lg' as const, synopsis: 'lg' as const, characters: 'lg' as const, acts: 'lg' as const } },
}

describe('TimelinePanel', () => {
  it('renders D3Timeline', () => {
    const { container } = render(<TimelinePanel project={mockProject} onUpdate={() => {}} />)
    expect(container.querySelector('[data-testid="d3-timeline"]')).not.toBeNull()
  })
})
