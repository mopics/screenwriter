import type { Project } from '../../types/project'
import type { Scene, SceneBlock } from '../../types/scene'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function ScenesPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const sortedActs = [...project.acts].sort((a, b) => a.order - b.order)
  const selectedScene = project.scenes.find(s => s.id === selectedId) ?? null

  function addScene() {
    if (project.acts.length === 0) {
      const newAct = { id: crypto.randomUUID(), title: 'Act 1', order: 0, sceneIds: [] as string[] }
      const newScene: Scene = { id: crypto.randomUUID(), slugLine: '', actId: newAct.id, order: 0, blocks: [] }
      onUpdate({
        acts: [{ ...newAct, sceneIds: [newScene.id] }],
        scenes: [newScene],
      })
      onSelectId(newScene.id)
      return
    }
    let actId: string
    if (project.acts.length === 1) {
      actId = project.acts[0].id
    } else {
      const label = project.acts.map((a, i) => `${i + 1}. ${a.title}`).join('\n')
      const chosen = window.prompt(`Pick act:\n${label}\nEnter number:`)
      const idx = parseInt(chosen ?? '', 10) - 1
      if (isNaN(idx) || idx < 0 || idx >= project.acts.length) return
      actId = project.acts[idx].id
    }
    const newScene: Scene = {
      id: crypto.randomUUID(),
      slugLine: '',
      actId,
      order: project.scenes.filter(s => s.actId === actId).length,
      blocks: [],
    }
    onUpdate({
      acts: project.acts.map(a =>
        a.id === actId ? { ...a, sceneIds: [...a.sceneIds, newScene.id] } : a
      ),
      scenes: [...project.scenes, newScene],
    })
    onSelectId(newScene.id)
  }

  function updateScene(updated: Scene) {
    onUpdate({ scenes: project.scenes.map(s => s.id === updated.id ? updated : s) })
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-52 border-r border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {sortedActs.map(act => {
            const actScenes = act.sceneIds
              .map(sid => project.scenes.find(s => s.id === sid))
              .filter((s): s is Scene => s !== undefined)
            return (
              <div key={act.id}>
                <div className="px-4 py-1 text-xs text-[#555] uppercase tracking-wider bg-[#080810]">
                  {act.title}
                </div>
                {actScenes.map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => onSelectId(scene.id)}
                    className={`w-full text-left px-4 py-2 text-xs border-l-2 transition-colors ${
                      scene.id === selectedId
                        ? 'border-l-[#c9a227] text-[#c8c8d8] bg-[#14141f]'
                        : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-[#0f0f1a]'
                    }`}
                  >
                    {scene.slugLine || 'Untitled scene'}
                  </button>
                ))}
              </div>
            )
          })}
          {project.acts.length === 0 && (
            <p className="px-4 py-2 text-xs text-[#444]">No acts yet</p>
          )}
        </div>
        <button
          onClick={addScene}
          className="m-3 py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors"
        >
          + Add Scene
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {selectedScene ? (
          <SceneBlockEditor scene={selectedScene} onChange={updateScene} />
        ) : (
          <p className="text-[#555] text-sm">Select a scene to edit</p>
        )}
      </div>
    </div>
  )
}

function SceneBlockEditor({ scene, onChange }: { scene: Scene; onChange: (s: Scene) => void }) {
  function updateBlocks(blocks: SceneBlock[]) {
    onChange({ ...scene, blocks })
  }

  function addBlock(type: 'action' | 'dialogue') {
    const block: SceneBlock =
      type === 'action'
        ? { type: 'action', text: '' }
        : { type: 'dialogue', data: { character: '', line: '' } }
    updateBlocks([...scene.blocks, block])
  }

  function updateBlock(idx: number, block: SceneBlock) {
    updateBlocks(scene.blocks.map((b, i) => i === idx ? block : b))
  }

  function deleteBlock(idx: number) {
    updateBlocks(scene.blocks.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <input
        value={scene.slugLine}
        onChange={e => onChange({ ...scene, slugLine: e.target.value })}
        placeholder="INT. LOCATION - DAY"
        className="w-full bg-transparent border-b border-[#1a1a2e] pb-2 mb-6 text-sm text-[#c9a227] uppercase tracking-wider outline-none placeholder-[#333]"
      />
      <div className="space-y-4">
        {scene.blocks.map((block, idx) => (
          <div key={idx} className="group relative">
            {block.type === 'action' ? (
              <textarea
                value={block.text}
                onChange={e => updateBlock(idx, { type: 'action', text: e.target.value })}
                rows={3}
                className="w-full bg-[#0a0a14] border border-[#1a1a2e] rounded p-3 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/30 resize-y"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <input
                  value={block.data.character}
                  onChange={e =>
                    updateBlock(idx, {
                      type: 'dialogue',
                      data: { ...block.data, character: e.target.value.toUpperCase() },
                    })
                  }
                  placeholder="CHARACTER"
                  className="w-2/5 bg-transparent text-center text-sm font-semibold text-[#c8c8d8] uppercase outline-none border-b border-[#1a1a2e] placeholder-[#333]"
                />
                <input
                  value={block.data.parenthetical ?? ''}
                  onChange={e =>
                    updateBlock(idx, {
                      type: 'dialogue',
                      data: { ...block.data, parenthetical: e.target.value },
                    })
                  }
                  placeholder="(parenthetical)"
                  className="w-2/5 bg-transparent text-center text-xs italic text-[#888] outline-none placeholder-[#333]"
                />
                <textarea
                  value={block.data.line}
                  onChange={e =>
                    updateBlock(idx, {
                      type: 'dialogue',
                      data: { ...block.data, line: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-3/5 bg-transparent text-center text-sm text-[#c8c8d8] outline-none resize-y"
                />
              </div>
            )}
            <button
              onClick={() => deleteBlock(idx)}
              className="absolute top-1 right-1 text-xs text-[#555] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => addBlock('action')}
          className="px-4 py-2 text-xs text-[#888] border border-[#1a1a2e] rounded hover:text-[#c8c8d8] hover:border-[#333] transition-colors"
        >
          + Action
        </button>
        <button
          onClick={() => addBlock('dialogue')}
          className="px-4 py-2 text-xs text-[#888] border border-[#1a1a2e] rounded hover:text-[#c8c8d8] hover:border-[#333] transition-colors"
        >
          + Dialogue
        </button>
      </div>
    </div>
  )
}
