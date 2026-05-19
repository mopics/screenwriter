# Collapsible Character Fields

## Overview

Textarea fields in `CharacterEditor` are collapsible. Each field remembers its own collapsed/expanded state, stored on the `Character` model so it persists per character across sessions.

## Data Model

Add one field to `Character` in `src/types/character.ts`:

```ts
expandedFields: string[]
```

- `[]` (empty array) = all textarea fields collapsed — the default for new characters
- Each entry is a `keyof Character` string for a textarea field that is currently expanded
- Persists through the existing `updateProject` save flow; no new API endpoints needed

`addCharacter` in `CharactersPanel` already constructs the full `Character` object — add `expandedFields: []` there.

## CharacterEditor Behavior

Only `type === 'textarea'` fields in the `fields` array get collapsible treatment. `type === 'input'` and `type === 'csv'` fields are unchanged.

**Collapsed state** (field key not in `expandedFields`):
- Label row shows `▶ LABEL` — the entire row is a clickable toggle button
- Below the label: a single truncated line of the current textarea value, or `— empty —` in muted text if blank
- No textarea rendered

**Expanded state** (field key in `expandedFields`):
- Label row shows `▼ LABEL` — still clickable to collapse
- Textarea renders normally below the label

**Toggle logic** — clicking the label row calls:
```ts
onChange({
  ...character,
  expandedFields: isExpanded
    ? character.expandedFields.filter(k => k !== key)
    : [...character.expandedFields, key],
})
```

This flows through `updateChar` → `onUpdate` → `updateProject` → DB, persisting the state.

## Scope

- Changes: `src/types/character.ts`, `src/components/panels/CharactersPanel.tsx`
- No changes to `ScenesPanel`, `SynopsisPanel`, `useProjects`, or any API routes
- The DB schema stores `Character` as JSON inside the project blob, so no migration is needed
