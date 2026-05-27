import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SketchesPanel } from './SketchesPanel'
import type { Project } from '../../../types/project'

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
  settings: {
    activePanel: 'synopsis',
    fontSizes: {
      scenes: 'lg',
      synopsis: 'lg',
      characters: 'lg',
      acts: 'lg',
    },
  }
}

describe('SketchesPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('renders sketch title from the first line of text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.getByText('First line of sketch')).toBeDefined()
  })

  it('renders "Untitled sketch" for empty sketch text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.getByText('Untitled sketch')).toBeDefined()
  })

  it('clicking a card expands and shows its textarea', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.queryByPlaceholderText('Write your sketch…')).toBeNull()
    fireEvent.click(screen.getByText('First line of sketch'))
    const ta = screen.getByPlaceholderText('Write your sketch…') as HTMLTextAreaElement
    expect(ta.value).toBe('First line of sketch\nSecond line')
  })

  it('clicking an expanded card collapses it', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    fireEvent.click(screen.getByText('First line of sketch'))
    expect(screen.getByPlaceholderText('Write your sketch…')).toBeDefined()
    fireEvent.click(screen.getByText('First line of sketch'))
    expect(screen.queryByPlaceholderText('Write your sketch…')).toBeNull()
  })

  it('calls onUpdate when New Sketch is clicked', () => {
    const onUpdate = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={() => { }} />)
    fireEvent.click(screen.getByText('+ New Sketch'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.sketches).toHaveLength(3)
    expect(patch.sketches[2].text).toBe('')
  })

  it('debounces onUpdate by 300ms on text change', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={() => { }} />)
    fireEvent.click(screen.getByText('First line of sketch'))
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
