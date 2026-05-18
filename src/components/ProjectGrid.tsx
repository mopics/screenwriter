import type { Project } from '../types/project'
import { ProjectCard } from './ProjectCard'

type ProjectGridProps = {
  projects: Project[]
  onNewProject: () => void
}

export function ProjectGrid({ projects, onNewProject }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} />
      ))}
      <div
        onClick={onNewProject}
        className="border border-dashed border-[#2a2a3a] rounded-lg p-5 flex items-center justify-center cursor-pointer hover:border-[#c9a227]/40 transition-colors min-h-[100px]"
      >
        <span className="text-[#444] text-sm">+ New script</span>
      </div>
    </div>
  )
}
