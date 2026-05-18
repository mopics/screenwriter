import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../types/project'

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

  it('links to /project/:id', () => {
    render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/project/abc')
  })
})
