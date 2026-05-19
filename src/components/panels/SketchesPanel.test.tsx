import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SketchesPanel } from './SketchesPanel'
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
  sketches: [
    { id: 'sk1', text: 'First line of sketch\nSecond line' },
    { id: 'sk2', text: '' },
  ],
}

describe('SketchesPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('renders sketch title from the first line of text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('First line of sketch')).toBeDefined()
  })

  it('renders "Untitled sketch" for empty sketch text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Untitled sketch')).toBeDefined()
  })

  it('calls onSelectId when a sketch is clicked', () => {
    const onSelectId = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('First line of sketch'))
    expect(onSelectId).toHaveBeenCalledWith('sk1')
  })

  it('shows textarea with sketch text when sketch is selected', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId="sk1" onSelectId={() => {}} />)
    const ta = screen.getByPlaceholderText('Write your sketch…') as HTMLTextAreaElement
    expect(ta.value).toBe('First line of sketch\nSecond line')
  })

  it('shows placeholder when no sketch is selected', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select a sketch to edit')).toBeDefined()
  })

  it('calls onUpdate and onSelectId when New Sketch is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ New Sketch'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.sketches).toHaveLength(3)
    expect(patch.sketches[2].text).toBe('')
    expect(onSelectId).toHaveBeenCalledWith(patch.sketches[2].id)
  })

  it('debounces onUpdate by 300ms on text change', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId="sk1" onSelectId={() => {}} />)
    const ta = screen.getByPlaceholderText('Write your sketch…')
    fireEvent.change(ta, { target: { value: 'New text' } })
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onUpdate).toHaveBeenCalledWith({
      sketches: [
        { id: 'sk1', text: 'New text' },
        { id: 'sk2', text: '' },
      ],
    })
  })
})
