import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SidePanel } from './SidePanel'

describe('SidePanel', () => {
  it('renders buttons for all 4 sections with title attributes', () => {
    render(<SidePanel activeSection="synopsis" onSectionChange={() => {}} />)
    expect(screen.getByTitle('Synopsis')).toBeDefined()
    expect(screen.getByTitle('Characters')).toBeDefined()
    expect(screen.getByTitle('Acts')).toBeDefined()
    expect(screen.getByTitle('Scenes')).toBeDefined()
  })

  it('calls onSectionChange with the correct key when a button is clicked', () => {
    const onSectionChange = vi.fn()
    render(<SidePanel activeSection="synopsis" onSectionChange={onSectionChange} />)
    fireEvent.click(screen.getByTitle('Characters'))
    expect(onSectionChange).toHaveBeenCalledWith('characters')
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(onSectionChange).toHaveBeenCalledWith('scenes')
  })

  it('applies gold border to the active section button', () => {
    render(<SidePanel activeSection="acts" onSectionChange={() => {}} />)
    const actsBtn = screen.getByTitle('Acts')
    expect(actsBtn.className).toContain('border-l-[#c9a227]')
  })

  it('does not apply gold border to inactive section buttons', () => {
    render(<SidePanel activeSection="acts" onSectionChange={() => {}} />)
    const synopsisBtn = screen.getByTitle('Synopsis')
    expect(synopsisBtn.className).not.toContain('border-l-[#c9a227]')
  })
})
