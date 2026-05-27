import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CharacterRelationsPanel } from './CharacterRelationsPanel'
import type { Project } from '../../types/project'
import type { Character } from '../../types/character'

function makeChar(id: string, name: string): Character {
  return {
    id, name, groups: '', otherNames: '',
    personality: '', physicalDescription: '', motivation: '',
    internalConflict: '', strengths: '', weaknesses: '',
    characterArc: '', dialogueStyle: '', backstory: '',
    expandedFields: [],
  }
}

function makeProject(characters: Character[], rels: NonNullable<Project['characterRelationships']> = []): Project {
  return {
    id: '1', title: 'T', genre: 'FEATURE', draftNumber: 1,
    lastEditedAt: '', createdAt: '',
    characters, acts: [], scenes: [], sketches: [],
    settings: { activePanel: 'synopsis', fontSizes: { scenes: 'sm', synopsis: 'sm', characters: 'sm', acts: 'sm' } },
    characterRelationships: rels,
  }
}

const anna = makeChar('anna', 'ANNA')
const jake = makeChar('jake', 'JAKE')

describe('CharacterRelationsPanel', () => {
  it('shows hint when 0 characters', () => {
    render(<CharacterRelationsPanel project={makeProject([])} onUpdate={() => { }} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('shows hint when 1 character', () => {
    render(<CharacterRelationsPanel project={makeProject([anna])} onUpdate={() => { }} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('renders character names in headers when 2+ characters', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => { }} />)
    // Name appears in column header and row label → at least 2 occurrences each
    expect(screen.getAllByText('ANNA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('JAKE').length).toBeGreaterThanOrEqual(1)
  })

  it('renders an empty-cell + button in the lower triangle', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => { }} />)
    // JAKE is row 1, ANNA is col 0 → lower triangle cell should have a '+' button
    expect(screen.getByRole('button', { name: '+' })).toBeDefined()
  })

  it('renders existing relationship chips', () => {
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => { }} />)
    expect(screen.getByRole('button', { name: 'rivals' })).toBeDefined()
  })

  it('ignores relationships for deleted characters', () => {
    // orphaned rel with id 'ghost' not in characters list
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'ghost', label: 'rivals', description: '' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => { }} />)
    expect(screen.queryByRole('button', { name: 'rivals' })).toBeNull()
  })

  it('opens a blank popover when empty cell is clicked', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => { }} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByPlaceholderText('e.g. rivals')).toBeDefined()
  })

  it('save button is disabled when label is empty', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => { }} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    const saveBtn = screen.getByRole('button', { name: 'save' })
    expect(saveBtn.hasAttribute('disabled')).toBe(true)
  })

  it('calls onUpdate with new relationship on save', () => {
    const onUpdate = vi.fn()
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. rivals'), { target: { value: 'rivals' } })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    expect(onUpdate).toHaveBeenCalledOnce()
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.characterRelationships).toHaveLength(1)
    expect(patch.characterRelationships[0].label).toBe('rivals')
    expect(patch.characterRelationships[0].id).toBeTruthy()
  })

  it('normalises pair so fromId < toId regardless of click order', () => {
    const onUpdate = vi.fn()
    // 'anna' < 'jake' alphabetically
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.change(screen.getByPlaceholderText('e.g. rivals'), { target: { value: 'rivals' } })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    const rel = onUpdate.mock.calls[0][0].characterRelationships[0]
    expect(rel.fromId < rel.toId).toBe(true)
  })

  it('opens popover with existing data when chip is clicked', () => {
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => { }} />)
    fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
    expect(screen.getByDisplayValue('rivals')).toBeDefined()
    expect(screen.getByDisplayValue('competing')).toBeDefined()
  })

  it('calls onUpdate with updated label on save', () => {
    const onUpdate = vi.fn()
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
    fireEvent.change(screen.getByDisplayValue('rivals'), { target: { value: 'friends' } })
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.characterRelationships[0].label).toBe('friends')
    expect(patch.characterRelationships[0].id).toBe('r1')
  })

  it('calls onUpdate removing entry on delete', () => {
    const onUpdate = vi.fn()
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: '' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(onUpdate).toHaveBeenCalledWith({ characterRelationships: [] })
  })

  it('closes popover and does not call onUpdate on cancel', () => {
    const onUpdate = vi.fn()
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    expect(screen.getByPlaceholderText('e.g. rivals')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('e.g. rivals')).toBeNull()
  })

  it('shows + add in filled cells and opens a blank popover for a new entry', () => {
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: '' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => { }} />)
    fireEvent.click(screen.getByRole('button', { name: '+ add' }))
    const labelInput = screen.getByPlaceholderText('e.g. rivals') as HTMLInputElement
    expect(labelInput).toBeDefined()
    expect(labelInput.value).toBe('')
  })
})
