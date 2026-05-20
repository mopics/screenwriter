import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SceneEditor } from './SceneEditor'
import * as useProjectsModule from '../hooks/useProjects'
import type { Project } from '../types/project'

vi.mock('../hooks/useProjects')

const mockProject: Project = {
  id: '1',
  title: 'Test Film',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
  synopsis: 'A great film',
}

function renderWithRouter(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/project/${id}`]}>
      <Routes>
        <Route path="/project/:id" element={<SceneEditor />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SceneEditor', () => {
  beforeEach(() => {
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      loading: false,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
  })

  it('renders project title in the header', () => {
    renderWithRouter('1')
    expect(screen.getByText('Test Film')).toBeDefined()
  })

  it('renders SCREENWRITER branding in header', () => {
    renderWithRouter('1')
    expect(screen.getByText('SCREENWRITER')).toBeDefined()
  })

  it('shows "Project not found" for an unknown id', () => {
    renderWithRouter('999')
    expect(screen.getByText('Project not found')).toBeDefined()
  })

  it('shows back link on not-found page', () => {
    renderWithRouter('999')
    expect(screen.getByText('← Back to projects')).toBeDefined()
  })

  it('renders SynopsisPanel by default', () => {
    renderWithRouter('1')
    expect(screen.getByPlaceholderText('Write your synopsis…')).toBeDefined()
  })

  it('switches to CharactersPanel when Characters icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Characters'))
    expect(screen.getByText('Select a character to edit')).toBeDefined()
  })

  it('switches to ActsPanel when Acts icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Acts'))
    expect(screen.getByText('Select an act to edit')).toBeDefined()
  })

  it('switches to ScenesPanel when Scenes icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })

  it('renders SketchesPanel permanently on the right', () => {
    renderWithRouter('1')
    expect(screen.getByText('+ New Sketch')).toBeDefined()
  })

  it('resets selectedId to null when switching sections', () => {
    const projectWithChar: Project = {
      ...mockProject,
      characters: [{
        id: 'c1', name: 'Alice', pronouns: [], groups: [], otherNames: [],
        personality: '', physicalDescription: '', motivation: '',
        internalConflict: '', strengths: '', weaknesses: '',
        characterArc: '', dialogueStyle: '', backstory: '', relationships: [], expandedFields: [],
      }],
    }
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [projectWithChar],
      loading: false,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Characters'))
    fireEvent.click(screen.getByText('Alice'))
    expect(screen.getByDisplayValue('Alice')).toBeDefined()
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })
})
