# SQLite Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the localStorage-based `useProjects` hook with a Hono + better-sqlite3 local server, keeping the app startable with a single `npm run dev`.

**Architecture:** A Hono server (`server/`) runs on `:3001` alongside Vite (`:5173`). Vite proxies `/api/*` to `:3001`. The frontend hook replaces `localStorage` calls with `fetch` calls. The SQLite DB is seeded from the existing mock data and committed to the repo.

**Tech Stack:** React 19, TypeScript, Vite, Hono, `@hono/node-server`, `better-sqlite3`, `tsx`, `concurrently`, Vitest, React Testing Library.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `server/db.ts` | Open SQLite, create schema |
| Create | `server/seed.ts` | Insert demo data if table is empty |
| Create | `server/routes/projects.ts` | Five CRUD route handlers |
| Create | `server/index.ts` | Hono app entry point, runs seed, listens on :3001 |
| Create | `tsconfig.server.json` | TypeScript config for `server/` |
| Modify | `vite.config.ts` | Add `/api` proxy |
| Modify | `package.json` | New scripts + new deps |
| Modify | `src/hooks/useProjects.ts` | Replace localStorage with fetch, add loading/error |
| Modify | `src/hooks/useProjects.test.ts` | Rewrite tests using fetch mocks |
| Modify | `src/pages/Dashboard.tsx` | Await addProject, add loading guard |
| Modify | `src/pages/Dashboard.test.tsx` | Mock useProjects, remove localStorage refs |
| Modify | `src/pages/SceneEditor.tsx` | Add loading guard |
| Modify | `src/pages/SceneEditor.test.tsx` | Add loading/error to mock return value |
| Commit | `db.sqlite` | Pre-seeded demo database |

---

## Task 1: Install packages + update config

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `tsconfig.server.json`

---

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install hono @hono/node-server better-sqlite3
```

Expected: packages appear in `node_modules/`, `package.json` dependencies updated.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D @types/better-sqlite3 tsx concurrently
```

- [ ] **Step 3: Update scripts in `package.json`**

Replace the `"dev"` script and add two new ones (keep all other scripts unchanged):

```json
"dev":        "concurrently -n client,server -c cyan,yellow \"npm run dev:client\" \"npm run dev:server\"",
"dev:client": "vite",
"dev:server": "tsx watch server/index.ts",
```

- [ ] **Step 4: Update `vite.config.ts` — add proxy**

Replace the entire file:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 5: Create `tsconfig.server.json`**

```json
{
  "compilerOptions": {
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": true
  },
  "include": ["server"]
}
```

- [ ] **Step 6: Verify existing tests still pass**

```bash
npx vitest run
```

Expected: all 85 tests pass (config changes don't break tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.server.json
git commit -m "chore: install hono, better-sqlite3, tsx, concurrently; add dev scripts and vite proxy"
```

---

## Task 2: `server/db.ts` — SQLite init

**Files:**
- Create: `server/db.ts`

---

- [ ] **Step 1: Create `server/db.ts`**

```ts
import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'db.sqlite')

export const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)
```

- [ ] **Step 2: Commit**

```bash
git add server/db.ts
git commit -m "feat: add SQLite db module with schema"
```

---

## Task 3: `server/seed.ts` — Demo data

**Files:**
- Create: `server/seed.ts`

---

- [ ] **Step 1: Create `server/seed.ts`**

```ts
import { db } from './db'
import { mockProjects } from '../src/data/mockProjects'

export function seed() {
  const row = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number }
  if (row.count > 0) return

  const insert = db.prepare(
    'INSERT INTO projects (id, data, updated_at) VALUES (?, ?, ?)'
  )
  for (const project of mockProjects) {
    insert.run(project.id, JSON.stringify(project), new Date().toISOString())
  }
  console.log(`[seed] Inserted ${mockProjects.length} demo projects`)
}
```

- [ ] **Step 2: Commit**

```bash
git add server/seed.ts
git commit -m "feat: add seed function for demo projects"
```

---

## Task 4: `server/routes/projects.ts` — CRUD routes

**Files:**
- Create: `server/routes/projects.ts`

---

- [ ] **Step 1: Create `server/routes/projects.ts`**

```ts
import { Hono } from 'hono'
import { db } from '../db'

type Row = { data: string }

export const projectsRoutes = new Hono()

projectsRoutes.get('/', (c) => {
  const rows = db.prepare('SELECT data FROM projects').all() as Row[]
  return c.json(rows.map(r => JSON.parse(r.data)))
})

projectsRoutes.get('/:id', (c) => {
  const row = db.prepare('SELECT data FROM projects WHERE id = ?')
    .get(c.req.param('id')) as Row | undefined
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(JSON.parse(row.data))
})

projectsRoutes.post('/', async (c) => {
  const project = await c.req.json()
  db.prepare('INSERT INTO projects (id, data, updated_at) VALUES (?, ?, ?)').run(
    project.id,
    JSON.stringify(project),
    new Date().toISOString()
  )
  return c.json(project, 201)
})

projectsRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const project = await c.req.json()
  const result = db.prepare(
    'UPDATE projects SET data = ?, updated_at = ? WHERE id = ?'
  ).run(JSON.stringify(project), new Date().toISOString(), id)
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
  return c.json(project)
})

projectsRoutes.delete('/:id', (c) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?')
    .run(c.req.param('id'))
  if (result.changes === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/projects.ts
git commit -m "feat: add projects CRUD routes"
```

---

## Task 5: `server/index.ts` — Entry point + manual test

**Files:**
- Create: `server/index.ts`

---

- [ ] **Step 1: Create `server/index.ts`**

```ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { projectsRoutes } from './routes/projects'
import { seed } from './seed'

seed()

const app = new Hono()
app.use('*', cors())
app.route('/api/projects', projectsRoutes)

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server running on http://localhost:3001')
})
```

- [ ] **Step 2: Start the server and verify it seeds**

```bash
npm run dev:server
```

Expected terminal output:
```
[seed] Inserted 2 demo projects
Server running on http://localhost:3001
```

- [ ] **Step 3: Verify routes respond (open a second terminal)**

```bash
curl http://localhost:3001/api/projects
```

Expected: JSON array with two projects (`Never Been Known To Fail`, `Homecoming`).

```bash
curl http://localhost:3001/api/projects/1
```

Expected: JSON object for project id `1`.

```bash
curl http://localhost:3001/api/projects/999
```

Expected: `{"error":"Not found"}` with status 404.

- [ ] **Step 4: Stop the server (Ctrl+C)**

- [ ] **Step 5: Commit**

```bash
git add server/index.ts
git commit -m "feat: add Hono server entry point"
```

---

## Task 6: Rewrite `useProjects` — fetch + tests

**Files:**
- Modify: `src/hooks/useProjects.ts`
- Modify: `src/hooks/useProjects.test.ts`

---

- [ ] **Step 1: Replace `src/hooks/useProjects.test.ts` entirely**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProjects } from './useProjects'
import type { Project } from '../types/project'

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

function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  })
}

describe('useProjects', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with loading=true then fetches projects on mount', async () => {
    global.fetch = mockFetch([sampleProject])
    const { result } = renderHook(() => useProjects())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toHaveLength(1)
    expect(result.current.projects[0].title).toBe('Test Script')
    expect(fetch).toHaveBeenCalledWith('/api/projects')
  })

  it('sets error when initial fetch fails', async () => {
    global.fetch = mockFetch(null, false)
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load projects')
    expect(result.current.projects).toHaveLength(0)
  })

  it('addProject POSTs to API and appends to state', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(sampleProject) })
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.addProject(sampleProject) })
    expect(result.current.projects).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'POST' }))
  })

  it('deleteProject DELETEs from API and removes from state', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([sampleProject]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true }) })
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.deleteProject('test-1') })
    expect(result.current.projects).toHaveLength(0)
    expect(fetch).toHaveBeenCalledWith('/api/projects/test-1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('updateProject PUTs merged project and updates state', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([sampleProject]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...sampleProject, synopsis: 'Great script' }) })
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.updateProject('test-1', { synopsis: 'Great script' }) })
    expect(result.current.projects[0].synopsis).toBe('Great script')
    expect(result.current.projects[0].title).toBe('Test Script')
  })

  it('updateProject does nothing when id not found', async () => {
    global.fetch = mockFetch([sampleProject])
    const { result } = renderHook(() => useProjects())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => { await result.current.updateProject('nonexistent', { synopsis: 'Nope' }) })
    expect(result.current.projects[0].synopsis).toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the new tests — verify they fail**

```bash
npx vitest run src/hooks/useProjects.test.ts
```

Expected: FAIL — `result.current.loading` is `undefined`, fetch is not called.

- [ ] **Step 3: Replace `src/hooks/useProjects.ts` entirely**

```ts
import { useState, useEffect } from 'react'
import type { Project } from '../types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load projects')
        return r.json() as Promise<Project[]>
      })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError((err as Error).message)
        setLoading(false)
      })
  }, [])

  async function addProject(project: Project) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    })
    if (!res.ok) return
    setProjects(prev => [...prev, project])
  }

  async function deleteProject(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const project = projects.find(p => p.id === id)
    if (!project) return
    const updated = { ...project, ...patch }
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) return
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
  }

  return { projects, loading, error, addProject, deleteProject, updateProject }
}
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
npx vitest run src/hooks/useProjects.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProjects.ts src/hooks/useProjects.test.ts
git commit -m "feat: replace localStorage with fetch API in useProjects"
```

---

## Task 7: Loading states + fix Dashboard/SceneEditor tests

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Dashboard.test.tsx`
- Modify: `src/pages/SceneEditor.tsx`
- Modify: `src/pages/SceneEditor.test.tsx`

---

- [ ] **Step 1: Replace `src/pages/Dashboard.test.tsx` entirely**

The Dashboard tests currently rely on `localStorage` + the real `useProjects` hook. Switch them to mock `useProjects` (matching the pattern already used in `SceneEditor.test.tsx`):

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import * as useProjectsModule from '../hooks/useProjects'
import type { Project } from '../types/project'

vi.mock('../hooks/useProjects')

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockProject: Project = {
  id: '1',
  title: 'Never Been Known To Fail',
  genre: 'FEATURE',
  draftNumber: 3,
  lastEditedAt: '2026-05-16T10:00:00Z',
  createdAt: '2026-03-01T10:00:00Z',
  characters: [],
  acts: [],
  scenes: [],
  sketches: [],
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      loading: false,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
  })

  it('renders the SCREENWRITER wordmark', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('SCREENWRITER')).toBeInTheDocument()
  })

  it('renders the MY PROJECTS section label', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText(/my projects/i)).toBeInTheDocument()
  })

  it('renders project cards from hook data', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Never Been Known To Fail')).toBeInTheDocument()
  })

  it('shows loading state while loading', () => {
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [],
      loading: true,
      error: null,
      addProject: vi.fn(),
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('opens modal when New Project button is clicked', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(screen.getByPlaceholderText('Untitled Script')).toBeInTheDocument()
  })

  it('closes modal when Cancel is clicked', async () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByPlaceholderText('Untitled Script')).not.toBeInTheDocument()
  })

  it('calls addProject and navigates on create', async () => {
    const addProject = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useProjectsModule.useProjects).mockReturnValue({
      projects: [mockProject],
      loading: false,
      error: null,
      addProject,
      deleteProject: vi.fn(),
      updateProject: vi.fn(),
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    await userEvent.type(screen.getByPlaceholderText('Untitled Script'), 'New Film')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(addProject).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/project\//))
  })
})
```

- [ ] **Step 2: Run Dashboard tests — verify they fail**

```bash
npx vitest run src/pages/Dashboard.test.tsx
```

Expected: FAIL — `loading` is not on the return type, `Loading…` text not in DOM.

- [ ] **Step 3: Update `src/pages/SceneEditor.test.tsx` — add `loading` and `error` to mock**

In `SceneEditor.test.tsx`, every `vi.mocked(useProjectsModule.useProjects).mockReturnValue(...)` call is missing `loading` and `error`. There are two such calls in the file. Update them both to include:

```ts
loading: false,
error: null,
```

The first mock (in `beforeEach`):
```ts
vi.mocked(useProjectsModule.useProjects).mockReturnValue({
  projects: [mockProject],
  loading: false,
  error: null,
  addProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
})
```

The second mock (inside the last test, `it('resets selectedId...')`):
```ts
vi.mocked(useProjectsModule.useProjects).mockReturnValue({
  projects: [projectWithChar],
  loading: false,
  error: null,
  addProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
})
```

- [ ] **Step 4: Update `src/pages/Dashboard.tsx` — add loading guard and async handleCreate**

Replace the entire file:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopBar } from '../components/TopBar'
import { ProjectGrid } from '../components/ProjectGrid'
import { NewProjectModal } from '../components/NewProjectModal'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../types/project'

export function Dashboard() {
  const { projects, loading, addProject } = useProjects()
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  async function handleCreate(project: Project) {
    await addProject(project)
    setModalOpen(false)
    navigate(`/project/${project.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-[#555] text-sm tracking-widest">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <TopBar onNewProject={() => setModalOpen(true)} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-[#555] text-xs tracking-[0.2em] uppercase mb-4">My Projects</p>
        <ProjectGrid projects={projects} onNewProject={() => setModalOpen(true)} />
      </main>
      {modalOpen && (
        <NewProjectModal
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Update `src/pages/SceneEditor.tsx` — add loading guard**

Add the loading guard immediately after the `projects.find` line. Replace the existing not-found block region:

```tsx
  const { projects, loading, updateProject } = useProjects()
```

(change `const { projects, updateProject }` to `const { projects, loading, updateProject }`)

Then add a loading guard before the not-found check:

```tsx
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-[#555] text-sm tracking-widest">Loading…</p>
      </div>
    )
  }
```

The full updated `src/pages/SceneEditor.tsx`:

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

- [ ] **Step 6: Run all tests — verify everything passes**

```bash
npx vitest run
```

Expected: all tests pass (Dashboard tests now mock useProjects, SceneEditor tests have loading in mock).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx src/pages/SceneEditor.tsx src/pages/SceneEditor.test.tsx
git commit -m "feat: add loading states to Dashboard and SceneEditor, mock useProjects in Dashboard tests"
```

---

## Task 8: Seed `db.sqlite` + commit

**Files:**
- Commit: `db.sqlite`

---

- [ ] **Step 1: Start the server to generate and seed `db.sqlite`**

```bash
npm run dev:server
```

Expected output:
```
[seed] Inserted 2 demo projects
Server running on http://localhost:3001
```

- [ ] **Step 2: Stop the server (Ctrl+C)**

- [ ] **Step 3: Verify `db.sqlite` exists in the repo root**

```bash
ls db.sqlite
```

Expected: file present.

- [ ] **Step 4: Commit `db.sqlite`**

```bash
git add db.sqlite
git commit -m "chore: add seeded db.sqlite with demo projects"
```

- [ ] **Step 5: Full end-to-end smoke test**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Verify:
- Dashboard loads and shows "Never Been Known To Fail" and "Homecoming"
- Clicking a project opens SceneEditor
- Editing the synopsis and refreshing the page preserves the change (data is in SQLite, not localStorage)

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|-----------------|------|
| Hono server on :3001 | Task 5 |
| `concurrently` single `npm run dev` | Task 1 |
| Vite proxy `/api` → `:3001` | Task 1 |
| `db.sqlite` committed with demo data | Task 8 |
| JSON blob schema | Task 2 |
| Seed from mockProjects if table empty | Task 3 |
| GET /api/projects | Task 4 |
| GET /api/projects/:id | Task 4 |
| POST /api/projects | Task 4 |
| PUT /api/projects/:id | Task 4 |
| DELETE /api/projects/:id | Task 4 |
| useProjects replaces localStorage with fetch | Task 6 |
| loading + error states on hook | Task 6 |
| Loading guard on Dashboard | Task 7 |
| Loading guard on SceneEditor | Task 7 |
| Dashboard tests updated | Task 7 |
| SceneEditor tests updated | Task 7 |

**Placeholder scan:** None found.

**Type consistency:**
- `useProjects` returns `{ projects, loading, error, addProject, deleteProject, updateProject }` — all consumers updated in Task 7
- `addProject` is now `async` — `handleCreate` in Dashboard awaits it in Task 7
- `updateProject` signature unchanged: `(id: string, patch: Partial<Project>) => Promise<void>` — all call sites unchanged
