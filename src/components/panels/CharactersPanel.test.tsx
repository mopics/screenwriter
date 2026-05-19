import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CharactersPanel } from './CharactersPanel'
import type { Project } from '../../types/project'
import type { Character } from '../../types/character'

const alice: Character = {
  id: 'c1',
  name: 'Alice',
  pronouns: ['She/Her'],
  groups: [],
  otherNames: [],
  personality: 'Driven',
  physicalDescription: 'Tall',
  motivation: 'Freedom',
  internalConflict: 'Trust vs control',
  strengths: 'Resourceful',
  weaknesses: 'Impulsive',
  characterArc: 'Learns to trust',
  dialogueStyle: 'Direct',
  backstory: 'Grew up alone',
  relationships: [],
  expandedFields: [],
}

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [alice],
  acts: [],
  scenes: [],
  sketches: [],
}

describe('CharactersPanel', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders character names in the list', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Alice')).toBeDefined()
  })

  it('calls onSelectId with the character id when clicked', () => {
    const onSelectId = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onSelectId).toHaveBeenCalledWith('c1')
  })

  it('shows editor form fields when a character is selected', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('Alice')).toBeDefined()
    expect(screen.getByText('Driven')).toBeDefined()
  })

  it('shows placeholder prompt when no character is selected', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select a character to edit')).toBeDefined()
  })

  it('calls onUpdate and onSelectId when Add Character is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ Add Character'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.characters).toHaveLength(2)
    expect(patch.characters[1].name).toBe('')
    expect(onSelectId).toHaveBeenCalledWith(patch.characters[1].id)
  })

  it('calls onUpdate with filtered characters after delete confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('Delete character'))
    expect(onUpdate).toHaveBeenCalledWith({ characters: [] })
  })

  it('does not delete character when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('Delete character'))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('calls onUpdate with updated character when name input changes', () => {
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    const nameInput = screen.getByDisplayValue('Alice')
    fireEvent.change(nameInput, { target: { value: 'Alicia' } })
    expect(onUpdate).toHaveBeenCalledWith({
      characters: [{ ...alice, name: 'Alicia' }],
    })
  })

  it('does not render textarea for collapsed fields', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.queryByDisplayValue('Driven')).toBeNull()
  })

  it('shows preview text for a collapsed textarea field with content', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.getByText('Driven')).toBeDefined()
  })

  it('expands a textarea field when its label is clicked', () => {
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /personality/i }))
    expect(onUpdate).toHaveBeenCalledWith({
      characters: [{ ...alice, expandedFields: ['personality'] }],
    })
  })

  it('collapses an expanded textarea field when its label is clicked', () => {
    const onUpdate = vi.fn()
    const aliceExpanded = { ...alice, expandedFields: ['personality'] }
    const project = { ...baseProject, characters: [aliceExpanded] }
    render(<CharactersPanel project={project} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('Driven')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /personality/i }))
    expect(onUpdate).toHaveBeenCalledWith({
      characters: [{ ...aliceExpanded, expandedFields: [] }],
    })
  })

  it('shows "— empty —" for a collapsed textarea field with no content', () => {
    const aliceEmptyPersonality = { ...alice, personality: '' }
    render(<CharactersPanel project={{ ...baseProject, characters: [aliceEmptyPersonality] }} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.getAllByText('— empty —').length).toBeGreaterThan(0)
  })
})
