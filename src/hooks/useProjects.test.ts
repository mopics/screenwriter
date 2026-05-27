import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'
import type { Project } from '../types/project'

const sampleProject: Project = {
  id: 'test-1',
  title: 'Test Script',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
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

function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  })
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts with loading=true then fetches projects on mount', async () => {
    vi.stubGlobal('fetch', mockFetch([sampleProject]))
    const { result } = renderHook(() => useProjects())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].title).toBe('Test Script')
    expect(fetch).toHaveBeenCalledWith('/api/projects')
  })

  it('sets error when initial fetch fails', async () => {
    vi.stubGlobal('fetch', mockFetch(null, false))
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load projects')
    expect(result.current.projects).toHaveLength(0)
  })

  it('addProject POSTs to API and appends to state', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleProject) }))
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.addProject(sampleProject) })
    expect(result.current.projects).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'POST' }))
  })

  it('deleteProject DELETEs from API and removes from state', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([sampleProject]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) }))
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.deleteProject('test-1') })
    expect(result.current.projects).toHaveLength(0)
    expect(fetch).toHaveBeenCalledWith('/api/projects/test-1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('updateProject PUTs merged project and updates state', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([sampleProject]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...sampleProject, synopsis: 'Great script' }) }))
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.updateProject('test-1', { synopsis: 'Great script' }) })
    expect(result.current.projects[0].synopsis).toBe('Great script')
    expect(result.current.projects[0].title).toBe('Test Script')
  })

  it('updateProject does nothing when id not found', async () => {
    vi.stubGlobal('fetch', mockFetch([sampleProject]))
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.updateProject('nonexistent', { synopsis: 'Nope' }) })
    expect(result.current.projects[0].synopsis).toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
