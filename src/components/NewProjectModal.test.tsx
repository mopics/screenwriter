import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewProjectModal } from './NewProjectModal'

describe('NewProjectModal', () => {
  it('renders title input and genre buttons', () => {
    render(<NewProjectModal onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByPlaceholderText('Untitled Script')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'FEATURE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SHORT' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'TV PILOT' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'MINI-SERIES' })).toBeInTheDocument()
  })

  it('Create button is disabled when title is empty', () => {
    render(<NewProjectModal onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('Create button is enabled when title is non-empty', async () => {
    render(<NewProjectModal onClose={() => {}} onCreate={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText('Untitled Script'), 'My Script')
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled()
  })

  it('calls onCreate with correct project data on submit', async () => {
    const onCreate = vi.fn()
    render(<NewProjectModal onClose={() => {}} onCreate={onCreate} />)
    await userEvent.type(screen.getByPlaceholderText('Untitled Script'), 'My Script')
    await userEvent.click(screen.getByRole('button', { name: 'SHORT' }))
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(onCreate).toHaveBeenCalledOnce()
    const arg = onCreate.mock.calls[0][0]
    expect(arg.title).toBe('My Script')
    expect(arg.genre).toBe('SHORT')
    expect(arg.draftNumber).toBe(1)
    expect(typeof arg.id).toBe('string')
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<NewProjectModal onClose={onClose} onCreate={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(<NewProjectModal onClose={onClose} onCreate={() => {}} />)
    await userEvent.click(screen.getByPlaceholderText('Untitled Script'))
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(<NewProjectModal onClose={onClose} onCreate={() => {}} />)
    await userEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
