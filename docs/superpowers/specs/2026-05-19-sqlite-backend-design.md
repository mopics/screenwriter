# SQLite Backend Design

**Date:** 2026-05-19
**Goal:** Replace localStorage with a local Hono + better-sqlite3 backend. The app remains a personal tool — clone, install, run.

---

## Architecture

A Hono server runs on `:3001` alongside the Vite dev server on `:5173`. Vite proxies `/api/*` to `:3001` so the frontend never hard-codes a port. Both processes start with a single `npm run dev` command via `concurrently`. The server uses `tsx watch` for hot-reload.

### Directory structure

```
screenwriter/
  server/
    index.ts          # Hono app, mounts routes, listens on :3001
    db.ts             # better-sqlite3 init + schema creation
    seed.ts           # inserts demo data if projects table is empty
    routes/
      projects.ts     # all /api/projects routes
  src/                # existing frontend (unchanged structure)
  db.sqlite           # committed, pre-seeded with demo data
  package.json        # updated scripts
```

### Scripts

```json
"dev":        "concurrently \"npm run dev:client\" \"npm run dev:server\"",
"dev:client": "vite",
"dev:server": "tsx watch server/index.ts"
```

---

## Database

One table, created on server startup if it does not exist:

```sql
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,   -- full Project JSON blob
  updated_at TEXT NOT NULL    -- ISO timestamp, updated on every PUT
);
```

### Seed

`server/seed.ts` runs once at startup. If the table is empty it inserts the two projects from `src/data/mockProjects.ts`. After the first seed, `db.sqlite` is the sole source of truth. `mockProjects.ts` is retained as the seed source but no longer used by the running app.

---

## API Endpoints

All routes under `/api/projects`. All responses are `application/json`. Errors return `{ error: string }` with the appropriate HTTP status.

| Method   | Path                | Description                                          |
|----------|---------------------|------------------------------------------------------|
| `GET`    | `/api/projects`     | Returns all projects (parsed from JSON blobs)        |
| `GET`    | `/api/projects/:id` | Returns one project or 404                           |
| `POST`   | `/api/projects`     | Inserts a new project, body is the full Project JSON |
| `PUT`    | `/api/projects/:id` | Replaces a project's data blob, updates `updated_at` |
| `DELETE` | `/api/projects/:id` | Deletes a project or 404                             |

---

## Frontend Changes

### `src/hooks/useProjects.ts`

The only file with significant changes. `useState` + localStorage is replaced with `fetch` calls to the API. The hook gains `loading: boolean` and `error: string | null` states. All five methods (`addProject`, `deleteProject`, `updateProject`) become async and hit the API.

### Components

No component changes beyond `SceneEditor` and `Dashboard` receiving a simple loading state (spinner or dimmed view while the initial fetch resolves).

### Vite config

One proxy addition to `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

### Removed

`localStorage` usage is dropped entirely from `useProjects.ts`.

---

## New Dependencies

| Package | Role |
|---------|------|
| `hono` | HTTP server framework |
| `better-sqlite3` | SQLite driver (sync API, ideal for local tools) |
| `@types/better-sqlite3` | TypeScript types |
| `tsx` | TypeScript execution + watch for the server |
| `concurrently` | Run Vite + Hono in one `npm run dev` |

---

## Out of Scope

- Authentication (personal tool, no multi-user)
- Schema migrations (JSON blob avoids this entirely)
- Production build / packaging (out of current scope)
