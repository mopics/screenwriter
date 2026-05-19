import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { ProjectGrid } from '../components/ProjectGrid'
import { NewProjectModal } from '../components/NewProjectModal'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../types/project'

export function Dashboard() {
  const { projects, loading, addProject } = useProjects()
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  async function handleCreate(project: Project) {
    await addProject(project)
    setModalOpen(false)
    navigate(`/project/${project.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-[#555] text-sm tracking-widest">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <TopBar onNewProject={() => setModalOpen(true)} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-[#555] text-xs tracking-[0.2em] uppercase mb-4">My Projects</p>
        <ProjectGrid projects={projects} onNewProject={() => setModalOpen(true)} />
      </main>
      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
