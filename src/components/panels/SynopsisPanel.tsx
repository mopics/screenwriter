import { useState } from 'react'
import type { Project } from '../../types/project'
import { useCappedDebounce } from '../../hooks/useCappedDebounce'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}

export function SynopsisPanel({ project, onUpdate }: Props) {
  const [value, setValue] = useState(project.synopsis ?? '')
  const debouncedSave = useCappedDebounce((v: string) => onUpdate({ synopsis: v }))

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    debouncedSave(val)
  }

  return (
    <div className="flex-1 p-6 flex flex-col scrollbar">
      <textarea
        spellCheck="false"
        value={value}
        onChange={handleChange}
        placeholder="Write your synopsis…"
        className="flex-1 w-full bg-transparent text-textInput placeholder-[#444] resize-none outline-none text-xl leading-relaxed"
      />
    </div>
  )
}
