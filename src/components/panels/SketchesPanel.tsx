import { useState, useRef } from 'react'
import type { Project } from '../../types/project'
import type { Sketch } from '../../types/sketch'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function SketchesPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const selectedSketch = project.sketches.find(s => s.id === selectedId) ?? null

  function addSketch() {
    const newSketch: Sketch = { id: crypto.randomUUID(), text: '' }
    onUpdate({ sketches: [...project.sketches, newSketch] })
    onSelectId(newSketch.id)
  }

  function updateSketch(id: string, text: string) {
    onUpdate({ sketches: project.sketches.map(s => s.id === id ? { ...s, text } : s) })
  }

  function sketchTitle(sketch: Sketch): string {
    const firstLine = sketch.text.split('\n')[0].trim()
    return firstLine.substring(0, 40) || 'Untitled sketch'
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-52 border-r border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {project.sketches.map(sketch => (
            <button
              key={sketch.id}
              onClick={() => onSelectId(sketch.id)}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors ${
                sketch.id === selectedId
                  ? 'border-l-[#c9a227] text-[#c8c8d8] bg-[#14141f]'
                  : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-[#0f0f1a]'
              }`}
            >
              {sketchTitle(sketch)}
            </button>
          ))}
        </div>
        <button
          onClick={addSketch}
          className="m-3 py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors"
        >
          + New Sketch
        </button>
      </div>
      <div className="flex-1 flex flex-col p-6">
        {selectedSketch ? (
          <SketchEditor
            key={selectedSketch.id}
            sketch={selectedSketch}
            onChange={(text) => updateSketch(selectedSketch.id, text)}
          />
        ) : (
          <p className="text-[#555] text-sm">Select a sketch to edit</p>
        )}
      </div>
    </div>
  )
}

function SketchEditor({
  sketch,
  onChange,
}: {
  sketch: Sketch
  onChange: (text: string) => void
}) {
  const [value, setValue] = useState(sketch.text)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(val), 300)
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder="Write your sketch…"
      className="flex-1 w-full bg-transparent text-[#c8c8d8] placeholder-[#444] resize-none outline-none text-sm leading-relaxed"
    />
  )
}
