import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ActsPanel } from './ActsPanel'
import { defaultSettings, type Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [
    { id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1'] },
    { id: 'a2', title: 'Act 2', order: 1, sceneIds: [] },
  ],
  scenes: [{ id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] }],
  sketches: [],
  settings: defaultSettings,
}

describe('ActsPanel', () => {
  it('renders act titles in list', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.getByText('Act 1')).toBeDefined()
    expect(screen.getByText('Act 2')).toBeDefined()
  })

  it('renders scene sluglines beneath their act in list', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.getByText('INT. OFFICE - DAY')).toBeDefined()
  })

  it('calls onSelectId when an act is clicked', () => {
    const onSelectId = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('Act 1'))
    expect(onSelectId).toHaveBeenCalledWith('a1')
  })

  it('shows act title input when act is selected', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => { }} selectedId="a1" onSelectId={() => { }} />)
    expect(screen.getByDisplayValue('Act 1')).toBeDefined()
  })

  it('shows placeholder when no act is selected', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} />)
    expect(screen.getByText('Select an act to edit')).toBeDefined()
  })

  it('calls onUpdate with new act when Add Act is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ Add Act'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts).toHaveLength(3)
    expect(onSelectId).toHaveBeenCalledWith(patch.acts[2].id)
  })

  it('calls onUpdate with updated title when act title changes', () => {
    const onUpdate = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={onUpdate} selectedId="a1" onSelectId={() => { }} />)
    fireEvent.change(screen.getByDisplayValue('Act 1'), { target: { value: 'Act One' } })
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts.find((a: { id: string }) => a.id === 'a1').title).toBe('Act One')
  })

  it('moves scene up in sceneIds when up arrow clicked', () => {
    const twoSceneProject: Project = {
      ...baseProject,
      acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1', 's2'] }],
      scenes: [
        { id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] },
        { id: 's2', slugLine: 'EXT. STREET - NIGHT', actId: 'a1', order: 1, blocks: [] },
      ],
    }
    const onUpdate = vi.fn()
    render(<ActsPanel project={twoSceneProject} onUpdate={onUpdate} selectedId="a1" onSelectId={() => { }} />)
    const downButtons = screen.getAllByText('▼')
    fireEvent.click(downButtons[0])
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts[0].sceneIds).toEqual(['s2', 's1'])
  })
})
