import { useState } from 'react'
import type { Project } from '../../types/project'
import type { Sketch } from '../../types/sketch'
import { useCappedDebounce } from '../../hooks/useCappedDebounce'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function SketchesPanel({ project, onUpdate }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addSketch() {
    const newSketch: Sketch = { id: crypto.randomUUID(), text: '' }
    onUpdate({ sketches: [...project.sketches, newSketch] })
    setExpandedIds(prev => new Set([...prev, newSketch.id]))
  }

  function updateSketch(id: string, text: string) {
    onUpdate({ sketches: project.sketches.map(s => s.id === id ? { ...s, text } : s) })
  }

  function deleteSketch(id: string) {
    onUpdate({ sketches: project.sketches.filter(s => s.id !== id) })
    setExpandedIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function sketchTitle(sketch: Sketch): string {
    const firstLine = sketch.text.split('\n')[0].trim()
    return firstLine.substring(0, 40) || 'Untitled sketch'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {project.sketches.map(sketch => (
          <SketchCard
            key={sketch.id}
            sketch={sketch}
            title={sketchTitle(sketch)}
            expanded={expandedIds.has(sketch.id)}
            onToggle={() => toggleExpanded(sketch.id)}
            onChange={(text) => updateSketch(sketch.id, text)}
            onDelete={() => deleteSketch(sketch.id)}
          />
        ))}
      </div>
      <button
        onClick={addSketch}
        className="m-3 py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors shrink-0"
      >
        + New Sketch
      </button>
    </div>
  )
}

function SketchCard({
  sketch,
  title,
  expanded,
  onToggle,
  onChange,
  onDelete,
}: {
  sketch: Sketch
  title: string
  expanded: boolean
  onToggle: () => void
  onChange: (text: string) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(sketch.text)
  const debouncedOnChange = useCappedDebounce(onChange)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    debouncedOnChange(val)
  }

  return (
    <div className="border border-[#1a1a2e] rounded overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={onToggle}
          className="flex-1 min-w-0 text-left px-3 py-2 text-sm text-[#888] hover:text-[#c8c8d8] hover:bg-panelHover transition-colors flex items-center justify-between"
        >
          <span className="truncate">{title}</span>
          <span className="text-xs text-[#555] ml-2 shrink-0">{expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={onDelete}
          className="px-2 py-2 text-[#555] hover:text-red-400 transition-colors shrink-0"
          title="Delete sketch"
        >
          ×
        </button>
      </div>
      {expanded && (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder="Write your sketch…"
          rows={8}
          className="w-full bg-[#0d0d14] text-[#c8c8d8] placeholder-[#444] resize-none outline-none text-sm leading-relaxed p-3 border-t border-[#1a1a2e]"
        />
      )}
    </div>
  )
}
