import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    mockNavigate.mockReset()
  })

  it('renders the SCREENWRITER wordmark', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('SCREENWRITER')).toBeInTheDocument()
  })

  it('renders the MY PROJECTS section label', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText(/my projects/i)).toBeInTheDocument()
  })

  it('renders project cards from mock data', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('The Last Signal')).toBeInTheDocument()
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

  it('adds project and navigates on create', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByPlaceholderText('Untitled Script'), 'New Film')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByText('New Film')).toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/project\//))
  })
})
