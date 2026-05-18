import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SynopsisPanel } from './SynopsisPanel'
import type { Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
  synopsis: 'Initial synopsis text',
}

describe('SynopsisPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('renders existing synopsis text in the textarea', () => {
    render(<SynopsisPanel project={baseProject} onUpdate={() => {}} />)
    expect(screen.getByDisplayValue('Initial synopsis text')).toBeDefined()
  })

  it('shows placeholder when synopsis is empty', () => {
    const { synopsis: _, ...rest } = baseProject
    render(<SynopsisPanel project={rest as Project} onUpdate={() => {}} />)
    expect(screen.getByPlaceholderText('Write your synopsis…')).toBeDefined()
  })

  it('debounces onUpdate by 300ms', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SynopsisPanel project={baseProject} onUpdate={onUpdate} />)
    const ta = screen.getByDisplayValue('Initial synopsis text')
    fireEvent.change(ta, { target: { value: 'New synopsis' } })
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(299)
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onUpdate).toHaveBeenCalledWith({ synopsis: 'New synopsis' })
  })

  it('fires only once if changed multiple times within 300ms', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SynopsisPanel project={baseProject} onUpdate={onUpdate} />)
    const ta = screen.getByDisplayValue('Initial synopsis text')
    fireEvent.change(ta, { target: { value: 'A' } })
    fireEvent.change(ta, { target: { value: 'AB' } })
    fireEvent.change(ta, { target: { value: 'ABC' } })
    vi.advanceTimersByTime(300)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith({ synopsis: 'ABC' })
  })
})
