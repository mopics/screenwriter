import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import { relativeTime } from '../utils/time'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/project/${project.id}`}
      className="block bg-[#0d0d14] border border-[#1a1a2e] rounded-lg p-5 cursor-pointer hover:border-[#c9a227]/40 hover:bg-[#14141f] transition-all no-underline"
    >
      <div className="text-[#c9a227] text-[10px] font-bold tracking-[0.15em] mb-3">
        {project.genre}
      </div>
      <div className="text-[#f0f0f0] font-bold text-base mb-2">{project.title}</div>
      <div className="text-[#888] text-xs">
        Draft {project.draftNumber} · {relativeTime(project.lastEditedAt)}
      </div>
    </Link>
  )
}
