import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenesPanel } from './ScenesPanel'
import { defaultSettings, type Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1'] }],
  scenes: [{ id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] }],
  sketches: [],
  settings: defaultSettings
}

describe('ScenesPanel', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders scene sluglines grouped under act labels', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} fontSize={'lg'} />)
    expect(screen.getByText('INT. OFFICE - DAY')).toBeDefined()
    expect(screen.getByText('Act 1')).toBeDefined()
  })

  it('calls onSelectId when a scene is clicked', () => {
    const onSelectId = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={onSelectId} fontSize={'lg'} />)
    fireEvent.click(screen.getByText('INT. OFFICE - DAY'))
    expect(onSelectId).toHaveBeenCalledWith('s1')
  })

  it('shows scene editor with slug line input when scene is selected', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => { }} selectedId="s1" onSelectId={() => { }} fontSize={'lg'} />)
    expect(screen.getByDisplayValue('INT. OFFICE - DAY')).toBeDefined()
  })

  it('shows placeholder when no scene is selected', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => { }} selectedId={null} onSelectId={() => { }} fontSize={'lg'} />)
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })

  it('adds action block when + Action is clicked', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => { }} fontSize={'lg'} />)
    fireEvent.click(screen.getByText('+ Action'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].blocks).toHaveLength(1)
    expect(patch.scenes[0].blocks[0].type).toBe('action')
  })

  it('adds dialogue block when + Dialogue is clicked', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => { }} fontSize={'lg'} />)
    fireEvent.click(screen.getByText('+ Dialogue'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].blocks).toHaveLength(1)
    expect(patch.scenes[0].blocks[0].type).toBe('dialogue')
  })

  it('updates slug line on input change', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => { }} fontSize={'lg'} />)
    const slugInput = screen.getByDisplayValue('INT. OFFICE - DAY')
    fireEvent.change(slugInput, { target: { value: 'EXT. PARK - DAWN' } })
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].slugLine).toBe('EXT. PARK - DAWN')
  })

  it('adds scene to existing act when only one act exists', () => {
    const emptyActProject: Project = {
      ...baseProject,
      acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: [] }],
      scenes: [],
    }
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<ScenesPanel project={emptyActProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} fontSize={'lg'} />)
    fireEvent.click(screen.getByText('+ Add Scene'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes).toHaveLength(1)
    expect(patch.acts[0].sceneIds).toHaveLength(1)
    expect(onSelectId).toHaveBeenCalledWith(patch.scenes[0].id)
  })
})
