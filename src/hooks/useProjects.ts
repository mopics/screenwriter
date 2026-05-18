import { useState } from 'react'
import type { Project } from '../types/project'
import { mockProjects } from '../data/mockProjects'

const STORAGE_KEY = 'sw_projects'

function loadProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return mockProjects
  try {
    return JSON.parse(raw) as Project[]
  } catch {
    return mockProjects
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadProjects)

  function addProject(project: Project) {
    setProjects(prev => {
      const next = [...prev, project]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function deleteProject(id: string) {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { projects, addProject, deleteProject, updateProject }
}
