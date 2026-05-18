import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjects } from './useProjects'
import type { Project } from '../types/project'

const STORAGE_KEY = 'sw_projects'

const sampleProject: Project = {
  id: 'test-1',
  title: 'Test Script',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
}

describe('useProjects', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with mockProjects when localStorage is empty', () => {
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects.length).toBeGreaterThan(0)
    expect(result.current.projects[0].title).toBe('The Last Signal')
  })

  it('initializes with stored projects when localStorage has data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].title).toBe('Test Script')
  })

  it('addProject adds to list and persists to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.addProject(sampleProject)
    })
    expect(result.current.projects).toHaveLength(1)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored[0].id).toBe('test-1')
  })

  it('deleteProject removes project and persists to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.deleteProject('test-1')
    })
    expect(result.current.projects).toHaveLength(0)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(0)
  })
})
