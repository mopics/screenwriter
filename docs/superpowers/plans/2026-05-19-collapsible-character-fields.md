# Collapsible Character Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make textarea fields in `CharacterEditor` collapsible, with each character remembering its own expanded/collapsed state in the DB.

**Architecture:** Add `expandedFields: string[]` to the `Character` type. `CharacterEditor` renders a clickable chevron label instead of a static label for textarea fields; collapsed fields show a one-line text preview. Toggling calls `onChange` on the character, which flows through the existing `updateProject` save path.

**Tech Stack:** React, TypeScript, Vitest + Testing Library

---

### Task 1: Add `expandedFields` to Character type and factories

**Files:**
- Modify: `src/types/character.ts`
- Modify: `src/components/panels/CharactersPanel.tsx` (line 16–34, `addCharacter`)
- Modify: `src/components/panels/CharactersPanel.test.tsx` (line 7–23, `alice` fixture)

- [ ] **Step 1: Add field to Character type**

In `src/types/character.ts`, add `expandedFields: string[]` as the last field before the closing `}`:

```ts
export type Character = {
  id: string
  name: string
  pronouns: string[]
  groups: string[]
  otherNames: string[]
  personality: string
  physicalDescription: string
  motivation: string
  internalConflict: string
  strengths: string
  weaknesses: string
  characterArc: string
  dialogueStyle: string
  backstory: string
  relationships: string[]
  expandedFields: string[]
}
```

- [ ] **Step 2: Add `expandedFields: []` to the `alice` test fixture**

In `src/components/panels/CharactersPanel.test.tsx`, add `expandedFields: []` to the `alice` object (after `relationships: []`):

```ts
const alice: Character = {
  id: 'c1',
  name: 'Alice',
  pronouns: ['She/Her'],
  groups: [],
  otherNames: [],
  personality: 'Driven',
  physicalDescription: 'Tall',
  motivation: 'Freedom',
  internalConflict: 'Trust vs control',
  strengths: 'Resourceful',
  weaknesses: 'Impulsive',
  characterArc: 'Learns to trust',
  dialogueStyle: 'Direct',
  backstory: 'Grew up alone',
  relationships: [],
  expandedFields: [],
}
```

- [ ] **Step 3: Add `expandedFields: []` to `addCharacter` in CharactersPanel**

In `src/components/panels/CharactersPanel.tsx`, add `expandedFields: []` to the `newChar` object inside `addCharacter` (after `relationships: []`):

```ts
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
```

- [ ] **Step 4: Run all tests — expect them to pass**

```
npx vitest run src/components/panels/CharactersPanel.test.tsx
```

Expected: all 8 tests pass. (CharacterEditor hasn't changed yet, so all textareas still render.)

- [ ] **Step 5: Commit**

```bash
git add src/types/character.ts src/components/panels/CharactersPanel.tsx src/components/panels/CharactersPanel.test.tsx
git commit -m "feat: add expandedFields to Character type"
```

---

### Task 2: Collapsible textarea fields in CharacterEditor

**Files:**
- Modify: `src/components/panels/CharactersPanel.test.tsx` (update 1 existing test, add 4 new tests)
- Modify: `src/components/panels/CharactersPanel.tsx` (`CharacterEditor` function)

- [ ] **Step 1: Update the existing `shows editor form fields` test**

The test currently checks `getByDisplayValue('Driven')` — after this feature, personality is collapsed by default so the textarea won't render. Change it to check the preview text instead.

In `src/components/panels/CharactersPanel.test.tsx`, replace the test at line 53–57:

```ts
it('shows editor form fields when a character is selected', () => {
  render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
  expect(screen.getByDisplayValue('Alice')).toBeDefined()
  expect(screen.getByText('Driven')).toBeDefined()
})
```

- [ ] **Step 2: Add four new tests for collapse/expand behaviour**

Append these tests inside the `describe('CharactersPanel')` block in `src/components/panels/CharactersPanel.test.tsx`:

```ts
it('does not render textarea for collapsed fields', () => {
  render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
  expect(screen.queryByDisplayValue('Driven')).toBeNull()
})

it('shows preview text for a collapsed textarea field with content', () => {
  render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
  expect(screen.getByText('Driven')).toBeDefined()
})

it('expands a textarea field when its label is clicked', () => {
  const onUpdate = vi.fn()
  render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /personality/i }))
  expect(onUpdate).toHaveBeenCalledWith({
    characters: [{ ...alice, expandedFields: ['personality'] }],
  })
})

it('collapses an expanded textarea field when its label is clicked', () => {
  const onUpdate = vi.fn()
  const aliceExpanded = { ...alice, expandedFields: ['personality'] }
  const project = { ...baseProject, characters: [aliceExpanded] }
  render(<CharactersPanel project={project} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
  expect(screen.getByDisplayValue('Driven')).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: /personality/i }))
  expect(onUpdate).toHaveBeenCalledWith({
    characters: [{ ...aliceExpanded, expandedFields: [] }],
  })
})

it('shows "— empty —" for a collapsed textarea field with no content', () => {
  const aliceEmptyPersonality = { ...alice, personality: '' }
  render(<CharactersPanel project={{ ...baseProject, characters: [aliceEmptyPersonality] }} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
  expect(screen.getAllByText('— empty —').length).toBeGreaterThan(0)
})
```

- [ ] **Step 3: Run tests — expect the new/updated tests to fail**

```
npx vitest run src/components/panels/CharactersPanel.test.tsx
```

Expected: the updated `shows editor form fields` test and the 4 new tests fail. The 7 other tests still pass.

- [ ] **Step 4: Implement collapsible `CharacterEditor`**

Replace the entire `CharacterEditor` function in `src/components/panels/CharactersPanel.tsx` (lines 92–159) with:

```tsx
function CharacterEditor({ character, onChange, onDelete }: EditorProps) {
  function update(field: keyof Character, value: string | string[]) {
    onChange({ ...character, [field]: value })
  }

  function updateCsv(field: keyof Character, raw: string) {
    update(field, raw.split(',').map(s => s.trim()).filter(Boolean))
  }

  function toggleField(key: string) {
    const isExpanded = character.expandedFields.includes(key)
    onChange({
      ...character,
      expandedFields: isExpanded
        ? character.expandedFields.filter(k => k !== key)
        : [...character.expandedFields, key],
    })
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
        {fields.map(({ key, label, type }) => {
          const isExpanded = type === 'textarea' && character.expandedFields.includes(key as string)
          return (
            <div key={key}>
              {type === 'textarea' ? (
                <button
                  onClick={() => toggleField(key as string)}
                  className="flex items-center gap-1.5 w-full text-left text-xs text-[#888] mb-1 uppercase tracking-wider hover:text-[#aaa] transition-colors"
                >
                  <span className="text-[8px]">{isExpanded ? '▼' : '▶'}</span>
                  {label}
                </button>
              ) : (
                <label className="block text-xs text-[#888] mb-1 uppercase tracking-wider">{label}</label>
              )}
              {type === 'input' && (
                <input
                  value={character[key] as string}
                  onChange={e => update(key, e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50"
                />
              )}
              {type === 'textarea' && isExpanded && (
                <textarea
                  value={character[key] as string}
                  onChange={e => update(key, e.target.value)}
                  rows={4}
                  className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50 resize-y"
                />
              )}
              {type === 'textarea' && !isExpanded && (
                <div className="text-xs text-[#555] italic px-1 py-0.5 truncate">
                  {(character[key] as string) || '— empty —'}
                </div>
              )}
              {type === 'csv' && (
                <input
                  value={(character[key] as string[]).join(', ')}
                  onChange={e => updateCsv(key, e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-[#1a1a2e] rounded px-3 py-2 text-sm text-[#c8c8d8] outline-none focus:border-[#c9a227]/50"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run all tests — expect them all to pass**

```
npx vitest run src/components/panels/CharactersPanel.test.tsx
```

Expected: all 13 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/panels/CharactersPanel.tsx src/components/panels/CharactersPanel.test.tsx
git commit -m "feat: collapsible textarea fields in CharacterEditor"
```
