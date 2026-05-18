# SceneEditor Design

**Date:** 2026-05-18
**Scope:** SceneEditor page + SidePanel + 5 section panels (Synopsis, Characters, Acts, Scenes, Sketches)

---

## Overview

The SceneEditor replaces the `ProjectPlaceholder` stub at `/project/:id`. It is a three-panel layout: a narrow icon-rail SidePanel on the left, a content list in the middle (contextual per section), and a full editor on the right. All changes auto-persist to localStorage — no save button.

---

## Layout

```
┌──────────────────────────────────────────────────────┐
│  TopBar (SCREENWRITER  ← project title)              │
├────────┬──────────────┬───────────────────────────────┤
│ Icon   │  List Panel  │  Editor Panel                 │
│ Rail   │  (section-   │  (selected item or section    │
│ 48px   │  specific)   │   content)                    │
│        │  ~200px      │  flex-1                       │
└────────┴──────────────┴───────────────────────────────┘
```

---

## Data Model Changes

### New: `src/types/scene.ts`

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
  slugLine: string      // e.g. "INT. OFFICE - DAY"
  actId: string
  order: number
  blocks: SceneBlock[]
}
```

### New: `src/types/act.ts`

```ts
export type Act = {
  id: string
  title: string         // e.g. "Act 1"
  order: number
  sceneIds: string[]
}
```

### New: `src/types/sketch.ts`

```ts
export type Sketch = {
  id: string
  text: string
}
```

### Updated: `src/types/project.ts`

Replace `scenes: string[]` with `scenes: Scene[]`. Add `acts: Act[]`. Replace `looseDialogues: string[]` and `looseNotes: string[]` with `sketches: Sketch[]`.

```ts
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

### Updated: `src/hooks/useProjects.ts`

Add `updateProject(id: string, patch: Partial<Project>): void` — merges patch into project, writes back to localStorage.

---

## File Structure

```
src/
  types/
    scene.ts                   ← new
    act.ts                     ← new
    sketch.ts                  ← new
    project.ts                 ← updated (scenes, acts, sketches)
  pages/
    SceneEditor.tsx            ← new (replaces ProjectPlaceholder)
  components/
    SidePanel.tsx              ← new
    panels/
      SynopsisPanel.tsx        ← new
      CharactersPanel.tsx      ← new
      ActsPanel.tsx            ← new
      ScenesPanel.tsx          ← new
      SketchesPanel.tsx        ← new
  hooks/
    useProjects.ts             ← updated (add updateProject)
  App.tsx                      ← updated (ProjectPlaceholder → SceneEditor)
```

`ProjectPlaceholder.tsx` is deleted.

---

## Component Specs

### `SceneEditor.tsx`

- Reads `id` from `useParams`
- Calls `useProjects()`, finds project by id
- If not found: renders "Project not found" with `← Back` link
- Local state: `activeSection: SectionKey`, `selectedId: string | null`
- `SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes' | 'sketches'`
- Default `activeSection`: `'synopsis'`
- Renders: `TopBar` (with back link to `/`) + `SidePanel` + active section panel
- Passes `onUpdate: (patch: Partial<Project>) => void` to all panels

### `SidePanel.tsx`

Props: `activeSection: SectionKey`, `onSectionChange: (s: SectionKey) => void`

Renders a 48px-wide dark rail (`bg-[#0d0d18]`, gold border-right) with 5 items:

| Key | Icon | Label |
|---|---|---|
| `synopsis` | 📋 | Synopsis |
| `characters` | 👤 | Characters |
| `acts` | 🎭 | Acts |
| `scenes` | 🎬 | Scenes |
| `sketches` | ✏️ | Sketches |

Active item: gold left border (`border-l-2 border-l-[#c9a227]`), lighter background (`bg-[#14141f]`). No internal state — fully controlled.

---

### `SynopsisPanel.tsx`

Props: `project: Project`, `onUpdate: (patch: Partial<Project>) => void`

- Single auto-resizing `<textarea>` for `project.synopsis`
- Placeholder: `"Write your synopsis…"`
- Calls `onUpdate({ synopsis: value })` debounced 300ms
- No list panel — full width

---

### `CharactersPanel.tsx`

Props: `project: Project`, `onUpdate: (patch: Partial<Project>) => void`, `selectedId: string | null`, `onSelectId: (id: string | null) => void`

**List panel (left ~200px):**
- Scrollable list of character names
- Active character: gold left border
- `+ Add Character` button at bottom — creates blank `Character` with `crypto.randomUUID()`, selects it

**Editor panel (right):**
- Form fields for all `Character` type properties: name, pronouns (comma-separated), groups, otherNames, personality, physicalDescription, motivation, internalConflict, strengths, weaknesses, characterArc, dialogueStyle, backstory, relationships
- Each field: labeled `<input>` or `<textarea>`
- Changes call `onUpdate({ characters: [...] })` immediately
- Delete button at top-right: confirm prompt, then removes character

---

### `ActsPanel.tsx`

Props: `project: Project`, `onUpdate: (patch: Partial<Project>) => void`, `selectedId: string | null`, `onSelectId: (id: string | null) => void`

**List panel:**
- Ordered list of acts by `act.order`
- Each act shows its title + collapsed list of scene sluglines
- `+ Add Act` at bottom
- Active act: gold left border

**Editor panel:**
- Act title input
- Ordered list of scenes belonging to this act (by `sceneIds`): each shows slugline + up/down arrow buttons to reorder within the act
- Clicking a scene in the list shows its slugline (read-only) in the editor panel — navigation to the Scenes panel happens via the SidePanel icon

---

### `ScenesPanel.tsx`

Props: `project: Project`, `onUpdate: (patch: Partial<Project>) => void`, `selectedId: string | null`, `onSelectId: (id: string | null) => void`

**List panel:**
- Scenes grouped under act labels, ordered by `scene.order`
- `+ Add Scene` button (prompts to pick act if multiple acts exist)
- Active scene: gold left border

**Editor panel:**
- `<input>` for `scene.slugLine` at top (placeholder: `"INT. LOCATION - DAY"`)
- Ordered list of `scene.blocks`:
  - **Action block:** textarea, dark background, full width
  - **Dialogue block:** character name input (uppercase, centered) + optional parenthetical input (italic, centered) + dialogue line textarea (centered, ~60% width)
- `+ Action` button appends `{ type: 'action', text: '' }`
- `+ Dialogue` button appends `{ type: 'dialogue', data: { character: '', line: '' } }`
- Each block has a `×` delete button on hover
- Changes call `onUpdate({ scenes: [...] })` immediately

---

### `SketchesPanel.tsx`

Props: `project: Project`, `onUpdate: (patch: Partial<Project>) => void`, `selectedId: string | null`, `onSelectId: (id: string | null) => void`

**List panel:**
- List of sketches — display title = first line of `sketch.text` (truncated), or `"Untitled sketch"` if empty
- `+ New Sketch` at bottom — appends `{ id: crypto.randomUUID(), text: '' }` to `project.sketches`, selects it
- Active sketch: gold left border

**Editor panel:**
- Single full-height `<textarea>` for `sketch.text`
- Changes call `onUpdate({ sketches: [...] })` debounced 300ms

---

## Data Flow

```
SceneEditor
  ├── useProjects() → { projects, updateProject }
  ├── project = projects.find(id)
  ├── onUpdate = (patch) => updateProject(id, patch)
  │
  ├── SidePanel(activeSection, onSectionChange)
  │
  └── <ActivePanel>(project, onUpdate, selectedId, onSelectId)
```

`updateProject` in the hook merges patch shallowly and persists the full project array to `localStorage`.

---

## Error State

If `project` is `undefined` (bad/stale URL), `SceneEditor` renders:

```
"Project not found"
← Back to projects   (navigates to /)
```

---

## Out of Scope

- Drag-and-drop reordering (use up/down arrows instead)
- Rich text formatting
- Undo/redo
- Export (PDF/FDX)
- Collaboration
