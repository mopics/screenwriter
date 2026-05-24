import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useProjects } from '../hooks/useProjects'
import { SidePanel } from '../components/SidePanel'
import { fontSizeMap, type SectionKey, type FontSize, type FontSizeSettings } from '../types/settings'
import { SynopsisPanel } from '../components/panels/SynopsisPanel'
import { CharactersPanel } from '../components/panels/CharactersPanel'
import { ActsPanel } from '../components/panels/ActsPanel'
import { ScenesPanel } from '../components/panels/ScenesPanel'
import { CharacterRelationsPanel } from '../components/panels/CharacterRelationsPanel'
import { RightPanel } from '../components/RightPanel'
import { printScene } from '../utils/printScene'
import type { Project } from '../types/project'

export function SceneEditor() {
  const { id } = useParams<{ id: string }>()
  const { projects, loading, updateProject } = useProjects()
  const [activeSection, setActiveSection] = useState<SectionKey>('synopsis')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fontSizes, setFontSizes] = useState<FontSizeSettings>({ scenes: 'sm', synopsis: 'sm', characters: 'sm', acts: 'sm' })

  useEffect(() => {
    const p = projects.find(p => p.id === id)
    if (p?.settings?.fontSizes?.scenes) setFontSizes(p.settings.fontSizes)
  }, [id, loading]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleFontSizeChange(s: FontSize) {
    // Set activeSections font size
    setFontSizes(prev => ({ ...prev, [activeSection]: s }))
    onUpdate({ settings: { ...project!.settings, fontSizes: { ...project!.settings.fontSizes, [activeSection]: s } } })
  }

  const selectedScene = project.scenes.find(s => s.id === selectedId)
  const panelProps = { project, onUpdate, selectedId, onSelectId: setSelectedId }

  return (
    <div className="h-screen overflow-hidden bg-panel flex flex-col">
      <header className="h-10 bg-panel border-b border-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="text-[#555] text-sm hover:text-[#888] transition-colors">←</Link>
        <span className="text-[#c9a227] text-xs font-bold tracking-widest">SCREENWRITER</span>
        <span className="text-[#555] text-sm">{project.title}</span>
        <div className="ml-auto flex items-center gap-4">
          {activeSection !== 'characterRelations' && (
            <select
              value={fontSizes[activeSection as keyof typeof fontSizes]}
              onChange={e => handleFontSizeChange(e.target.value as FontSize)}
              className="bg-transparent text-xs text-[#555] outline-none cursor-pointer hover:text-[#c9a227] transition-colors"
            >
              {(Object.keys(fontSizeMap) as FontSize[]).map(s => (
                <option key={s} value={s} className="bg-[#0a0a14]">{s}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => selectedScene && printScene(selectedScene)}
            disabled={!selectedScene}
            className="text-xs tracking-widest transition-colors disabled:opacity-30 disabled:cursor-default text-[#555] hover:enabled:text-[#c9a227]"
            title="Open print preview"
          >
            PRINT
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SidePanel activeSection={activeSection} onSectionChange={handleSectionChange} />
        {activeSection === 'synopsis' && <SynopsisPanel project={project} onUpdate={onUpdate} fontSize={fontSizes.synopsis} />}
        {activeSection === 'characters' && <CharactersPanel {...panelProps} fontSize={fontSizes.characters} />}
        {activeSection === 'acts' && <ActsPanel {...panelProps} />}
        {activeSection === 'scenes' && <ScenesPanel {...panelProps} fontSize={fontSizes.scenes} />}
        {activeSection === 'characterRelations' && (
          <CharacterRelationsPanel project={project} onUpdate={onUpdate} />
        )}
        <RightPanel {...panelProps} />
      </div>
    </div>
  )
}
