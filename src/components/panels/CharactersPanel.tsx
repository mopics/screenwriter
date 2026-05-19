import type { Character } from '../../types/character'
import type { Project } from '../../types/project'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function CharactersPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const selectedChar = project.characters.find(c => c.id === selectedId) ?? null

  function addCharacter() {
    const newChar: Character = {
      id: crypto.randomUUID(),
      name: '',
      pronouns: [],
      groups: [],
      otherNames: [],
      personality: '',
      physicalDescription: '',
      motivation: '',
      internalConflict: '',
      strengths: '',
      weaknesses: '',
      characterArc: '',
      dialogueStyle: '',
      backstory: '',
      relationships: [],
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
      <div className="w-52 border-r border-[#1a1a2e] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {project.characters.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectId(c.id)}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors ${
                c.id === selectedId
                  ? 'border-l-[#c9a227] text-[#c8c8d8] bg-[#14141f]'
                  : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-[#0f0f1a]'
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
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {selectedChar ? (
          <CharacterEditor
            character={selectedChar}
            onChange={updateChar}
            onDelete={() => deleteChar(selectedChar.id)}
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
}

function CharacterEditor({ character, onChange, onDelete }: EditorProps) {
  function update(field: keyof Character, value: string | string[]) {
    onChange({ ...character, [field]: value })
  }

  function updateCsv(field: keyof Character, raw: string) {
    update(field, raw.split(',').map(s => s.trim()).filter(Boolean))
  }

  const fields: Array<{ key: keyof Character; label: string; type: 'input' | 'textarea' | 'csv' }> = [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'pronouns', label: 'Pronouns', type: 'csv' },
    { key: 'groups', label: 'Groups', type: 'csv' },
    { key: 'otherNames', label: 'Other Names', type: 'csv' },
    { key: 'personality', label: 'Personality', type: 'textarea' },
    { key: 'physicalDescription', label: 'Physical Description', type: 'textarea' },
    { key: 'motivation', label: 'Motivation', type: 'textarea' },
    { key: 'internalConflict', label: 'Internal Conflict', type: 'textarea' },
    { key: 'strengths', label: 'Strengths', type: 'textarea' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'textarea' },
    { key: 'characterArc', label: 'Character Arc', type: 'textarea' },
    { key: 'dialogueStyle', label: 'Dialogue Style', type: 'textarea' },
    { key: 'backstory', label: 'Backstory', type: 'textarea' },
    { key: 'relationships', label: 'Relationships', type: 'csv' },
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
        {fields.map(({ key, label, type }) => (
          <div key={key}>
            <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">{label}</label>
            {type === 'input' && (
              <input
                value={character[key] as string}
                onChange={e => update(key, e.target.value)}
                className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50"
              />
            )}
            {type === 'textarea' && (
              <textarea
                value={character[key] as string}
                onChange={e => update(key, e.target.value)}
                rows={4}
                className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50 resize-y"
              />
            )}
            {type === 'csv' && (
              <input
                value={(character[key] as string[]).join(', ')}
                onChange={e => updateCsv(key, e.target.value)}
                className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
