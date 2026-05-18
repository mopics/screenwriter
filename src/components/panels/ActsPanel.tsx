import type { Project } from '../../types/project'
import type { Act } from '../../types/act'
import type { Scene } from '../../types/scene'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function ActsPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const sortedActs = [...project.acts].sort((a, b) => a.order - b.order)
  const selectedAct = project.acts.find(a => a.id === selectedId) ?? null

  function addAct() {
    const newAct: Act = {
      id: crypto.randomUUID(),
      title: `Act ${project.acts.length + 1}`,
      order: project.acts.length,
      sceneIds: [],
    }
    onUpdate({ acts: [...project.acts, newAct] })
    onSelectId(newAct.id)
  }

  function updateAct(updated: Act) {
    onUpdate({ acts: project.acts.map(a => a.id === updated.id ? updated : a) })
  }

  function moveScene(actId: string, sceneId: string, direction: 'up' | 'down') {
    const act = project.acts.find(a => a.id === actId)
    if (!act) return
    const idx = act.sceneIds.indexOf(sceneId)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === act.sceneIds.length - 1) return
    const newIds = [...act.sceneIds]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]]
    updateAct({ ...act, sceneIds: newIds })
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-52 border-r border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {sortedActs.map(act => (
            <div key={act.id}>
              <button
                onClick={() => onSelectId(act.id)}
                className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors ${
                  act.id === selectedId
                    ? 'border-l-[#c9a227] text-[#c8c8d8] bg-[#14141f]'
                    : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-[#0f0f1a]'
                }`}
              >
                {act.title}
              </button>
              {act.sceneIds.map(sid => {
                const scene = project.scenes.find(s => s.id === sid)
                return scene ? (
                  <div key={sid} className="pl-6 py-1 text-xs text-[#555]">
                    {scene.slugLine || '—'}
                  </div>
                ) : null
              })}
            </div>
          ))}
        </div>
        <button
          onClick={addAct}
          className="m-3 py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors"
        >
          + Add Act
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {selectedAct ? (
          <ActEditor
            act={selectedAct}
            scenes={project.scenes}
            onChange={updateAct}
            onMoveScene={(sceneId, dir) => moveScene(selectedAct.id, sceneId, dir)}
          />
        ) : (
          <p className="text-[#555] text-sm">Select an act to edit</p>
        )}
      </div>
    </div>
  )
}

type ActEditorProps = {
  act: Act
  scenes: Scene[]
  onChange: (a: Act) => void
  onMoveScene: (sceneId: string, dir: 'up' | 'down') => void
}

function ActEditor({ act, scenes, onChange, onMoveScene }: ActEditorProps) {
  return (
    <div>
      <div className="mb-6">
        <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">Title</label>
        <input
          value={act.title}
          onChange={e => onChange({ ...act, title: e.target.value })}
          className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50"
        />
      </div>
      <div>
        <p className="text-xs text-[#888] mb-2 uppercase tracking-wider">Scenes</p>
        {act.sceneIds.length === 0 && (
          <p className="text-xs text-[#444]">No scenes in this act</p>
        )}
        {act.sceneIds.map((sid, i) => {
          const scene = scenes.find(s => s.id === sid)
          return (
            <div key={sid} className="flex items-center gap-2 py-1">
              <span className="flex-1 text-sm text-[#c8c8d8]">{scene?.slugLine || '—'}</span>
              <button
                onClick={() => onMoveScene(sid, 'up')}
                disabled={i === 0}
                className="text-xs text-[#555] disabled:opacity-30 hover:text-[#888] transition-colors"
              >
                ▲
              </button>
              <button
                onClick={() => onMoveScene(sid, 'down')}
                disabled={i === act.sceneIds.length - 1}
                className="text-xs text-[#555] disabled:opacity-30 hover:text-[#888] transition-colors"
              >
                ▼
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
