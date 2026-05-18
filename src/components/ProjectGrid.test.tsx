import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProjectGrid } from './ProjectGrid'
import type { Project } from '../types/project'

const projects: Project[] = [
  { id: '1', title: 'Script One', genre: 'FEATURE', draftNumber: 1, lastEditedAt: '2026-05-18T10:00:00Z', createdAt: '2026-05-01T10:00:00Z', characters: [], acts: [], scenes: [], sketches: [] },
  { id: '2', title: 'Script Two', genre: 'SHORT', draftNumber: 2, lastEditedAt: '2026-05-17T10:00:00Z', createdAt: '2026-05-01T10:00:00Z', characters: [], acts: [], scenes: [], sketches: [] },
]

describe('ProjectGrid', () => {
  it('renders all project cards', () => {
    render(<MemoryRouter><ProjectGrid projects={projects} onNewProject={() => {}} /></MemoryRouter>)
    expect(screen.getByText('Script One')).toBeInTheDocument()
    expect(screen.getByText('Script Two')).toBeInTheDocument()
  })

  it('renders the empty-state new script card', () => {
    render(<MemoryRouter><ProjectGrid projects={projects} onNewProject={() => {}} /></MemoryRouter>)
    expect(screen.getByText('+ New script')).toBeInTheDocument()
  })

  it('calls onNewProject when empty-state card is clicked', async () => {
    const onNewProject = vi.fn()
    render(<MemoryRouter><ProjectGrid projects={[]} onNewProject={onNewProject} /></MemoryRouter>)
    await userEvent.click(screen.getByText('+ New script'))
    expect(onNewProject).toHaveBeenCalledOnce()
  })
})
