import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { SidePanel } from '../components/SidePanel'
import type { SectionKey } from '../components/SidePanel'
import { SynopsisPanel } from '../components/panels/SynopsisPanel'
import { CharactersPanel } from '../components/panels/CharactersPanel'
import { ActsPanel } from '../components/panels/ActsPanel'
import { ScenesPanel } from '../components/panels/ScenesPanel'
import { SketchesPanel } from '../components/panels/SketchesPanel'
import type { Project } from '../types/project'

export function SceneEditor() {
  const { id } = useParams<{ id: string }>()
  const { projects, loading, updateProject } = useProjects()
  const [activeSection, setActiveSection] = useState<SectionKey>('synopsis')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-[#555] text-sm tracking-widest">Loading…</p>
      </div>
    )
  }

  const project = projects.find(p => p.id === id)

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#888] mb-4">Project not found</p>
          <Link to="/" className="text-[#c9a227] text-sm hover:underline">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  function onUpdate(patch: Partial<Project>) {
    updateProject(id!, patch)
  }

  function handleSectionChange(s: SectionKey) {
    setActiveSection(s)
    setSelectedId(null)
  }

  const panelProps = { project, onUpdate, selectedId, onSelectId: setSelectedId }

  return (
    <div className="h-screen overflow-hidden bg-panel flex flex-col">
      <header className="h-10 bg-panel border-b border-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="text-[#555] text-sm hover:text-[#888] transition-colors">←</Link>
        <span className="text-[#c9a227] text-xs font-bold tracking-widest">SCREENWRITER</span>
        <span className="text-[#555] text-sm">{project.title}</span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SidePanel activeSection={activeSection} onSectionChange={handleSectionChange} />
        {activeSection === 'synopsis' && <SynopsisPanel project={project} onUpdate={onUpdate} />}
        {activeSection === 'characters' && <CharactersPanel {...panelProps} />}
        {activeSection === 'acts' && <ActsPanel {...panelProps} />}
        {activeSection === 'scenes' && <ScenesPanel {...panelProps} />}
        <SketchesPanel {...panelProps} />
      </div>
    </div>
  )
}
