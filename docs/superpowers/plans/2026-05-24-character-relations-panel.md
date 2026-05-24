# CharacterRelationsPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CharacterRelationsPanel — a lower-triangle matrix inspired by astrology's aspects table — where each cell holds multiple labelled relationship entries between two characters, each editable via an inline popover.

**Architecture:** New `SectionKey` value `'characterRelations'` wired into SidePanel and SceneEditor. A single new file `CharacterRelationsPanel.tsx` contains the matrix renderer and an inline `RelationshipPopover` component. All data lives on `project.characterRelationships` and is written back through the existing `onUpdate` prop.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| Status | Path | Purpose |
|--------|------|---------|
| Modify | `src/types/settings.ts` | Add `'characterRelations'` to `SectionKey` |
| Modify | `src/types/project.ts` | Add `id` and `label` to `characterRelationships` tuple |
| Modify | `src/components/SidePanel.tsx` | Add Relations nav button |
| Modify | `src/components/SidePanel.test.tsx` | Update section count + add Relations test |
| Create | `src/components/panels/CharacterRelationsPanel.tsx` | Matrix + popover |
| Create | `src/components/panels/CharacterRelationsPanel.test.tsx` | Panel tests |
| Modify | `src/pages/SceneEditor.tsx` | Render panel + hide font-size select for this section |
| Modify | `src/pages/SceneEditor.test.tsx` | Add Relations nav test |

---

## Task 1: Update types

**Files:**
- Modify: `src/types/settings.ts`
- Modify: `src/types/project.ts`

- [ ] **Step 1: Add `'characterRelations'` to `SectionKey`**

In `src/types/settings.ts`, change line 1 from:
```ts
export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes'
```
to:
```ts
export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes' | 'characterRelations'
```

- [ ] **Step 2: Add `id` and `label` to the relationship tuple**

In `src/types/project.ts`, change line 23 from:
```ts
  characterRelationships?: { fromId: string, toId: string, description: string }[]
```
to:
```ts
  characterRelationships?: { id: string; fromId: string; toId: string; label: string; description: string }[]
```

- [ ] **Step 3: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: no errors (the only change is an additive union member and two new required fields on an optional array — existing code never constructs this type)

- [ ] **Step 4: Commit**

```bash
git add src/types/settings.ts src/types/project.ts
git commit -m "feat: extend SectionKey and characterRelationships type for relations panel"
```

---

## Task 2: Update SidePanel

**Files:**
- Modify: `src/components/SidePanel.test.tsx`
- Modify: `src/components/SidePanel.tsx`

- [ ] **Step 1: Write the failing test**

In `src/components/SidePanel.test.tsx`, update the first test and add a new one:

```ts
it('renders buttons for all 5 sections with title attributes', () => {
  render(<SidePanel activeSection="synopsis" onSectionChange={() => {}} />)
  expect(screen.getByTitle('Synopsis')).toBeDefined()
  expect(screen.getByTitle('Characters')).toBeDefined()
  expect(screen.getByTitle('Acts')).toBeDefined()
  expect(screen.getByTitle('Scenes')).toBeDefined()
  expect(screen.getByTitle('Relations')).toBeDefined()
})

it('calls onSectionChange with characterRelations when Relations is clicked', () => {
  const onSectionChange = vi.fn()
  render(<SidePanel activeSection="synopsis" onSectionChange={onSectionChange} />)
  fireEvent.click(screen.getByTitle('Relations'))
  expect(onSectionChange).toHaveBeenCalledWith('characterRelations')
})
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npx vitest run src/components/SidePanel.test.tsx`
Expected: FAIL — `Unable to find an element with the title: Relations`

- [ ] **Step 3: Add Relations to SidePanel**

In `src/components/SidePanel.tsx`, add one entry to the `SECTIONS` array:

```ts
const SECTIONS: SectionItem[] = [
  { key: 'synopsis', icon: '📋', label: 'Synopsis' },
  { key: 'characters', icon: '🎭', label: 'Characters' },
  { key: 'characterRelations', icon: '🕸️', label: 'Relations' },
  { key: 'acts', icon: '🗂️', label: 'Acts' },
  { key: 'scenes', icon: '🎬', label: 'Scenes' },
]
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npx vitest run src/components/SidePanel.test.tsx`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SidePanel.tsx src/components/SidePanel.test.tsx
git commit -m "feat: add Relations section to SidePanel nav"
```

---

## Task 3: CharacterRelationsPanel — matrix rendering

**Files:**
- Create: `src/components/panels/CharacterRelationsPanel.test.tsx`
- Create: `src/components/panels/CharacterRelationsPanel.tsx`

- [ ] **Step 1: Write failing tests for matrix rendering**

Create `src/components/panels/CharacterRelationsPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CharacterRelationsPanel } from './CharacterRelationsPanel'
import type { Project } from '../../types/project'
import type { Character } from '../../types/character'

function makeChar(id: string, name: string): Character {
  return {
    id, name, pronouns: [], groups: [], otherNames: [],
    personality: '', physicalDescription: '', motivation: '',
    internalConflict: '', strengths: '', weaknesses: '',
    characterArc: '', dialogueStyle: '', backstory: '',
    relationships: [], expandedFields: [],
  }
}

function makeProject(characters: Character[], rels: NonNullable<Project['characterRelationships']> = []): Project {
  return {
    id: '1', title: 'T', genre: 'FEATURE', draftNumber: 1,
    lastEditedAt: '', createdAt: '',
    characters, acts: [], scenes: [], sketches: [],
    settings: { activePanel: 'synopsis', fontSizes: { scenes: 'sm', synopsis: 'sm', characters: 'sm', acts: 'sm' } },
    characterRelationships: rels,
  }
}

const anna = makeChar('anna', 'ANNA')
const jake = makeChar('jake', 'JAKE')
const marie = makeChar('marie', 'MARIE')

describe('CharacterRelationsPanel', () => {
  it('shows hint when 0 characters', () => {
    render(<CharacterRelationsPanel project={makeProject([])} onUpdate={() => {}} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('shows hint when 1 character', () => {
    render(<CharacterRelationsPanel project={makeProject([anna])} onUpdate={() => {}} />)
    expect(screen.getByText(/Add at least two characters/)).toBeDefined()
  })

  it('renders character names in headers when 2+ characters', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
    // Name appears in column header and row label → at least 2 occurrences each
    expect(screen.getAllByText('ANNA').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('JAKE').length).toBeGreaterThanOrEqual(1)
  })

  it('renders an empty-cell + button in the lower triangle', () => {
    render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
    // JAKE is row 1, ANNA is col 0 → lower triangle cell should have a '+' button
    expect(screen.getByRole('button', { name: '+' })).toBeDefined()
  })

  it('renders existing relationship chips', () => {
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
    expect(screen.getByRole('button', { name: 'rivals' })).toBeDefined()
  })

  it('ignores relationships for deleted characters', () => {
    // orphaned rel with id 'ghost' not in characters list
    const rels = [{ id: 'r1', fromId: 'anna', toId: 'ghost', label: 'rivals', description: '' }]
    render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
    expect(screen.queryByRole('button', { name: 'rivals' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run to confirm all fail**

Run: `npx vitest run src/components/panels/CharacterRelationsPanel.test.tsx`
Expected: FAIL — `Cannot find module './CharacterRelationsPanel'`

- [ ] **Step 3: Create CharacterRelationsPanel.tsx with matrix rendering**

Create `src/components/panels/CharacterRelationsPanel.tsx`:

```tsx
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
        className="w-full bg-[#1a1a2e] border border-[#2a2a40] text-[#c9a227] text-[10px] px-1.5 py-1 mb-2 rounded-sm font-mono outline-none"
      />
      <label className="block text-[8px] text-[#555] mb-1 uppercase tracking-wider">Description</label>
      <AutoTextarea
        value={description}
        onChange={e => setDescription((e.target as HTMLTextAreaElement).value)}
        placeholder="Describe the relationship..."
        className="w-full bg-[#1a1a2e] border border-[#2a2a40] text-[#888] text-[10px] px-1.5 py-1 mb-2.5 rounded-sm font-mono outline-none resize-none"
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
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npx vitest run src/components/panels/CharacterRelationsPanel.test.tsx`
Expected: all PASS

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/panels/CharacterRelationsPanel.tsx src/components/panels/CharacterRelationsPanel.test.tsx
git commit -m "feat: add CharacterRelationsPanel with matrix rendering"
```

---

## Task 4: CharacterRelationsPanel — popover interactions

**Files:**
- Modify: `src/components/panels/CharacterRelationsPanel.test.tsx` (add tests)

The implementation is already complete from Task 3. This task adds the interaction tests to verify the popover open/save/update/delete/cancel flows.

- [ ] **Step 1: Add interaction tests to the test file**

Append these tests to the `describe('CharacterRelationsPanel')` block in `src/components/panels/CharacterRelationsPanel.test.tsx`:

```tsx
it('opens a blank popover when empty cell is clicked', () => {
  render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  expect(screen.getByPlaceholderText('e.g. rivals')).toBeDefined()
})

it('save button is disabled when label is empty', () => {
  render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  const saveBtn = screen.getByRole('button', { name: 'save' })
  expect(saveBtn.hasAttribute('disabled')).toBe(true)
})

it('calls onUpdate with new relationship on save', () => {
  const onUpdate = vi.fn()
  render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  fireEvent.change(screen.getByPlaceholderText('e.g. rivals'), { target: { value: 'rivals' } })
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  expect(onUpdate).toHaveBeenCalledOnce()
  const patch = onUpdate.mock.calls[0][0]
  expect(patch.characterRelationships).toHaveLength(1)
  expect(patch.characterRelationships[0].label).toBe('rivals')
  expect(patch.characterRelationships[0].id).toBeTruthy()
})

it('normalises pair so fromId < toId regardless of click order', () => {
  const onUpdate = vi.fn()
  // 'anna' < 'jake' alphabetically
  render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  fireEvent.change(screen.getByPlaceholderText('e.g. rivals'), { target: { value: 'rivals' } })
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  const rel = onUpdate.mock.calls[0][0].characterRelationships[0]
  expect(rel.fromId < rel.toId).toBe(true)
})

it('opens popover with existing data when chip is clicked', () => {
  const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
  render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
  expect(screen.getByDisplayValue('rivals')).toBeDefined()
  expect(screen.getByDisplayValue('competing')).toBeDefined()
})

it('calls onUpdate with updated label on save', () => {
  const onUpdate = vi.fn()
  const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: 'competing' }]
  render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
  fireEvent.change(screen.getByDisplayValue('rivals'), { target: { value: 'friends' } })
  fireEvent.click(screen.getByRole('button', { name: 'save' }))
  const patch = onUpdate.mock.calls[0][0]
  expect(patch.characterRelationships[0].label).toBe('friends')
  expect(patch.characterRelationships[0].id).toBe('r1')
})

it('calls onUpdate removing entry on delete', () => {
  const onUpdate = vi.fn()
  const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: '' }]
  render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: 'rivals' }))
  fireEvent.click(screen.getByRole('button', { name: 'delete' }))
  expect(onUpdate).toHaveBeenCalledWith({ characterRelationships: [] })
})

it('closes popover and does not call onUpdate on cancel', () => {
  const onUpdate = vi.fn()
  render(<CharacterRelationsPanel project={makeProject([anna, jake])} onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: '+' }))
  expect(screen.getByPlaceholderText('e.g. rivals')).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
  expect(onUpdate).not.toHaveBeenCalled()
  expect(screen.queryByPlaceholderText('e.g. rivals')).toBeNull()
})

it('shows + add in filled cells and opens a blank popover for a new entry', () => {
  const rels = [{ id: 'r1', fromId: 'anna', toId: 'jake', label: 'rivals', description: '' }]
  render(<CharacterRelationsPanel project={makeProject([anna, jake], rels)} onUpdate={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: '+ add' }))
  const labelInput = screen.getByPlaceholderText('e.g. rivals') as HTMLInputElement
  expect(labelInput).toBeDefined()
  expect(labelInput.value).toBe('')
})
```

Also add `vi` to imports at the top of the test file:
```ts
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
```

- [ ] **Step 2: Run tests to confirm all pass**

Run: `npx vitest run src/components/panels/CharacterRelationsPanel.test.tsx`
Expected: all PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/panels/CharacterRelationsPanel.test.tsx
git commit -m "test: add interaction tests for CharacterRelationsPanel popover"
```

---

## Task 5: Wire up in SceneEditor

**Files:**
- Modify: `src/pages/SceneEditor.test.tsx`
- Modify: `src/pages/SceneEditor.tsx`

- [ ] **Step 1: Write the failing SceneEditor test**

Add this test to `src/pages/SceneEditor.test.tsx` (inside the existing `describe('SceneEditor')` block):

```ts
it('switches to CharacterRelationsPanel when Relations icon is clicked', () => {
  renderWithRouter('1')
  fireEvent.click(screen.getByTitle('Relations'))
  // mockProject has characters: [] so hint message appears
  expect(screen.getByText(/Add at least two characters/)).toBeDefined()
})
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run src/pages/SceneEditor.test.tsx`
Expected: FAIL — `Unable to find an element with the text: /Add at least two characters/`

- [ ] **Step 3: Wire CharacterRelationsPanel into SceneEditor**

In `src/pages/SceneEditor.tsx`:

1. Add the import at the top (with the other panel imports):
```ts
import { CharacterRelationsPanel } from '../components/panels/CharacterRelationsPanel'
```

2. In the font-size `<select>`, wrap it so it only shows for sections that have font-size support. Change:
```tsx
<select
  value={fontSizes[activeSection]}
  onChange={e => handleFontSizeChange(e.target.value as FontSize)}
  className="bg-transparent text-xs text-[#555] outline-none cursor-pointer hover:text-[#c9a227] transition-colors"
>
```
to:
```tsx
{activeSection !== 'characterRelations' && (
  <select
    value={fontSizes[activeSection as keyof typeof fontSizes]}
    onChange={e => handleFontSizeChange(e.target.value as FontSize)}
    className="bg-transparent text-xs text-[#555] outline-none cursor-pointer hover:text-[#c9a227] transition-colors"
  >
```
and close it after its `</select>` with `}`.

3. Add the panel render below the existing panels (after the `scenes` line):
```tsx
{activeSection === 'characterRelations' && (
  <CharacterRelationsPanel project={project} onUpdate={onUpdate} />
)}
```

- [ ] **Step 4: Run all tests to confirm pass**

Run: `npx vitest run`
Expected: all PASS

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/pages/SceneEditor.tsx src/pages/SceneEditor.test.tsx
git commit -m "feat: wire CharacterRelationsPanel into SceneEditor"
```
