# YapDraw — Version Control Redesign

## Goal

Replace the current slide-in panel with a compact, minimalistic dropdown. Each version entry exposes exactly two explicit actions: **View** and **Restore**. Restoring plays a brief canvas flash animation. The trigger in the top bar stays small and unobtrusive.

---

## Problems With Current Design

| Issue | Detail |
|-------|--------|
| Too dominant | 300px slide-in panel covers the canvas |
| Hover-dependent actions | View/Restore/Delete only appear on hover — hard to discover |
| Cluttered per-row | Label editing, delete button, and tag affordance in each row |
| No feedback on restore | Diagram silently swaps with no visual confirmation |
| VersionHistoryPanel was never wired | The panel existed but wasn't mounted in page.tsx until recently |

---

## New Design Spec

### Trigger
- Small clock icon (`IconHistory`) in `EditorTopBar`, right side
- No label, no badge — just the icon
- Click toggles the dropdown open/closed
- Clicking outside or pressing Escape closes it

### Dropdown
- **Position:** fixed, top-12 (below the 48px top bar), right-4
- **Width:** 272px
- **Max height:** 380px with internal scroll
- **Background:** `zinc-900` with `zinc-800` border and `shadow-2xl`
- **Border radius:** `rounded-xl`
- **No animation on open** — just appears; keeps it snappy and light

### Version Row
Each row shows:
```
[dot] v{n}  ·  {relative time}  ·  {element count}     [👁 View] [↩ Restore]
```
- The dot is filled blue for current, grey for others, violet for the one being previewed
- `View` and `Restore` buttons are **always visible** (not hover-only)
- Buttons are small icon-only at rest, expand to icon + label on hover of the row
- No label editing, no delete, no tag affordance — stripped back to just the two actions
- If `isCurrent`: buttons are replaced by a small "current" text badge; no actions needed
- If `isViewing`: row has a faint violet left border; Restore button is violet

### View Mode Banner
When a version is being previewed, a sticky bar appears at the top of the dropdown:
```
● Viewing v{n}                       [Cancel]  [Restore]
```
- Muted violet background (`violet-950/70`)
- Two small buttons: Cancel (reverts canvas) and Restore (commits)
- Escape key cancels view mode instead of closing the dropdown

### Restore Animation
When Restore is confirmed (from banner or from row button while not in view mode):
1. A translucent white overlay appears on top of the canvas at `opacity-20`
2. It fades to `opacity-0` over 500ms via CSS `transition-opacity`
3. The overlay uses `pointer-events-none` so it never blocks interaction

Implementation: a single `restoreFlash` boolean in `page.tsx`. A `triggerRestoreAnimation()` helper sets it true, then false after 500ms.

---

## File Changes

### 1. `plans/VERSION-CONTROL-REDESIGN.md` ← this file

### 2. `components/editor/VersionHistoryPanel.tsx` — full rewrite
- Remove slide-in panel structure
- Render as `fixed` dropdown: `top-12 right-4 z-50`
- Click-outside detection via `useEffect` + `mousedown` listener
- Keep existing view mode logic (viewingVersionId + liveSnapshotRef)
- Add view mode sticky banner inside the dropdown
- Accept new `onRestoreStart` / `onRestoreEnd` callbacks for the flash animation

### 3. `components/editor/VersionEntry.tsx` — full rewrite
- Remove all label editing and delete button
- Always render two buttons: View (eye) and Restore (arrow)
- Row hover expands buttons from icon-only to icon + text
- `isCurrent`: replace buttons with "current" badge
- `isViewing`: violet left border accent

### 4. `components/editor/EditorTopBar.tsx` — minor
- No change to `onHistoryOpen` prop wiring
- Already correct; history button already added

### 5. `app/d/[id]/page.tsx` — minor
- Add `restoreFlash` state
- Add `triggerRestoreAnimation()` helper
- Pass it as `onRestoreAnimation` prop to `VersionHistoryPanel`
- Render the flash overlay div inside the canvas container

---

## Component Interfaces

```tsx
// VersionHistoryPanel
interface Props {
  diagramId: string
  isOpen: boolean
  onClose: () => void
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  onRestoreAnimation: () => void   // NEW: triggers the flash
}

// VersionEntry
interface Props {
  version: DiagramVersion
  isCurrent: boolean
  isViewing: boolean
  onView: () => void
  onRestore: () => void
  // removed: onLabel, onDelete
}
```

---

## Restore Flow (end-to-end)

```
User clicks Restore on a row
  → VersionHistoryPanel.handleRestore(versionId)
    → restoreVersion(versionId)          [DB write + "Before restore" snapshot]
    → props.onRestoreAnimation()         [triggers flash in page.tsx]
    → canvasRef updateDiagram (implicit via DB liveQuery re-render)
    → setViewingVersionId(null)
    → onClose()
```

---

## Acceptance Criteria

- [ ] Version history opens as a compact dropdown, not a full panel
- [ ] Dropdown closes on click-outside and Escape
- [ ] Each non-current row shows View and Restore buttons (always visible, not hover-only)
- [ ] Clicking View previews that version's elements on the canvas immediately
- [ ] A "Viewing v{n}" banner appears while previewing with Cancel and Restore buttons
- [ ] Cancel in the banner reverts the canvas to live state
- [ ] Restore from banner or row triggers the white canvas flash animation
- [ ] Flash animation: white overlay fades from opacity-20 to 0 over 500ms
- [ ] After restore, the dropdown closes and the canvas shows the restored state
- [ ] All DB versions are preserved after restore (no deletions)
- [ ] The current version row has no action buttons — just a "current" badge
