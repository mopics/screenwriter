# Sketches Right Panel — Design Spec

**Date:** 2026-05-20

## Overview

Move `SketchesPanel` from a tab in the left nav to a permanent, always-visible right panel. Remove the Sketches icon button from `SidePanel`. The sketches panel is resizable from its left edge and keeps its existing two-column internal layout (list + editor).

## Layout

```
[Left Nav Icon Bar] | [Active Panel (flex-1)] | [Sketches Right Panel (fixed width)]
```

The active panel continues to fill all remaining horizontal space. The sketches panel sits at the far right, always rendered regardless of which section is active in the left nav.

## Changes

### `useResize` (`src/hooks/useResize.ts`)

Add a fourth parameter `direction: 'right' | 'left'` (default `'right'`).

- When `'left'`: negate the delta (`startWidth - delta`), position the drag handle on the left edge (`left-0` instead of `right-0`).
- All existing callers are unaffected (they rely on the default).

### `SidePanel` (`src/components/SidePanel.tsx`)

- Remove `{ key: 'sketches', icon: '✏️', label: 'Sketches' }` from the `SECTIONS` array.
- Remove `'sketches'` from the `SectionKey` union type.

### `SceneEditor` (`src/pages/SceneEditor.tsx`)

- Remove the `activeSection === 'sketches'` conditional render of `SketchesPanel`.
- Always render `<SketchesPanel {...panelProps} />` as the last child of the flex row, to the right of the active panel.
- No change to `selectedId` / `onSelectId` prop wiring.

### `SketchesPanel` (`src/components/panels/SketchesPanel.tsx`)

- Add an outer `useResize(360, 200, 600, 'left')` call for the right-panel shell.
- Change the outer `<div>` from `flex flex-1 overflow-hidden` to a `shrink-0` fixed-width panel with:
  - `border-l border-[#1a1a2e]` (left border matching the app's separator style)
  - `style={{ width }}` from the new outer `useResize`
  - A left-edge drag handle from the new `dragHandleProps`
- The internal two-column structure (resizable list column + editor area) is unchanged.

## Dimensions

| Panel shell | Initial | Min | Max |
|---|---|---|---|
| Sketches right panel | 360px | 200px | 600px |

## Out of scope

- Collapse/expand toggle (noted as future work by user)
- Persisting panel width across sessions
