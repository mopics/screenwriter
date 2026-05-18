import { useState, useRef } from 'react'
import type { Project } from '../../types/project'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}

export function SynopsisPanel({ project, onUpdate }: Props) {
  const [value, setValue] = useState(project.synopsis ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate({ synopsis: val }), 300)
  }

  return (
    <div className="flex-1 p-6 flex flex-col">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Write your synopsis…"
        className="flex-1 w-full bg-transparent text-[#c8c8d8] placeholder-[#444] resize-none outline-none text-sm leading-relaxed"
      />
    </div>
  )
}
