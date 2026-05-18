import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('renders the SCREENWRITER wordmark', () => {
    render(<TopBar onNewProject={() => {}} />)
    expect(screen.getByText('SCREENWRITER')).toBeInTheDocument()
  })

  it('renders the New Project button', () => {
    render(<TopBar onNewProject={() => {}} />)
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
  })

  it('calls onNewProject when button is clicked', async () => {
    const onNewProject = vi.fn()
    render(<TopBar onNewProject={onNewProject} />)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(onNewProject).toHaveBeenCalledOnce()
  })
})
