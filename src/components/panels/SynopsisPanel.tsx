import { useState } from 'react'
import type { Project } from '../../types/project'
import { useCappedDebounce } from '../../hooks/useCappedDebounce'
import { fontSizeMap, type FontSize } from '../../types/settings'
import { AutoTextarea } from '../AutoTextarea'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  fontSize: FontSize
}

export function SynopsisPanel({ project, onUpdate, fontSize }: Props) {
  const [value, setValue] = useState(project.synopsis ?? '')
  const debouncedSave = useCappedDebounce((v: string) => onUpdate({ synopsis: v }))

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    debouncedSave(val)
  }

  return (
    <div className="flex-1 p-6 flex flex-col scrollbar">
      <AutoTextarea
        enableMarkdownToggle
        spellCheck="false"
        value={value}
        onChange={handleChange}
        placeholder="Write your synopsis…"
        style={{ fontSize: fontSizeMap[fontSize] }}
        className="w-full bg-transparent text-textInput placeholder-[#444] outline-none leading-relaxed"
      />
    </div>
  )
}
