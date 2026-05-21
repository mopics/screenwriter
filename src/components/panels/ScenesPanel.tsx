import { useEffect, useRef, useState } from 'react'
import type { Project } from '../../types/project'
import type { Scene, SceneBlock } from '../../types/scene'
import { useResize } from '../../hooks/useResize'
import { useCappedDebounce } from '../../hooks/useCappedDebounce'
import { printScene } from '../../utils/printScene'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function ScenesPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const { width, dragHandleProps } = useResize(208)
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
      <div className="relative shrink-0 border-r border-[#1a1a2e] flex flex-col overflow-hidden" style={{ width }}>
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
                    className={`w-full text-left px-4 py-2 text-xs border-l-2 transition-colors ${scene.id === selectedId
                      ? 'border-l-[#c9a227] text-[#c8c8c8] bg-panelSelect'
                      : 'border-l-transparent text-[#888] hover:text-[#c8c8c8] hover:bg-panelHover'
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
        <div {...dragHandleProps} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 scrollbar">
        {selectedScene ? (
          <SceneBlockEditor key={selectedScene.id} scene={selectedScene} onChange={updateScene} />
        ) : (
          <p className="text-[#555] text-sm">Select a scene to edit</p>
        )}
      </div>
    </div>
  )
}

const fontSizeMap = { sm: '12px', lg: '16px', xl: '20px', '2xl': '24px' } as const
type FontSize = keyof typeof fontSizeMap

function AutoTextarea({ value, style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const prevWidth = useRef<number>(0)

  function resize() {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = ref.current.scrollHeight + 'px'
  }

  useEffect(() => { resize() }, [value, style?.fontSize]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width !== prevWidth.current) {
        prevWidth.current = width
        resize()
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <textarea ref={ref} value={value} style={{ ...style, overflow: 'hidden' }} rows={1} {...props} />
}

function SceneBlockEditor({ scene, onChange }: { scene: Scene; onChange: (s: Scene) => void }) {
  const [local, setLocal] = useState(scene)
  const [fontSize, setFontSize] = useState<FontSize>('sm')
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const debouncedOnChange = useCappedDebounce(onChange)
  const fs = fontSizeMap[fontSize]

  function persist(updated: Scene) {
    setLocal(updated)
    debouncedOnChange(updated)
  }

  function updateBlocks(blocks: SceneBlock[]) {
    persist({ ...local, blocks })
  }

  function addBlock(type: 'action' | 'dialogue') {
    const block: SceneBlock =
      type === 'action'
        ? { type: 'action', text: '' }
        : { type: 'dialogue', data: { character: '', line: '' } }
    updateBlocks([...local.blocks, block])
  }

  function updateBlock(idx: number, block: SceneBlock) {
    updateBlocks(local.blocks.map((b, i) => i === idx ? block : b))
  }

  function deleteBlock(idx: number) {
    setCollapsed(prev => { const s = new Set(prev); s.delete(idx); return s })
    updateBlocks(local.blocks.filter((_, i) => i !== idx))
  }

  function toggleCollapse(idx: number) {
    setCollapsed(prev => {
      const s = new Set(prev)
      s.has(idx) ? s.delete(idx) : s.add(idx)
      return s
    })
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 border-b border-[#1a1a2e] pb-2">
        <input
          value={local.slugLine}
          onChange={e => persist({ ...local, slugLine: e.target.value })}
          placeholder="INT. LOCATION - DAY"
          spellCheck={false}
          style={{ fontSize: fs }}
          className="flex-1 bg-transparent font-['Courier_New'] text-textInput uppercase tracking-wider outline-none placeholder-[#333] hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors"
        />
        <select
          value={fontSize}
          onChange={e => setFontSize(e.target.value as FontSize)}
          className="bg-transparent text-xs text-[#555] outline-none cursor-pointer hover:text-[#c9a227] transition-colors"
        >
          {(Object.keys(fontSizeMap) as FontSize[]).map(s => (
            <option key={s} value={s} className="bg-[#0a0a14]">{s}</option>
          ))}
        </select>
        <button
          onClick={() => printScene(local)}
          className="shrink-0 text-xs text-[#555] hover:text-[#c9a227] transition-colors tracking-widest pb-0.5"
          title="Open print preview"
        >
          PRINT
        </button>
      </div>
      <div className="space-y-4">
        {local.blocks.map((block, idx) => {
          const isCollapsed = collapsed.has(idx)
          const preview = block.type === 'action'
            ? (block.text.split('\n')[0] || 'Action')
            : `${block.data.character || 'CHARACTER'}: ${block.data.line.split('\n')[0] || '…'}`
          return (
            <div key={idx} className="group relative">
              <button
                onClick={() => toggleCollapse(idx)}
                className="absolute top-1 left-1 text-[10px] text-[#444] opacity-0 group-hover:opacity-100 hover:text-[#888] transition-all leading-none"
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
              {isCollapsed ? (
                <p
                  style={{ fontSize: fs }}
                  className="pl-5 pr-6 py-1 font-['Courier_New'] text-[#555] truncate cursor-default"
                  onClick={() => toggleCollapse(idx)}
                >
                  {preview}
                </p>
              ) : block.type === 'action' ? (
                <AutoTextarea
                  value={block.text}
                  onChange={e => updateBlock(idx, { type: 'action', text: (e.target as HTMLTextAreaElement).value })}
                  spellCheck={false}
                  style={{ fontSize: fs }}
                  className="w-full bg-transparent border border-transparent rounded p-3 font-['Courier_New'] text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus  transition-colors resize-none"
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
                    spellCheck={false}
                    style={{ fontSize: fs }}
                    className="w-2/5 bg-transparent text-center font-['Courier_New'] font-semibold text-textInput uppercase outline-none hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors placeholder-[#333]"
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
                    spellCheck={false}
                    style={{ fontSize: fs }}
                    className="w-2/5 bg-transparent text-center font-['Courier_New'] italic text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors placeholder-[#333]"
                  />
                  <AutoTextarea
                    value={block.data.line}
                    onChange={e =>
                      updateBlock(idx, {
                        type: 'dialogue',
                        data: { ...block.data, line: (e.target as HTMLTextAreaElement).value },
                      })
                    }
                    spellCheck={false}
                    style={{ fontSize: fs }}
                    className="w-3/5 bg-transparent border border-transparent text-center font-['Courier_New'] text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus  transition-colors resize-none"
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
          )
        })}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => addBlock('action')}
          className="px-4 py-2 text-xs text-[#888] border border-[#1a1a2e] rounded hover:text-[#c8c8c8] hover:border-[#333] transition-colors"
        >
          + Action
        </button>
        <button
          onClick={() => addBlock('dialogue')}
          className="px-4 py-2 text-xs text-[#888] border border-[#1a1a2e] rounded hover:text-[#c8c8c8] hover:border-[#333] transition-colors"
        >
          + Dialogue
        </button>
      </div>
    </div>
  )
}
