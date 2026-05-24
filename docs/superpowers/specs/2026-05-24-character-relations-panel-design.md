# CharacterRelationsPanel — Design Spec

Date: 2026-05-24

## Overview

A new panel in the SceneEditor that visualises all character-to-character relationships as a lower-triangle matrix (inspired by astrology's aspects table). Each cell represents a pair of characters and can hold multiple labelled relationship entries, each with its own description.

## Data Model

### Changes to `src/types/project.ts`

Add `id` and `label` to each relationship entry. Multiple entries can share the same character pair.

```ts
characterRelationships?: {
  id: string
  fromId: string
  toId: string
  label: string
  description: string
}[]
```

**Normalisation rule:** always store with `fromId < toId` (lexicographic string comparison). This makes pair lookup unambiguous. When creating or looking up relationships for a pair `(a, b)`, sort the two ids before comparing.

The existing `characterRelationships` field stub on `Project` is already present — this extends it with `id` and `label`.

## Architecture

### Files changed

| File | Change |
|------|--------|
| `src/types/settings.ts` | Add `'characterRelations'` to `SectionKey` union |
| `src/types/project.ts` | Add `id: string` and `label: string` to relationship tuple |
| `src/components/SidePanel.tsx` | Add `{ key: 'characterRelations', icon: '🕸️', label: 'Relations' }` to `SECTIONS` |
| `src/pages/SceneEditor.tsx` | Render `<CharacterRelationsPanel>` when `activeSection === 'characterRelations'` |
| `src/components/panels/CharacterRelationsPanel.tsx` | **New file** — panel + popover |

No new hooks, no new context. All data flows through the existing `project` / `onUpdate` prop pattern used by all other panels.

### Props

```ts
type Props = {
  project: Project
  onUpdate: (patch: Partial<Project>) => void
}
```

No `selectedId` / `onSelectId` needed — selection state is internal to the panel (which chip's popover is open).

## Component Structure

### `CharacterRelationsPanel`

Local state:
- `selectedEntry: { fromId: string; toId: string; id: string } | null` — which chip has its popover open. `null` = no popover. A special sentinel `{ fromId, toId, id: 'new' }` is used when the user clicks `+ add` or an empty cell, to open a blank creation popover.

Renders:
- A CSS grid with `characters.length + 1` columns (label column + one per character)
- Header row: character names
- For each row character `R` (index `i`): a row label, then cells for columns `0..i`
  - Column index `< i`: active cell (lower triangle)
  - Column index `=== i`: diagonal cell (greyed ×)
  - Column index `> i`: upper triangle (dark, non-interactive)

### Active cell rendering

```
[chip: rivals] [chip: ex-lovers]
+ add
```

- Each chip: `<button>` with the label text, click → open popover for that entry
- `+ add` link: click → open blank popover anchored to this cell
- If no entries for the pair: cell shows a centered `+` with a dashed border

### `RelationshipPopover`

Positioned absolutely relative to its anchor cell. Closes on save, cancel, or clicking outside (blur/outside-click handler).

Fields:
- **Label** — text input
- **Description** — auto-growing textarea (use existing `AutoTextarea` component)
- **Delete** button (only shown for existing entries, not new ones)
- **Cancel** / **Save** buttons

On save:
- New entry: append to `project.characterRelationships` with a fresh `crypto.randomUUID()`
- Existing entry: replace the matching entry by `id`
- Call `onUpdate({ characterRelationships: [...] })`

On delete:
- Filter the entry out of `project.characterRelationships`
- Call `onUpdate({ characterRelationships: [...] })`

## Visual Design

Follows the existing dark theme (`#0a0a14` canvas, `#13131f` cells, `#c9a227` gold accent).

- **Diagonal cells**: `#0d0d1a` background, `×` in `#222`
- **Upper triangle cells**: `#0a0a0f` background, `#111` border — visually recessed
- **Empty active cells**: `#0e0e1a` background, `1px dashed #1e1e30` border, centered `+` in `#2a2a3a`
- **Filled active cells**: `#13131f` background, `1px solid #1e1e30` border; hover → border brightens to `#c9a22760`
- **Label chips**: coloured text + tinted background + border; hover → border brightens to chip colour
- **Popover**: `#13131f` background, border in the chip's colour (or gold for new entries), `box-shadow` for depth

Chip colours are not tied to relationship type. A fixed palette is cycled by the entry's index in the pair's sorted-by-id list:

```ts
const CHIP_PALETTE = ['#c9a227', '#7b68ee', '#e74c3c', '#3498db', '#2ecc71', '#f39c12']
// colour = CHIP_PALETTE[indexWithinPair % CHIP_PALETTE.length]
```

## Edge Cases

- **0 or 1 characters**: matrix is empty or a single diagonal cell — show a subtle hint message: `"Add at least two characters to define relationships."`
- **Character deleted**: `onUpdate` for character deletion already filters `project.characters`; the panel filters `characterRelationships` to drop any entry where `fromId` or `toId` no longer exists in `project.characters`. This filter runs at render time (no migration needed).
- **Long character names**: column headers truncate with `text-overflow: ellipsis`; full name shown in `title` attribute for tooltip.
- **Many characters**: matrix scrolls horizontally and vertically within the panel's flex container.
- **Popover position**: always opens downward from the chip/cell. No upward-flip logic in v1.
