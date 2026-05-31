import { useState } from 'react'
import { D3Timeline } from './D3Timeline'
import type { TimelineEvent, TimeLineEventCategory } from './D3Timeline'
import type { Project } from '../../../types/project'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}

const FIELD_BASE = 'border border-[#1a1a2e] rounded px-2 py-1 text-xs text-[#c8c8d8] w-full focus:outline-none focus:border-[#9b59b6]/50'
const INPUT_CLASS = FIELD_BASE
const SELECT_CLASS = `bg-[#0a0a12] ${FIELD_BASE}`
const TEXTAREA_CLASS = FIELD_BASE
const LABEL_CLASS = 'text-[10px] text-[#555] uppercase tracking-wide'

export function TimelinePanel({ project, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [showAllTrigger, setShowAllTrigger] = useState(0)
  const [label, setLabel] = useState('')
  const [year, setYear] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TimeLineEventCategory>('fictional')

  const extraEvents = project.timelineEvents

  function handleAdd() {
    const y = parseInt(year, 10)
    if (!label.trim() || isNaN(y)) return
    const newEvent: TimelineEvent = {
      year: y,
      label: label.trim(),
      category,
      ...(description.trim() ? { description: description.trim() } : {}),
    }
    onUpdate({ timelineEvents: [...(extraEvents ?? []), newEvent] })
    setAdding(false)
    setLabel('')
    setYear('')
    setDescription('')
    setCategory('fictional')
  }

  function handleUpdateEvent(updated: TimelineEvent, index: number) {
    const events = [...(extraEvents ?? [])]
    events[index] = updated
    onUpdate({ timelineEvents: events })
  }

  function handleDeleteEvent(index: number) {
    const events = [...(extraEvents ?? [])]
    events.splice(index, 1)
    onUpdate({ timelineEvents: events })
  }

  function handleClose() {
    setAdding(false)
    setLabel('')
    setYear('')
    setDescription('')
    setCategory('fictional')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <D3Timeline
        futureCutoff={2100}
        extraEvents={extraEvents}
        showAllTrigger={showAllTrigger}
        onAddEvent={() => setAdding(true)}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onShowAll={() => setShowAllTrigger(v => v + 1)}
        onSaveZoom={(k, y) => onUpdate({ timelineZoom: { k, y } })}
        projectZoom={project.timelineZoom ?? null}
        initialZoom={project.timelineZoom ?? null}
      />

      {adding && (
        <>
          <div className="fixed inset-0 z-20 bg-black/50" onClick={handleClose} />
          <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-[#0d0d14] border border-[#1a1a2e] rounded-lg p-5 w-72 shadow-xl">
              <h3 className="text-sm text-[#c8c8d8] font-medium mb-4">Add Story Event</h3>

              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className={LABEL_CLASS}>Event name</span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Battle of Actium"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={LABEL_CLASS}>Year (negative = BCE)</span>
                  <input
                    type="number"
                    placeholder="e.g. -31 or 1944"
                    value={year}
                    onChange={e => setYear(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    className={INPUT_CLASS}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={LABEL_CLASS}>Description (optional)</span>
                  <textarea
                    rows={3}
                    placeholder="Context, notes, or story relevance…"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className={`${TEXTAREA_CLASS} resize-none`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className={LABEL_CLASS}>Category</span>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as TimeLineEventCategory)}
                    className={SELECT_CLASS}
                  >
                    <option value="fictional">Fictional</option>
                    <option value="historical">Historical</option>
                    <option value="modern">Modern</option>
                    <option value="cosmic">Cosmic</option>
                    <option value="geological">Geological</option>
                    <option value="biological">Biological</option>
                    <option value="birth">Birth</option>
                    <option value="death">Death</option>
                  </select>
                </label>
              </div>

              <div className="flex gap-2 mt-5 justify-end">
                <button
                  onClick={handleClose}
                  className="text-xs px-3 py-1.5 rounded border border-[#333] text-[#555] hover:text-[#888] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!label.trim() || !year.trim()}
                  className="text-xs px-3 py-1.5 rounded border border-[#9b59b6]/50 text-[#9b59b6] hover:bg-[#9b59b6]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
