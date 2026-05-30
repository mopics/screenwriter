import { useState } from 'react'
import { AutoTextarea } from '../AutoTextarea'
import type { Character } from '../../types/character'
import type { Project } from '../../types/project'
import { fontSizeMap, type FontSize } from '../../types/settings'
import { useResize } from '../../hooks/useResize'
import { useCappedDebounce } from '../../hooks/useCappedDebounce'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
  fontSize: FontSize
}

export function CharactersPanel({ project, onUpdate, selectedId, onSelectId, fontSize }: Props) {
  const { width, dragHandleProps } = useResize(208)
  const selectedChar = project.characters.find(c => c.id === selectedId) ?? null

  function addCharacter() {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '',
      otherNames: '',
      personality: '',
      physicalDescription: '',
      motivation: '',
      internalConflict: '',
      strengths: '',
      weaknesses: '',
      characterArc: '',
      dialogueStyle: '',
      backstory: '',
      groups: '',
      expandedFields: [],
    }
    onUpdate({ characters: [...project.characters, newChar] })
    onSelectId(newChar.id)
  }

  function updateChar(updated: Character) {
    onUpdate({ characters: project.characters.map(c => c.id === updated.id ? updated : c) })
  }

  function deleteChar(id: string) {
    if (!window.confirm('Delete this character?')) return
    onUpdate({ characters: project.characters.filter(c => c.id !== id) })
    if (selectedId === id) onSelectId(null)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="relative shrink-0 border-r border-[#1a1a2e] flex flex-col overflow-hidden" style={{ width }}>
        <div className="flex-1 overflow-y-auto">
          {project.characters.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectId(c.id)}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors ${c.id === selectedId
                ? 'border-l-[#c9a227] text-[#c8c8d8] bg-panelSelect'
                : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-panelHover'
                }`}
            >
              {c.name || 'Unnamed character'}
            </button>
          ))}
        </div>
        <button
          onClick={addCharacter}
          className="m-3 py-2 text-xs text-[#c9a227] border border-[#c9a227]/30 rounded hover:bg-[#c9a227]/10 transition-colors"
        >
          + Add Character
        </button>
        <div {...dragHandleProps} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 scrollbar">
        {selectedChar ? (
          <CharacterEditor
            key={selectedChar.id}
            character={selectedChar}
            onChange={updateChar}
            onDelete={() => deleteChar(selectedChar.id)}
            fontSize={fontSize}
          />
        ) : (
          <p className="text-[#555] text-sm">Select a character to edit</p>
        )}
      </div>
    </div>
  )
}

type EditorProps = {
  character: Character
  onChange: (c: Character) => void
  onDelete: () => void
  fontSize: FontSize
}

function CharacterEditor({ character, onChange, onDelete, fontSize }: EditorProps) {
  const fs = fontSizeMap[fontSize]
  const [local, setLocal] = useState(character)
  const debouncedOnChange = useCappedDebounce(onChange)

  function update(field: keyof Character, value: string | string[]) {
    const updated = { ...local, [field]: value }
    setLocal(updated)
    debouncedOnChange(updated)
  }

  function updateCsv(field: keyof Character, raw: string) {
    update(field, raw.split(',').map(s => s.trim()).filter(Boolean))
  }

  function toggleField(key: string) {
    const current = local.expandedFields ?? []
    const isExpanded = current.includes(key)
    const updated = {
      ...local,
      expandedFields: isExpanded ? current.filter(k => k !== key) : [...current, key],
    }
    setLocal(updated)
    onChange(updated)
  }

  const fields: Array<{ key: keyof Character; label: string; type: 'input' | 'textarea' | 'csv' }> = [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'otherNames', label: 'Other Names', type: 'input' },
    { key: 'personality', label: 'Personality', type: 'textarea' },
    { key: 'physicalDescription', label: 'Physical Description', type: 'textarea' },
    { key: 'motivation', label: 'Motivation', type: 'textarea' },
    { key: 'internalConflict', label: 'Internal Conflict', type: 'textarea' },
    { key: 'strengths', label: 'Strengths', type: 'textarea' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
    { key: 'characterArc', label: 'Character Arc', type: 'textarea' },
    { key: 'dialogueStyle', label: 'Dialogue Style', type: 'textarea' },
    { key: 'backstory', label: 'Backstory', type: 'textarea' },
    { key: 'groups', label: 'Groups', type: 'input' },
  ]

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Delete character
        </button>
      </div>
      <div className="space-y-4">
        {fields.map(({ key, label, type }) => {
          const isExpanded = type === 'textarea' && (local.expandedFields ?? []).includes(key as string)
          return (
            <div key={key}>
              {type === 'textarea' ? (
                <button
                  onClick={() => toggleField(key as string)}
                  className="flex items-center gap-1.5 w-full text-left text-xs text-[#888] mb-1 uppercase tracking-wider hover:text-[#aaa] transition-colors"
                >
                  <span className="text-[8px]">{isExpanded ? '/' : '>'}</span>
                  {label}
                </button>
              ) : (
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">{label}</label>
              )}
              {type === 'input' && (
                <input
                  value={local[key] as string}
                  onChange={e => update(key, e.target.value)}
                  style={{ fontSize: fs }}
                  className="w-full bg-transparent px-3 py-2 text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors"
                />
              )}
              {type === 'textarea' && isExpanded && (
                <AutoTextarea
                  autoFocus
                  value={local[key] as string}
                  onChange={e => update(key, (e.target as HTMLTextAreaElement).value)}
                  style={{ fontSize: fs }}
                  className="w-full bg-transparent px-3 py-2 text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors"
                />
              )}
              {type === 'textarea' && !isExpanded && (
                <div style={{ fontSize: fs }} className="text-[#555] italic px-1 py-0.5 truncate">
                  {(local[key] as string) || '— empty —'}
                </div>
              )}
              {type === 'csv' && (
                <input
                  value={(local[key] as string[]).join(', ')}
                  onChange={e => updateCsv(key, e.target.value)}
                  style={{ fontSize: fs }}
                  className="w-full bg-transparent px-3 py-2 text-textInput outline-none hover:bg-bgInputHover focus:bg-bgInputFocus transition-colors"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
