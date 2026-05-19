import { useState, useEffect } from 'react'
import type { Project } from '../types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load projects')
        return r.json() as Promise<Project[]>
      })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError((err as Error).message)
        setLoading(false)
      })
  }, [])

  async function addProject(project: Project) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    if (!res.ok) return
    setProjects(prev => [...prev, project])
  }

  async function deleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const project = projects.find(p => p.id === id)
    if (!project) return
    const updated = { ...project, ...patch }
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) return
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
  }

  return { projects, loading, error, addProject, deleteProject, updateProject }
}
