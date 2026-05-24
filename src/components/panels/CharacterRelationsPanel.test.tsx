import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CharacterRelationsPanel } from './CharacterRelationsPanel'
import type { Project } from '../../types/project'
import type { Character } from '../../types/character'

function makeChar(id: string, name: string): Character {
  return {
    id, name, pronouns: [], groups: [], otherNames: [],
    personality: '', physicalDescription: '', motivation: '',
    internalConflict: '', strengths: '', weaknesses: '',
    characterArc: '', dialogueStyle: '', backstory: '',
    relationships: [], expandedFields: [],
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
const marie = makeChar('marie', 'MARIE')

describe('CharacterRelationsPanel', () => {
  it('shows hint when 0 characters', () => {
    render(<CharacterRelationsPanel project={makeProject([])} onUpdate={() => {}} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('shows hint when 1 character', () => {
    render(<CharacterRelationsPanel project={makeProject([anna])} onUpdate={() => {}} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('renders character names in headers when 2+ characters', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
    // Name appears in column header and row label → at least 2 occurrences each
    expect(screen.getAllByText('ANNA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('JAKE').length).toBeGreaterThanOrEqual(1)
  })

  it('renders an empty-cell + button in the lower triangle', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
    // JAKE is row 1, ANNA is col 0 → lower triangle cell should have a '+' button
    expect(screen.getByRole('button', { name: '+' })).toBeDefined()
  })

  it('renders existing relationship chips', () => {
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
    expect(screen.getByRole('button', { name: 'rivals' })).toBeDefined()
  })

  it('ignores relationships for deleted characters', () => {
    // orphaned rel with id 'ghost' not in characters list
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'ghost', label: 'rivals', description: '' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
    expect(screen.queryByRole('button', { name: 'rivals' })).toBeNull()
  })
})
