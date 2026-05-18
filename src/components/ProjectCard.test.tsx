import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../types/project'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

const project: Project = {
  id: 'abc',
  title: 'The Last Signal',
  genre: 'FEATURE',
  draftNumber: 3,
  lastEditedAt: '2026-05-16T10:00:00Z',
  createdAt: '2026-03-01T10:00:00Z',
}

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-18T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    mockNavigate.mockReset()
  })

  it('renders the project title', () => {
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)
    expect(screen.getByText('The Last Signal')).toBeInTheDocument()
  })

  it('renders the genre tag', () => {
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)
    expect(screen.getByText('FEATURE')).toBeInTheDocument()
  })

  it('renders draft number and relative time', () => {
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)
    expect(screen.getByText(/Draft 3/)).toBeInTheDocument()
    expect(screen.getByText(/2 days ago/)).toBeInTheDocument()
  })

  it('navigates to /project/:id on click', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)
    await user.click(screen.getByText('The Last Signal'))
    expect(mockNavigate).toHaveBeenCalledWith('/project/abc')
    vi.useFakeTimers()
  })
})
