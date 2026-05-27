import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import * as useProjectsModule from '../hooks/useProjects'
import type { Project } from '../types/project'

vi.mock('../hooks/useProjects')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockProject: Project = {
  id: '1',
  title: 'Never Been Known To Fail',
  genre: 'FEATURE',
  draftNumber: 3,
  lastEditedAt: '2026-05-16T10:00:00Z',
  createdAt: '2026-03-01T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
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

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      loading: false,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
  })

  it('renders the SCREENWRITER wordmark', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('SCREENWRITER')).toBeInTheDocument()
  })

  it('renders the MY PROJECTS section label', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText(/my projects/i)).toBeInTheDocument()
  })

  it('renders project cards from hook data', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Never Been Known To Fail')).toBeInTheDocument()
  })

  it('shows loading state while loading', () => {
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [],
      loading: true,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('opens modal when New Project button is clicked', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByPlaceholderText('Untitled Script')).toBeInTheDocument()
  })

  it('closes modal when Cancel is clicked', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText('Untitled Script')).not.toBeInTheDocument()
  })

  it('calls addProject and navigates on create', async () => {
    const addProject = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      loading: false,
      error: null,
      addProject,
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByPlaceholderText('Untitled Script'), 'New Film')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(addProject).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/project\//))
  })
})
