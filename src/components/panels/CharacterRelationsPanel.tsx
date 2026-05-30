import { Fragment, useState } from 'react'
import { AutoTextarea } from '../AutoTextarea'
import type { Project } from '../../types/project'

const CHIP_PALETTE = ['#c9a227', '#7b68ee', '#e74c3c', '#3498db', '#2ecc71', '#f39c12']

type Rel = NonNullable<Project['characterRelationships']>[number]
type SelectedEntry = { fromId: string; toId: string; id: string } | null

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}

function normPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

function relsForPair(rels: Rel[], idA: string, idB: string): Rel[] {
  const [from, to] = normPair(idA, idB)
  return rels.filter(r => r.fromId === from && r.toId === to)
}

export function CharacterRelationsPanel({ project, onUpdate }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<SelectedEntry>(null)
  const chars = project.characters
  const allRels = project.characterRelationships ?? []

  if (chars.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#555] text-sm">Add at least two characters to define relationships.</p>
      </div>
    )
  }

  const validIds = new Set(chars.map(c => c.id))
  const rels = allRels.filter(r => validIds.has(r.fromId) && validIds.has(r.toId))

  function handleSave(entry: Rel) {
    const [fromId, toId] = normPair(entry.fromId, entry.toId)
    const normalized = { ...entry, fromId, toId }
    const isNew = !rels.some(r => r.id === normalized.id)
    const updated = isNew
      ? [...rels, normalized]
      : rels.map(r => r.id === normalized.id ? normalized : r)
    onUpdate({ characterRelationships: updated })
    setSelectedEntry(null)
  }

  function handleDelete(id: string) {
    onUpdate({ characterRelationships: rels.filter(r => r.id !== id) })
    setSelectedEntry(null)
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {selectedEntry && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSelectedEntry(null)}
        />
      )}
      <div
        className="inline-grid gap-px"
        style={{ gridTemplateColumns: `80px repeat(${chars.length}, minmax(90px, 1fr))` }}
      >
        {/* Header row */}
        <div />
        {chars.map(c => (
          <div
            key={c.id}
            title={c.name || 'Unnamed'}
            className="text-[9px] text-[#666] text-center px-2 py-1 border-b border-[#1a1a2e] truncate font-mono"
          >
            {c.name || 'Unnamed'}
          </div>
        ))}

        {/* Data rows */}
        {chars.map((rowChar, rowIdx) => (
          <Fragment key={rowChar.id}>
            <div className="text-[9px] text-[#666] text-right pr-2 self-center border-r border-[#1a1a2e] font-mono">
              {rowChar.name || 'Unnamed'}
            </div>
            {chars.map((colChar, colIdx) => {
              if (colIdx === rowIdx) {
                return (
                  <div
                    key={`diag-${rowChar.id}`}
                    className="bg-[#0d0d1a] flex items-center justify-center"
                    style={{ minHeight: 70 }}
                  >
                    <span className="text-[#222] text-sm">×</span>
                  </div>
                )
              }
              if (colIdx > rowIdx) {
                return (
                  <div
                    key={`upper-${rowChar.id}-${colChar.id}`}
                    className="bg-[#0a0a0f] border border-[#111]"
                    style={{ minHeight: 70 }}
                  />
                )
              }

              // Lower triangle — active cell
              const cellRels = relsForPair(rels, rowChar.id, colChar.id)
              const [normFrom, normTo] = normPair(rowChar.id, colChar.id)
              const isAnchor = selectedEntry?.fromId === normFrom && selectedEntry?.toId === normTo

              return (
                <div
                  key={`cell-${rowChar.id}-${colChar.id}`}
                  className={`bg-[#13131f] border p-2 flex flex-col gap-1 relative ${
                    isAnchor ? 'border-[#c9a22760]' : 'border-[#1e1e30] hover:border-[#c9a22730]'
                  }`}
                  style={{ minHeight: 70 }}
                >
                  {cellRels.length === 0 ? (
                    <button
                      className="flex-1 flex items-center justify-center text-[#2a2a3a] text-lg hover:text-[#555] transition-colors"
                      onClick={() => setSelectedEntry({ fromId: normFrom, toId: normTo, id: '__new__' })}
                    >
                      +
                    </button>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {cellRels.map((rel, idx) => {
                          const color = CHIP_PALETTE[idx % CHIP_PALETTE.length]
                          const isSelected = selectedEntry?.id === rel.id
                          return (
                            <button
                              key={rel.id}
                              onClick={() => setSelectedEntry({ fromId: rel.fromId, toId: rel.toId, id: rel.id })}
                              style={{
                                color,
                                background: `${color}18`,
                                border: `1px solid ${isSelected ? color : `${color}40`}`,
                              }}
                              className="text-[8px] px-1.5 py-0.5 rounded-sm font-mono transition-opacity"
                            >
                              {rel.label}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        className="text-[9px] text-[#2a2a3a] hover:text-[#555] text-left transition-colors font-mono"
                        onClick={() => setSelectedEntry({ fromId: normFrom, toId: normTo, id: '__new__' })}
                      >
                        + add
                      </button>
                    </>
                  )}
                  {isAnchor && selectedEntry && (
                    <RelationshipPopover
                      fromId={selectedEntry.fromId}
                      toId={selectedEntry.toId}
                      entryId={selectedEntry.id}
                      existing={selectedEntry.id !== '__new__'
                        ? rels.find(r => r.id === selectedEntry.id) ?? null
                        : null}
                      charNames={{
                        [rowChar.id]: rowChar.name || 'Unnamed',
                        [colChar.id]: colChar.name || 'Unnamed',
                      }}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      onCancel={() => setSelectedEntry(null)}
                    />
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

type PopoverProps = {
  fromId: string
  toId: string
  entryId: string
  existing: Rel | null
  charNames: Record<string, string>
  onSave: (entry: Rel) => void
  onDelete: (id: string) => void
  onCancel: () => void
}

function RelationshipPopover({ fromId, toId, entryId, existing, charNames, onSave, onDelete, onCancel }: PopoverProps) {
  const [label, setLabel] = useState(existing?.label ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const nameA = charNames[fromId] ?? 'Unknown'
  const nameB = charNames[toId] ?? 'Unknown'

  function handleSave() {
    if (!label.trim()) return
    const id = entryId === '__new__' ? crypto.randomUUID() : entryId
    onSave({ id, fromId, toId, label: label.trim(), description })
  }

  return (
    <div
      className="absolute top-full left-0 mt-1 z-20 bg-[#13131f] border border-[#c9a227] rounded p-3 w-52 shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="text-[8px] text-[#888] mb-2.5 uppercase tracking-widest font-mono">
        {nameA} ↔ {nameB}
      </div>
      <label className="block text-[8px] text-[#555] mb-1 uppercase tracking-wider">Label</label>
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="e.g. rivals"
        autoFocus
        className="w-full border border-[#2a2a40] text-[#c9a227] text-[10px] px-1.5 py-1 mb-2 rounded-sm font-mono outline-none"
      />
      <label className="block text-[8px] text-[#555] mb-1 uppercase tracking-wider">Description</label>
      <AutoTextarea
        value={description}
        onChange={e => setDescription((e.target as HTMLTextAreaElement).value)}
        placeholder="Describe the relationship..."
        className="w-full border border-[#2a2a40] text-[#888] text-[10px] px-1.5 py-1 mb-2.5 rounded-sm font-mono outline-none resize-none"
      />
      <div className="flex justify-between items-center">
        {existing ? (
          <button
            onClick={() => onDelete(entryId)}
            className="text-[8px] text-red-400 hover:text-red-300 font-mono transition-colors"
          >
            delete
          </button>
        ) : <span />}
        <div className="flex gap-1.5">
          <button
            onClick={onCancel}
            className="text-[8px] text-[#555] border border-[#2a2a40] rounded-sm px-2 py-1 font-mono hover:text-[#888] transition-colors"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className="text-[8px] text-[#c9a227] border border-[#c9a22760] rounded-sm px-2 py-1 font-mono hover:bg-[#c9a22710] transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            save
          </button>
        </div>
      </div>
    </div>
  )
}
