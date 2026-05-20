# Sketches Right Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Sketches tab from the left nav and make SketchesPanel a permanent, resizable right panel always visible alongside the active section.

**Architecture:** Extend `useResize` with a `direction` param so right-edge panels can resize from the left. Remove 'sketches' from SidePanel's nav. Rework SketchesPanel's outer shell to a fixed-width right panel. Update SceneEditor to always render SketchesPanel on the far right.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vite (`npm run build` for type-check)

---

### Task 1: Add `direction` param to `useResize`

**Files:**
- Modify: `src/hooks/useResize.ts`

- [ ] **Step 1: Update `useResize` to accept a `direction` param**

Replace the entire file with:

```ts
import { useState, useCallback } from 'react'

export function useResize(
  initialWidth: number,
  min = 120,
  max = 480,
  direction: 'right' | 'left' = 'right',
) {
  const [width, setWidth] = useState(initialWidth)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = width

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      const newWidth = direction === 'left'
        ? Math.max(min, Math.min(max, startWidth - delta))
        : Math.max(min, Math.min(max, startWidth + delta))
      setWidth(newWidth)
    }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [width, min, max, direction])

  const dragHandleProps = {
    onMouseDown: startResize,
    className: direction === 'left'
      ? 'absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#c9a227]/30 transition-colors'
      : 'absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#c9a227]/30 transition-colors',
  } as const

  return { width, dragHandleProps }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -30
```

Expected: no TypeScript errors (build may warn about other things, ignore non-TS output).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useResize.ts
git commit -m "feat: add direction param to useResize for right-panel resize"
```

---

### Task 2: Remove Sketches from SidePanel nav

**Files:**
- Modify: `src/components/SidePanel.tsx`

- [ ] **Step 1: Remove 'sketches' from SECTIONS and SectionKey**

Replace the file contents with:

```tsx
import { useResize } from '../hooks/useResize'

export type SectionKey = 'synopsis' | 'characters' | 'acts' | 'scenes'

type SectionItem = { key: SectionKey; icon: string; label: string }

const SECTIONS: SectionItem[] = [
  { key: 'synopsis', icon: '📋', label: 'Synopsis' },
  { key: 'characters', icon: '🎭', label: 'Characters' },
  { key: 'acts', icon: '🗂️', label: 'Acts' },
  { key: 'scenes', icon: '🎬', label: 'Scenes' },
]

type Props = {
  activeSection: SectionKey
  onSectionChange: (s: SectionKey) => void
}

export function SidePanel({ activeSection, onSectionChange }: Props) {
  const { width, dragHandleProps } = useResize(80, 48, 240)

  return (
    <nav className="relative flex flex-col shrink-0 bg-panel border-r border-[#1a1a2e]" style={{ width }}>
      {SECTIONS.map(({ key, icon, label }) => {
        const isActive = key === activeSection
        return (
          <button
            key={key}
            title={label}
            onClick={() => onSectionChange(key)}
            className={`flex items-center justify-center h-14 w-full text-xl border-l-2 transition-colors ${isActive
              ? 'border-l-[#c9a227] bg-panelSelect text-[#c9a227]'
              : 'border-l-transparent text-[#555] hover:text-[#888] hover:bg-panelHover'
              }`}
          >
            {icon}
          </button>
        )
      })}
      <div {...dragHandleProps} />
    </nav>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -30
```

Expected: TypeScript error on SceneEditor because `SectionKey` no longer includes `'sketches'`. That's expected — it gets fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/components/SidePanel.tsx
git commit -m "feat: remove Sketches from SidePanel nav"
```

---

### Task 3: Rework SketchesPanel as a permanent right panel

**Files:**
- Modify: `src/components/panels/SketchesPanel.tsx`

- [ ] **Step 1: Update SketchesPanel outer shell**

Replace the file contents with:

```tsx
import { useState, useRef } from 'react'
import type { Project } from '../../types/project'
import type { Sketch } from '../../types/sketch'
import { useResize } from '../../hooks/useResize'

type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
}

export function SketchesPanel({ project, onUpdate, selectedId, onSelectId }: Props) {
  const { width: outerWidth, dragHandleProps: outerDragHandleProps } = useResize(360, 200, 600, 'left')
  const { width: listWidth, dragHandleProps: listDragHandleProps } = useResize(208)
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
    <div
      className="relative shrink-0 flex overflow-hidden border-l border-[#1a1a2e]"
      style={{ width: outerWidth }}
    >
      <div {...outerDragHandleProps} />
      <div className="relative shrink-0 border-r border-[#1a1a2e] flex flex-col overflow-hidden" style={{ width: listWidth }}>
        <div className="flex-1 overflow-y-auto">
          {project.sketches.map(sketch => (
            <button
              key={sketch.id}
              onClick={() => onSelectId(sketch.id)}
              className={`w-full text-left px-4 py-2 text-sm border-l-2 transition-colors ${
                sketch.id === selectedId
                  ? 'border-l-[#c9a227] text-[#c8c8d8] bg-panelSelect'
                  : 'border-l-transparent text-[#888] hover:text-[#c8c8d8] hover:bg-panelHover'
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
        <div {...listDragHandleProps} />
      </div>
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
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

- [ ] **Step 2: Type-check**

```bash
npm run build 2>&1 | head -30
```

Expected: still one TypeScript error on SceneEditor (SectionKey issue from Task 2). SketchesPanel itself should be clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/panels/SketchesPanel.tsx
git commit -m "feat: rework SketchesPanel as permanent right panel with left-edge resize"
```

---

### Task 4: Update SceneEditor layout

**Files:**
- Modify: `src/pages/SceneEditor.tsx`

- [ ] **Step 1: Update SceneEditor to always render SketchesPanel**

Replace the file contents with:

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
  const { projects, loading, updateProject } = useProjects()
  const [activeSection, setActiveSection] = useState<SectionKey>('synopsis')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-[#555] text-sm tracking-widest">Loading…</p>
      </div>
    )
  }

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
    <div className="h-screen overflow-hidden bg-panel flex flex-col">
      <header className="h-10 bg-panel border-b border-[#1a1a2e] flex items-center px-4 gap-4 shrink-0">
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
        <SketchesPanel {...panelProps} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check — expect clean**

```bash
npm run build 2>&1 | head -30
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Manual verification**

Start the dev server:

```bash
npm run dev
```

Open the app in a browser. Verify:
1. The left nav shows 4 icons only (no Sketches icon).
2. The Sketches panel is always visible on the far right — with a sketch list on the left and an editor area on the right.
3. Dragging the left edge of the Sketches panel resizes it (expands left, shrinks right).
4. Dragging the divider between the sketch list and editor resizes the internal columns.
5. Switching between Synopsis / Characters / Acts / Scenes in the left nav keeps the Sketches panel visible throughout.
6. Creating a new sketch and typing in it saves correctly.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SceneEditor.tsx
git commit -m "feat: move SketchesPanel to permanent right panel, remove from nav"
```
