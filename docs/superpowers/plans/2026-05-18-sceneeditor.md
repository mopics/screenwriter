# SceneEditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ProjectPlaceholder` at `/project/:id` with a full three-panel SceneEditor — icon rail SidePanel + contextual list panel + editor — across five sections: Synopsis, Characters, Acts, Scenes, Sketches. All changes auto-persist to localStorage.

**Architecture:** New type files (`scene.ts`, `act.ts`, `sketch.ts`) shape the updated `Project` type. A `useProjects` hook gains `updateProject`. Eight focused panel components are orchestrated by a single `SceneEditor` page that holds `activeSection` and `selectedId` state and passes an `onUpdate` callback down.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, Vitest, React Testing Library, React Router v6, localStorage.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/types/scene.ts` | `DialogueLine`, `SceneBlock`, `Scene` types |
| Create | `src/types/act.ts` | `Act` type |
| Create | `src/types/sketch.ts` | `Sketch` type |
| Modify | `src/types/project.ts` | Replace `scenes: string[]`, `looseDialogues`, `looseNotes` with `acts`, `scenes: Scene[]`, `sketches` |
| Modify | `src/data/mockProjects.ts` | Add `acts: []`, `sketches: []`, remove `looseDialogues`/`looseNotes` |
| Modify | `src/hooks/useProjects.ts` | Add `updateProject` |
| Modify | `src/hooks/useProjects.test.ts` | Fix `sampleProject` shape, fix title assertion, add `updateProject` test |
| Create | `src/components/SidePanel.tsx` | 48px icon rail + exports `SectionKey` |
| Create | `src/components/SidePanel.test.tsx` | SidePanel unit tests |
| Create | `src/components/panels/SynopsisPanel.tsx` | Full-width synopsis textarea, 300ms debounce |
| Create | `src/components/panels/SynopsisPanel.test.tsx` | SynopsisPanel unit tests |
| Create | `src/components/panels/CharactersPanel.tsx` | List + character form editor |
| Create | `src/components/panels/CharactersPanel.test.tsx` | CharactersPanel unit tests |
| Create | `src/components/panels/ActsPanel.tsx` | List + act title editor + scene reorder |
| Create | `src/components/panels/ActsPanel.test.tsx` | ActsPanel unit tests |
| Create | `src/components/panels/ScenesPanel.tsx` | Grouped list + screenplay block editor |
| Create | `src/components/panels/ScenesPanel.test.tsx` | ScenesPanel unit tests |
| Create | `src/components/panels/SketchesPanel.tsx` | List + full-height textarea, 300ms debounce |
| Create | `src/components/panels/SketchesPanel.test.tsx` | SketchesPanel unit tests |
| Create | `src/pages/SceneEditor.tsx` | Three-panel orchestrator page |
| Create | `src/pages/SceneEditor.test.tsx` | SceneEditor integration tests |
| Modify | `src/App.tsx` | Swap `ProjectPlaceholder` → `SceneEditor` |
| Delete | `src/pages/ProjectPlaceholder.tsx` | Replaced by SceneEditor |

---

## Task 1: New Types + Update Project + Fix Data + Fix Tests

**Files:**
- Create: `src/types/scene.ts`
- Create: `src/types/act.ts`
- Create: `src/types/sketch.ts`
- Modify: `src/types/project.ts`
- Modify: `src/data/mockProjects.ts`
- Modify: `src/hooks/useProjects.test.ts`

---

- [ ] **Step 1: Create `src/types/scene.ts`**

```ts
export type DialogueLine = {
  character: string
  parenthetical?: string
  line: string
}

export type SceneBlock =
  | { type: 'action'; text: string }
  | { type: 'dialogue'; data: DialogueLine }

export type Scene = {
  id: string
  slugLine: string
  actId: string
  order: number
  blocks: SceneBlock[]
}
```

- [ ] **Step 2: Create `src/types/act.ts`**

```ts
export type Act = {
  id: string
  title: string
  order: number
  sceneIds: string[]
}
```

- [ ] **Step 3: Create `src/types/sketch.ts`**

```ts
export type Sketch = {
  id: string
  text: string
}
```

- [ ] **Step 4: Update `src/types/project.ts`**

Replace the entire file:

```ts
import type { Character } from './character'
import type { Act } from './act'
import type { Scene } from './scene'
import type { Sketch } from './sketch'

export type Genre = 'FEATURE' | 'SHORT' | 'TV PILOT' | 'MINI-SERIES'

export type Project = {
  id: string
  title: string
  genre: Genre
  draftNumber: number
  lastEditedAt: string
  createdAt: string
  synopsis?: string
  characters: Character[]
  acts: Act[]
  scenes: Scene[]
  sketches: Sketch[]
}
```

- [ ] **Step 5: Update `src/data/mockProjects.ts`**

Replace with the corrected mock data — add `acts: []`, `sketches: []`, remove `looseDialogues` and `looseNotes`, change `scenes: []` to typed `Scene[]`:

```ts
import type { Project } from '../types/project'

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Never Been Known To Fail',
    genre: 'FEATURE',
    draftNumber: 3,
    lastEditedAt: '2026-05-16T10:00:00Z',
    createdAt: '2026-03-01T10:00:00Z',
    characters: [
      {
        id: '1',
        name: 'Mogyo (Hungarian for peanut)',
        pronouns: ['Male', 'Restless', 'Mocking', 'Acting', 'Fast', 'Quick', 'Deceptive', 'Curious', 'Faking'],
        groups: ['Trine 3 Air', 'Main Character'],
        otherNames: [`Mercury's Bastard`],
        personality: `# Mars 3 degrees in Gemini
has a very sharp, quicksilver kind of energy. Captured around year 0 somewhere in the north. Agile mentally, hard to fully dominate, always observing.

# Restless Survivor
He cannot stay mentally still. Even in chains, his mind keeps moving:
 * watches exits automatically
 * memorizes routines of guards
 * learns languages quickly
 * notices social tensions instantly

He survives through awareness before violence.

# Mocking Humor
often fights with words first.
He develops:
 * dark humor
 * sarcasm
 * imitation skills
 * talent for humiliating opponents verbally

Roman crowds may love him because he taunts elegantly before combat.

He laughs at dangerous moments when others freeze.`,
        physicalDescription: 'Mogyo is a small, wiry character with sharp features and quick movements.',
        motivation: `# Wolf-Like Social Intelligence
Not a lone brute.
Instead:
 * understands group hierarchy instantly
 * reads moods quickly
 * knows who can be manipulated

# Arena Reputation

Nickname : "Mercury's Bastard"
Crowds love him because every fight feels theatrical.

* He speaks during combat.
* He taunts.
* He adapts.
* He turns survival into performance.

#Small Details That Make Him Feel Real
* picks up accents unconsciously
* twirls small objects when thinking
* sleeps lightly
* notices lies instantly
* smiles when angry
* constantly negotiates
* hates silence
* collects rumors like treasure
* secretly fears being forgotten more than death`,
        internalConflict: `# Love/Hate for the Romans
Coming from the north (Germanic, Celtic, or frontier tribal culture), add:
Distrust of Civilization
He sees Romans as:
* soft
* manipulative
* decadent
* obsessed with status

Yet he secretly admires:
* their engineering
* discipline
* organization

This inner contradiction bothers him.

#Free man vs Trained Spectacle

#Sincere self vs Constructed Persona

Over time he may not know which one is real anymore`,
        strengths: `# Fast Reflexes, Not Heavy Strength
He is not necessarily the biggest fighter.
Instead:
* quick footwork
* deceptive movement
* opportunistic attacks
* uses distractions constantly

He wins through confusion and timing.

A "talking fighter."

# Curious Even in Captivity

Mars in Gemini hates mental imprisonment more than physical pain.
Even enslaved, he asks questions:

* about Rome
* politics
* weapons
* gods
* accents
* trade routes

Some Romans mistake this for insolence.

Others find him fascinating.

# Oral Tradition Memory

He remembers stories, songs, and insults perfectly.
Could:

* recite tribal histories
* sing battle chants
* imitate voices from memory

This makes him ideal as an arena performer.`,
        weaknesses: `Cannot Stop Talking
Under stress he:
* jokes too much
* reveals information accidentally
* provokes powerful people
* His tongue creates enemies.

#Easily Bored
Routine enrages him.
Training repetition may cause:
* reckless risks
* rule breaking
* gambling
* sneaking into forbidden places



# Performs Emotion
As an entertainer-gladiator, he becomes frighteningly good at acting:
* can fake fear
* fake loyalty
* fake drunkenness
* fake submission

Nobody fully knows when he is sincere.

That makes masters distrust him.

# Split Identity
* northern tribesman vs Roman performer
* free man vs trained spectacle
* sincere self vs constructed persona

Over time he may not know which one is real anymore.`,
        characterArc: 'Mogyo learns to balance his cunning with empathy and responsibility.',
        dialogueStyle: 'Sarcastic and witty, often using humor to deflect serious situations.',
        backstory: 'Mogyo grew up in a chaotic environment, learning to rely on his wits to survive.',
        relationships: ['Trine 3 Air', 'Main Character'],
      },
      {
        id: '2',
        name: 'Hilsu',
        pronouns: ['Female'],
        groups: ['Major 2nd 5 in Fire'],
        otherNames: [],
        personality: `Neptune 9 degrees in Sagittarius & Moon 4 in Leo.
        # Quiet Visionary

She often seems distracted, because part of her mind is always elsewhere.
* watches flames too long
* listens to wind during conversations
* pauses before answering, as if hearing something distant

People believe she receives signs from the gods.

Maybe she does.

# Uses Soft Power

Her influence is indirect:
* whispers in noble ears
* alters ceremonial schedules
* hides information inside ritual language
* manipulates superstition

She survives through perception, not authority.

Most men underestimate her because she rarely speaks loudly.

That is exactly why she survives.`,
        physicalDescription: 'Hilsu is a young woman with an ethereal presence, often appearing lost in thought.',
        motivation: `# Compassion for Outsiders

Neptune in Sagittarius is drawn toward:
* foreigners
* captives
* wanderers
* people between worlds

The northern gladiator fascinates her immediately.

Not only physically — spiritually.

She sees:
* "a man stolen by fate"
* "someone the gods refused to let die"
perhaps even a divine omen tied to her own imprisonment`,
        internalConflict: `# Public vs Private Self
## Public:
*serene
*disciplined
*sacred
*composed
## Private:
*exhausted
*curious
*emotionally hungry
*secretly rebellious

#Most Important Inner Conflict

She does not know whether she is:
*chosen by the gods
or
*simply trapped by men using the gods.

The gladiator becomes dangerous because he awakens a third possibility:

That she could become neither sacred nor obedient —
but free.`,
        strengths: `# Paranormal & Mystical Traits
Dream-Sensitive

She experiences:
* prophetic dreams
* symbolic visions
* strange intuitions
* moments of dissociation during rituals

Whether supernatural or psychological is unclear.

Examples:
* dreams of wolves entering temples
* sees blood on someone before their death
* hears specific phrases repeatedly before disasters

# She Represents Meaning
To him, she becomes:
* protector
* interpreter of Roman power
* spiritual guide
* possible manipulator
* maybe the first Roman who truly sees him as human

She gives him:
* warnings
* political intelligence
* hidden allies
* symbolic protection charms

Possibly even arranged victories.`,
        weaknesses: `# Reads Meaning Into Coincidence
Neptune-Sagittarius minds connect patterns constantly.
She notices:
* birds flying in unusual formations
* repeated numbers
* broken statues
* eclipses
* odd behavior in sacrificial animals

To her, the world is full of hidden messages.

# Spiritual Escapism

Her danger:
she sometimes prefers visions to reality.

Possible flaws:
* idealizes the gladiator too much
* mistakes destiny for love
* believes the gods "will provide"
* delays practical action waiting for omens`,
        characterArc: `The gladiator becomes dangerous because he awakens a third possibility:
That she could become neither sacred nor obedient —
but free.`,
        dialogueStyle: 'Vague and poetic, often speaking in riddles or using metaphorical language.',
        backstory: 'Hilsu was born into a family of temple servants, trained from a young age in religious rituals and prophecy.',
        relationships: ['Major 2nd 5 in Fire'],
      },
    ],
    acts: [],
    scenes: [],
    sketches: [],
  },
  {
    id: '2',
    title: 'Homecoming',
    genre: 'SHORT',
    draftNumber: 1,
    lastEditedAt: '2026-05-11T10:00:00Z',
    createdAt: '2026-04-15T10:00:00Z',
    characters: [],
    acts: [],
    scenes: [],
    sketches: [],
  },
]
```

- [ ] **Step 6: Update `src/hooks/useProjects.test.ts`**

Fix `sampleProject` (add required fields), fix the title assertion on line 29, and verify the rest still compiles:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjects } from './useProjects'
import type { Project } from '../types/project'

const STORAGE_KEY = 'sw_projects'

const sampleProject: Project = {
  id: 'test-1',
  title: 'Test Script',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
}

describe('useProjects', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('initializes with mockProjects when localStorage is empty', () => {
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects.length).toBeGreaterThan(0)
    expect(result.current.projects[0].title).toBe('Never Been Known To Fail')
  })

  it('initializes with stored projects when localStorage has data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
    const { result } = renderHook(() => useProjects())
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].title).toBe('Test Script')
  })

  it('addProject adds to list and persists to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.addProject(sampleProject)
    })
    expect(result.current.projects).toHaveLength(1)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored[0].id).toBe('test-1')
  })

  it('deleteProject removes project and persists to localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
    const { result } = renderHook(() => useProjects())
    act(() => {
      result.current.deleteProject('test-1')
    })
    expect(result.current.projects).toHaveLength(0)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(0)
  })
})
```

- [ ] **Step 7: Run tests — verify all pass**

```
npx vitest run
```

Expected: all existing tests pass (no TypeScript errors, title assertion passes).

- [ ] **Step 8: Commit**

```bash
git add src/types/scene.ts src/types/act.ts src/types/sketch.ts src/types/project.ts src/data/mockProjects.ts src/hooks/useProjects.test.ts
git commit -m "feat: add scene/act/sketch types, update Project shape, fix test fixtures"
```

---

## Task 2: `updateProject` Hook + Tests

**Files:**
- Modify: `src/hooks/useProjects.ts`
- Modify: `src/hooks/useProjects.test.ts`

---

- [ ] **Step 1: Write the failing test**

Append to the `describe` block in `src/hooks/useProjects.test.ts`:

```ts
it('updateProject merges patch and persists to localStorage', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
  const { result } = renderHook(() => useProjects())
  act(() => {
    result.current.updateProject('test-1', { synopsis: 'A great script' })
  })
  expect(result.current.projects[0].synopsis).toBe('A great script')
  expect(result.current.projects[0].title).toBe('Test Script')
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
  expect(stored[0].synopsis).toBe('A great script')
})

it('updateProject does nothing when id is not found', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleProject]))
  const { result } = renderHook(() => useProjects())
  act(() => {
    result.current.updateProject('nonexistent', { synopsis: 'Should not appear' })
  })
  expect(result.current.projects[0].synopsis).toBeUndefined()
})
```

- [ ] **Step 2: Run tests — verify new tests fail**

```
npx vitest run src/hooks/useProjects.test.ts
```

Expected: FAIL — `result.current.updateProject is not a function`

- [ ] **Step 3: Implement `updateProject` in `src/hooks/useProjects.ts`**

Add the function and include it in the return value:

```ts
import { useState } from 'react'
import type { Project } from '../types/project'
import { mockProjects } from '../data/mockProjects'

const STORAGE_KEY = 'sw_projects'

function loadProjects(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return mockProjects
  try {
    return JSON.parse(raw) as Project[]
  } catch {
    return mockProjects
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadProjects)

  function addProject(project: Project) {
    setProjects(prev => {
      const next = [...prev, project]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function deleteProject(id: string) {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { projects, addProject, deleteProject, updateProject }
}
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/hooks/useProjects.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProjects.ts src/hooks/useProjects.test.ts
git commit -m "feat: add updateProject to useProjects hook"
```

---

## Task 3: SidePanel Component

**Files:**
- Create: `src/components/SidePanel.tsx`
- Create: `src/components/SidePanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/SidePanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SidePanel } from './SidePanel'

describe('SidePanel', () => {
  it('renders buttons for all 5 sections with title attributes', () => {
    render(<SidePanel activeSection="synopsis" onSectionChange={() => {}} />)
    expect(screen.getByTitle('Synopsis')).toBeDefined()
    expect(screen.getByTitle('Characters')).toBeDefined()
    expect(screen.getByTitle('Acts')).toBeDefined()
    expect(screen.getByTitle('Scenes')).toBeDefined()
    expect(screen.getByTitle('Sketches')).toBeDefined()
  })

  it('calls onSectionChange with the correct key when a button is clicked', () => {
    const onSectionChange = vi.fn()
    render(<SidePanel activeSection="synopsis" onSectionChange={onSectionChange} />)
    fireEvent.click(screen.getByTitle('Characters'))
    expect(onSectionChange).toHaveBeenCalledWith('characters')
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(onSectionChange).toHaveBeenCalledWith('scenes')
  })

  it('applies gold border to the active section button', () => {
    render(<SidePanel activeSection="acts" onSectionChange={() => {}} />)
    const actsBtn = screen.getByTitle('Acts')
    expect(actsBtn.className).toContain('border-l-[#c9a227]')
  })

  it('does not apply gold border to inactive section buttons', () => {
    render(<SidePanel activeSection="acts" onSectionChange={() => {}} />)
    const synopsisBtn = screen.getByTitle('Synopsis')
    expect(synopsisBtn.className).not.toContain('border-l-[#c9a227]')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/SidePanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/SidePanel.tsx`**

```tsx
export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes' | 'sketches'

type SectionItem = { key: SectionKey; icon: string; label: string }

const SECTIONS: SectionItem[] = [
  { key: 'synopsis', icon: '📋', label: 'Synopsis' },
  { key: 'characters', icon: '👤', label: 'Characters' },
  { key: 'acts', icon: '🎭', label: 'Acts' },
  { key: 'scenes', icon: '🎬', label: 'Scenes' },
  { key: 'sketches', icon: '✏️', label: 'Sketches' },
]

type Props = {
  activeSection: SectionKey
  onSectionChange: (s: SectionKey) => void
}

export function SidePanel({ activeSection, onSectionChange }: Props) {
  return (
    <nav className="w-12 flex flex-col bg-[#0d0d18] border-r border-[#1a1a2e]">
      {SECTIONS.map(({ key, icon, label }) => {
        const isActive = key === activeSection
        return (
          <button
            key={key}
            title={label}
            onClick={() => onSectionChange(key)}
            className={`flex items-center justify-center h-12 w-full text-lg border-l-2 transition-colors ${
              isActive
                ? 'border-l-[#c9a227] bg-[#14141f] text-[#c9a227]'
                : 'border-l-transparent text-[#555] hover:text-[#888] hover:bg-[#0f0f1a]'
            }`}
          >
            {icon}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/SidePanel.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SidePanel.tsx src/components/SidePanel.test.tsx
git commit -m "feat: add SidePanel component with section navigation"
```

---

## Task 4: SynopsisPanel

**Files:**
- Create: `src/components/panels/SynopsisPanel.tsx`
- Create: `src/components/panels/SynopsisPanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/panels/SynopsisPanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SynopsisPanel } from './SynopsisPanel'
import type { Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
  synopsis: 'Initial synopsis text',
}

describe('SynopsisPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('renders existing synopsis text in the textarea', () => {
    render(<SynopsisPanel project={baseProject} onUpdate={() => {}} />)
    expect(screen.getByDisplayValue('Initial synopsis text')).toBeDefined()
  })

  it('shows placeholder when synopsis is empty', () => {
    const { synopsis: _, ...rest } = baseProject
    render(<SynopsisPanel project={rest as Project} onUpdate={() => {}} />)
    expect(screen.getByPlaceholderText('Write your synopsis…')).toBeDefined()
  })

  it('debounces onUpdate by 300ms', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SynopsisPanel project={baseProject} onUpdate={onUpdate} />)
    const ta = screen.getByDisplayValue('Initial synopsis text')
    fireEvent.change(ta, { target: { value: 'New synopsis' } })
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(299)
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onUpdate).toHaveBeenCalledWith({ synopsis: 'New synopsis' })
  })

  it('fires only once if changed multiple times within 300ms', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SynopsisPanel project={baseProject} onUpdate={onUpdate} />)
    const ta = screen.getByDisplayValue('Initial synopsis text')
    fireEvent.change(ta, { target: { value: 'A' } })
    fireEvent.change(ta, { target: { value: 'AB' } })
    fireEvent.change(ta, { target: { value: 'ABC' } })
    vi.advanceTimersByTime(300)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledWith({ synopsis: 'ABC' })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/panels/SynopsisPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/panels/SynopsisPanel.tsx`**

```tsx
import { useState, useRef } from 'react'
import type { Project } from '../../types/project'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}

export function SynopsisPanel({ project, onUpdate }: Props) {
  const [value, setValue] = useState(project.synopsis ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setValue(val)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onUpdate({ synopsis: val }), 300)
  }

  return (
    <div className="flex-1 p-6 flex flex-col">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Write your synopsis…"
        className="flex-1 w-full bg-transparent text-[#c8c8d8] placeholder-[#444] resize-none outline-none text-sm leading-relaxed"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/panels/SynopsisPanel.test.tsx
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/SynopsisPanel.tsx src/components/panels/SynopsisPanel.test.tsx
git commit -m "feat: add SynopsisPanel with debounced textarea"
```

---

## Task 5: CharactersPanel

**Files:**
- Create: `src/components/panels/CharactersPanel.tsx`
- Create: `src/components/panels/CharactersPanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/panels/CharactersPanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CharactersPanel } from './CharactersPanel'
import type { Project } from '../../types/project'
import type { Character } from '../../types/character'

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
}

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [alice],
  acts: [],
  scenes: [],
  sketches: [],
}

describe('CharactersPanel', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders character names in the list', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Alice')).toBeDefined()
  })

  it('calls onSelectId with the character id when clicked', () => {
    const onSelectId = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onSelectId).toHaveBeenCalledWith('c1')
  })

  it('shows editor form fields when a character is selected', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId="c1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('Alice')).toBeDefined()
    expect(screen.getByDisplayValue('Driven')).toBeDefined()
  })

  it('shows placeholder prompt when no character is selected', () => {
    render(<CharactersPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select a character to edit')).toBeDefined()
  })

  it('calls onUpdate and onSelectId when Add Character is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ Add Character'))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.characters).toHaveLength(2)
    expect(patch.characters[1].name).toBe('')
    expect(onSelectId).toHaveBeenCalledWith(patch.characters[1].id)
  })

  it('calls onUpdate with filtered characters after delete confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('Delete character'))
    expect(onUpdate).toHaveBeenCalledWith({ characters: [] })
  })

  it('does not delete character when confirm is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('Delete character'))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('calls onUpdate with updated character when name input changes', () => {
    const onUpdate = vi.fn()
    render(<CharactersPanel project={baseProject} onUpdate={onUpdate} selectedId="c1" onSelectId={() => {}} />)
    const nameInput = screen.getByDisplayValue('Alice')
    fireEvent.change(nameInput, { target: { value: 'Alicia' } })
    expect(onUpdate).toHaveBeenCalledWith({
      characters: [{ ...alice, name: 'Alicia' }],
    })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/panels/CharactersPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/panels/CharactersPanel.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/panels/CharactersPanel.test.tsx
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/CharactersPanel.tsx src/components/panels/CharactersPanel.test.tsx
git commit -m "feat: add CharactersPanel with list and form editor"
```

---

## Task 6: ActsPanel

**Files:**
- Create: `src/components/panels/ActsPanel.tsx`
- Create: `src/components/panels/ActsPanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/panels/ActsPanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ActsPanel } from './ActsPanel'
import type { Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [
    { id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1'] },
    { id: 'a2', title: 'Act 2', order: 1, sceneIds: [] },
  ],
  scenes: [{ id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] }],
  sketches: [],
}

describe('ActsPanel', () => {
  it('renders act titles in list', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Act 1')).toBeDefined()
    expect(screen.getByText('Act 2')).toBeDefined()
  })

  it('renders scene sluglines beneath their act in list', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('INT. OFFICE - DAY')).toBeDefined()
  })

  it('calls onSelectId when an act is clicked', () => {
    const onSelectId = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('Act 1'))
    expect(onSelectId).toHaveBeenCalledWith('a1')
  })

  it('shows act title input when act is selected', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => {}} selectedId="a1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('Act 1')).toBeDefined()
  })

  it('shows placeholder when no act is selected', () => {
    render(<ActsPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select an act to edit')).toBeDefined()
  })

  it('calls onUpdate with new act when Add Act is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ Add Act'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts).toHaveLength(3)
    expect(onSelectId).toHaveBeenCalledWith(patch.acts[2].id)
  })

  it('calls onUpdate with updated title when act title changes', () => {
    const onUpdate = vi.fn()
    render(<ActsPanel project={baseProject} onUpdate={onUpdate} selectedId="a1" onSelectId={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('Act 1'), { target: { value: 'Act One' } })
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts.find((a: { id: string }) => a.id === 'a1').title).toBe('Act One')
  })

  it('moves scene up in sceneIds when up arrow clicked', () => {
    const twoSceneProject: Project = {
      ...baseProject,
      acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1', 's2'] }],
      scenes: [
        { id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] },
        { id: 's2', slugLine: 'EXT. STREET - NIGHT', actId: 'a1', order: 1, blocks: [] },
      ],
    }
    const onUpdate = vi.fn()
    render(<ActsPanel project={twoSceneProject} onUpdate={onUpdate} selectedId="a1" onSelectId={() => {}} />)
    const downButtons = screen.getAllByText('▼')
    fireEvent.click(downButtons[0])
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.acts[0].sceneIds).toEqual(['s2', 's1'])
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/panels/ActsPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/panels/ActsPanel.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/panels/ActsPanel.test.tsx
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/ActsPanel.tsx src/components/panels/ActsPanel.test.tsx
git commit -m "feat: add ActsPanel with scene reordering"
```

---

## Task 7: ScenesPanel

**Files:**
- Create: `src/components/panels/ScenesPanel.tsx`
- Create: `src/components/panels/ScenesPanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/panels/ScenesPanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenesPanel } from './ScenesPanel'
import type { Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: ['s1'] }],
  scenes: [{ id: 's1', slugLine: 'INT. OFFICE - DAY', actId: 'a1', order: 0, blocks: [] }],
  sketches: [],
}

describe('ScenesPanel', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders scene sluglines grouped under act labels', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('INT. OFFICE - DAY')).toBeDefined()
    expect(screen.getByText('Act 1')).toBeDefined()
  })

  it('calls onSelectId when a scene is clicked', () => {
    const onSelectId = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('INT. OFFICE - DAY'))
    expect(onSelectId).toHaveBeenCalledWith('s1')
  })

  it('shows scene editor with slug line input when scene is selected', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => {}} selectedId="s1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('INT. OFFICE - DAY')).toBeDefined()
  })

  it('shows placeholder when no scene is selected', () => {
    render(<ScenesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })

  it('adds action block when + Action is clicked', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('+ Action'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].blocks).toHaveLength(1)
    expect(patch.scenes[0].blocks[0].type).toBe('action')
  })

  it('adds dialogue block when + Dialogue is clicked', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => {}} />)
    fireEvent.click(screen.getByText('+ Dialogue'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].blocks).toHaveLength(1)
    expect(patch.scenes[0].blocks[0].type).toBe('dialogue')
  })

  it('updates slug line on input change', () => {
    const onUpdate = vi.fn()
    render(<ScenesPanel project={baseProject} onUpdate={onUpdate} selectedId="s1" onSelectId={() => {}} />)
    const slugInput = screen.getByDisplayValue('INT. OFFICE - DAY')
    fireEvent.change(slugInput, { target: { value: 'EXT. PARK - DAWN' } })
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes[0].slugLine).toBe('EXT. PARK - DAWN')
  })

  it('adds scene to existing act when only one act exists', () => {
    const emptyActProject: Project = {
      ...baseProject,
      acts: [{ id: 'a1', title: 'Act 1', order: 0, sceneIds: [] }],
      scenes: [],
    }
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<ScenesPanel project={emptyActProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ Add Scene'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.scenes).toHaveLength(1)
    expect(patch.acts[0].sceneIds).toHaveLength(1)
    expect(onSelectId).toHaveBeenCalledWith(patch.scenes[0].id)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/panels/ScenesPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/panels/ScenesPanel.tsx`**

```tsx
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
    const act = project.acts.find(a => a.id === actId)!
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
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/panels/ScenesPanel.test.tsx
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/ScenesPanel.tsx src/components/panels/ScenesPanel.test.tsx
git commit -m "feat: add ScenesPanel with screenplay block editor"
```

---

## Task 8: SketchesPanel

**Files:**
- Create: `src/components/panels/SketchesPanel.tsx`
- Create: `src/components/panels/SketchesPanel.test.tsx`

---

- [ ] **Step 1: Write the failing test in `src/components/panels/SketchesPanel.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { SketchesPanel } from './SketchesPanel'
import type { Project } from '../../types/project'

const baseProject: Project = {
  id: '1',
  title: 'Test',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [
    { id: 'sk1', text: 'First line of sketch\nSecond line' },
    { id: 'sk2', text: '' },
  ],
}

describe('SketchesPanel', () => {
  afterEach(() => vi.useRealTimers())

  it('renders sketch title from the first line of text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('First line of sketch')).toBeDefined()
  })

  it('renders "Untitled sketch" for empty sketch text', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Untitled sketch')).toBeDefined()
  })

  it('calls onSelectId when a sketch is clicked', () => {
    const onSelectId = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('First line of sketch'))
    expect(onSelectId).toHaveBeenCalledWith('sk1')
  })

  it('shows textarea with sketch text when sketch is selected', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId="sk1" onSelectId={() => {}} />)
    expect(screen.getByDisplayValue('First line of sketch\nSecond line')).toBeDefined()
  })

  it('shows placeholder when no sketch is selected', () => {
    render(<SketchesPanel project={baseProject} onUpdate={() => {}} selectedId={null} onSelectId={() => {}} />)
    expect(screen.getByText('Select a sketch to edit')).toBeDefined()
  })

  it('calls onUpdate and onSelectId when New Sketch is clicked', () => {
    const onUpdate = vi.fn()
    const onSelectId = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId={null} onSelectId={onSelectId} />)
    fireEvent.click(screen.getByText('+ New Sketch'))
    const patch = onUpdate.mock.calls[0][0]
    expect(patch.sketches).toHaveLength(3)
    expect(patch.sketches[2].text).toBe('')
    expect(onSelectId).toHaveBeenCalledWith(patch.sketches[2].id)
  })

  it('debounces onUpdate by 300ms on text change', () => {
    vi.useFakeTimers()
    const onUpdate = vi.fn()
    render(<SketchesPanel project={baseProject} onUpdate={onUpdate} selectedId="sk1" onSelectId={() => {}} />)
    fireEvent.change(screen.getByDisplayValue('First line of sketch\nSecond line'), {
      target: { value: 'New text' },
    })
    expect(onUpdate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(onUpdate).toHaveBeenCalledWith({
      sketches: [
        { id: 'sk1', text: 'New text' },
        { id: 'sk2', text: '' },
      ],
    })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/components/panels/SketchesPanel.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/panels/SketchesPanel.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests — verify all pass**

```
npx vitest run src/components/panels/SketchesPanel.test.tsx
```

Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/panels/SketchesPanel.tsx src/components/panels/SketchesPanel.test.tsx
git commit -m "feat: add SketchesPanel with debounced textarea"
```

---

## Task 9: SceneEditor Page + Wire Into App

**Files:**
- Create: `src/pages/SceneEditor.tsx`
- Create: `src/pages/SceneEditor.test.tsx`
- Modify: `src/App.tsx`
- Delete: `src/pages/ProjectPlaceholder.tsx`

---

- [ ] **Step 1: Write the failing test in `src/pages/SceneEditor.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SceneEditor } from './SceneEditor'
import * as useProjectsModule from '../hooks/useProjects'
import type { Project } from '../types/project'

vi.mock('../hooks/useProjects')

const mockProject: Project = {
  id: '1',
  title: 'Test Film',
  genre: 'FEATURE',
  draftNumber: 1,
  lastEditedAt: '2026-05-18T10:00:00Z',
  createdAt: '2026-05-18T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
  synopsis: 'A great film',
}

function renderWithRouter(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/project/${id}`]}>
      <Routes>
        <Route path="/project/:id" element={<SceneEditor />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SceneEditor', () => {
  beforeEach(() => {
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
  })

  it('renders project title in the header', () => {
    renderWithRouter('1')
    expect(screen.getByText('Test Film')).toBeDefined()
  })

  it('renders SCREENWRITER branding in header', () => {
    renderWithRouter('1')
    expect(screen.getByText('SCREENWRITER')).toBeDefined()
  })

  it('shows "Project not found" for an unknown id', () => {
    renderWithRouter('999')
    expect(screen.getByText('Project not found')).toBeDefined()
  })

  it('shows back link on not-found page', () => {
    renderWithRouter('999')
    expect(screen.getByText('← Back to projects')).toBeDefined()
  })

  it('renders SynopsisPanel by default', () => {
    renderWithRouter('1')
    expect(screen.getByPlaceholderText('Write your synopsis…')).toBeDefined()
  })

  it('switches to CharactersPanel when Characters icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Characters'))
    expect(screen.getByText('Select a character to edit')).toBeDefined()
  })

  it('switches to ActsPanel when Acts icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Acts'))
    expect(screen.getByText('Select an act to edit')).toBeDefined()
  })

  it('switches to ScenesPanel when Scenes icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })

  it('switches to SketchesPanel when Sketches icon is clicked', () => {
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Sketches'))
    expect(screen.getByText('Select a sketch to edit')).toBeDefined()
  })

  it('resets selectedId to null when switching sections', () => {
    const projectWithChar: Project = {
      ...mockProject,
      characters: [{
        id: 'c1', name: 'Alice', pronouns: [], groups: [], otherNames: [],
        personality: '', physicalDescription: '', motivation: '',
        internalConflict: '', strengths: '', weaknesses: '',
        characterArc: '', dialogueStyle: '', backstory: '', relationships: [],
      }],
    }
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [projectWithChar],
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    renderWithRouter('1')
    fireEvent.click(screen.getByTitle('Characters'))
    fireEvent.click(screen.getByText('Alice'))
    expect(screen.getByDisplayValue('Alice')).toBeDefined()
    fireEvent.click(screen.getByTitle('Scenes'))
    expect(screen.getByText('Select a scene to edit')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```
npx vitest run src/pages/SceneEditor.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/pages/SceneEditor.tsx`**

```tsx
import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { SidePanel } from '../components/SidePanel'
import type { SectionKey } from '../components/SidePanel'
import { SynopsisPanel } from '../components/panels/SynopsisPanel'
import { CharactersPanel } from '../components/panels/CharactersPanel'
import { ActsPanel } from '../components/panels/ActsPanel'
import { ScenesPanel } from '../components/panels/ScenesPanel'
import { SketchesPanel } from '../components/panels/SketchesPanel'
import type { Project } from '../types/project'

export function SceneEditor() {
  const { id } = useParams<{ id: string }>()
  const { projects, updateProject } = useProjects()
  const [activeSection, setActiveSection] = useState<SectionKey>('synopsis')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const project = projects.find(p => p.id === id)

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#888] mb-4">Project not found</p>
          <Link to="/" className="text-[#c9a227] text-sm hover:underline">
            ← Back to projects
          </Link>
        </div>
      </div>
    )
  }

  function onUpdate(patch: Partial<Project>) {
    updateProject(id!, patch)
  }

  function handleSectionChange(s: SectionKey) {
    setActiveSection(s)
    setSelectedId(null)
  }

  const panelProps = { project, onUpdate, selectedId, onSelectId: setSelectedId }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <header className="h-10 bg-[#08080f] border-b border-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="text-[#555] text-sm hover:text-[#888] transition-colors">←</Link>
        <span className="text-[#c9a227] text-xs font-bold tracking-widest">SCREENWRITER</span>
        <span className="text-[#555] text-sm">{project.title}</span>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <SidePanel activeSection={activeSection} onSectionChange={handleSectionChange} />
        {activeSection === 'synopsis' && <SynopsisPanel project={project} onUpdate={onUpdate} />}
        {activeSection === 'characters' && <CharactersPanel {...panelProps} />}
        {activeSection === 'acts' && <ActsPanel {...panelProps} />}
        {activeSection === 'scenes' && <ScenesPanel {...panelProps} />}
        {activeSection === 'sketches' && <SketchesPanel {...panelProps} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they fail (module found, hook not mocked yet)**

```
npx vitest run src/pages/SceneEditor.test.tsx
```

Expected: tests may fail for mock reasons — continue to step 5.

- [ ] **Step 5: Update `src/App.tsx` — swap ProjectPlaceholder for SceneEditor**

Replace the entire file:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { SceneEditor } from './pages/SceneEditor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:id" element={<SceneEditor />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 6: Delete `src/pages/ProjectPlaceholder.tsx`**

```
del src\pages\ProjectPlaceholder.tsx
```

Or on bash:

```bash
rm src/pages/ProjectPlaceholder.tsx
```

- [ ] **Step 7: Run all tests — verify everything passes**

```
npx vitest run
```

Expected: all tests PASS (previous tests from tasks 1–8 + new SceneEditor tests).

- [ ] **Step 8: Commit**

```bash
git add src/pages/SceneEditor.tsx src/pages/SceneEditor.test.tsx src/App.tsx
git rm src/pages/ProjectPlaceholder.tsx
git commit -m "feat: add SceneEditor page, wire into router, remove ProjectPlaceholder"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Three-panel layout: icon rail + list + editor | Tasks 3, 9 |
| SidePanel: 5 items, 48px rail, gold active border | Task 3 |
| SynopsisPanel: auto-resize textarea, 300ms debounce | Task 4 |
| CharactersPanel: list + form for all Character fields + add + delete | Task 5 |
| ActsPanel: list with sluglines, title editor, up/down reorder | Task 6 |
| ScenesPanel: grouped by act, slug line, action/dialogue blocks, ×delete | Task 7 |
| SketchesPanel: list with first-line title, full-height textarea, 300ms debounce | Task 8 |
| SceneEditor: useParams, not-found state, section switching resets selectedId | Task 9 |
| updateProject: shallow merge, persists to localStorage | Task 2 |
| New types: scene.ts, act.ts, sketch.ts | Task 1 |
| Project type: acts, scenes as Scene[], sketches | Task 1 |
| mockProjects updated | Task 1 |
| App.tsx: ProjectPlaceholder → SceneEditor | Task 9 |
| ProjectPlaceholder deleted | Task 9 |

**Placeholder scan:** No TBDs or "implement later" phrases found.

**Type consistency check:**
- `SectionKey` exported from `SidePanel.tsx`, imported in `SceneEditor.tsx` ✓
- `updateProject(id: string, patch: Partial<Project>)` matches all call sites ✓
- `Character` fields (`characterArc`, `dialogueStyle`, `physicalDescription`, `internalConflict`, `otherNames`) match exactly what's in `src/types/character.ts` ✓
- `SceneBlock` discriminated union used correctly in `ScenesPanel` ✓
- `Sketch.text` (not array) used consistently in `SketchesPanel` ✓
