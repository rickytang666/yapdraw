# Library UI Redesign — Claude.com-Inspired Interface

## Vision

Transform the YapDraw library from its current dark utility-panel aesthetic into a **warm, minimal, content-first interface** inspired by claude.com. The redesign keeps **100% of existing functionality** (CRUD, folders, tags, bulk ops, drag-and-drop, version history, import/export, keyboard shortcuts) while delivering a dramatically more polished experience.

### Design Principles (derived from claude.com)

| Principle | What it means for the library |
|---|---|
| **Warm neutrals** | Replace cold zinc-900/800 palette with warm sand/stone tones (`#F5F0E8`, `#E8E0D4`, `#2D2B28`) with a matching dark mode |
| **Generous whitespace** | Larger padding, breathing room between cards, no visual clutter |
| **Soft depth** | Subtle shadows and rounded corners (16px+) instead of hard borders |
| **Typography-led hierarchy** | Clean sans-serif (keep Manrope), clear size/weight scale, minimal icon reliance |
| **Accent restraint** | Single warm accent color (terracotta/rust `#C4704B`) instead of blue-600 everywhere |
| **Smooth motion** | Framer Motion transitions on route changes, card hover, sidebar expand/collapse |

---

## Sprint: "Library Reimagined"

**Duration:** 2 weeks (10 working days)
**Goal:** Ship a fully redesigned library UI with zero functionality regression

---

### Day 1–2: Design System Foundation

#### Task 1.1 — Color & Theme Tokens

**File:** `app/globals.css`

Define CSS custom properties for a dual-mode warm palette:

```
Light mode:
  --bg-primary: #FAF8F5        (page background — warm off-white)
  --bg-secondary: #F0EBE3      (card/sidebar background)
  --bg-tertiary: #E8E0D4       (hover states, input backgrounds)
  --border: #DDD5C8            (soft warm borders)
  --text-primary: #2D2B28      (headings, body)
  --text-secondary: #7A7468    (muted labels, timestamps)
  --text-tertiary: #B0A898     (placeholders)
  --accent: #C4704B            (primary actions — terracotta)
  --accent-hover: #B5623E
  --accent-subtle: #C4704B15   (accent tints for badges)
  --danger: #D4564E
  --star: #D4A84B

Dark mode:
  --bg-primary: #1A1916
  --bg-secondary: #232120
  --bg-tertiary: #2E2C29
  --border: #3A3733
  --text-primary: #E8E0D4
  --text-secondary: #9A9488
  --text-tertiary: #6A6458
  --accent: #D4845E
  --accent-hover: #E0956F
  --accent-subtle: #D4845E20
  --danger: #E06B63
  --star: #E0B85B
```

#### Task 1.2 — Install Framer Motion

```bash
npm install framer-motion
```

This is the only new dependency. Everything else is restyling existing components.

#### Task 1.3 — Shared UI Primitives

**New file:** `components/library/ui.tsx`

Create small, reusable styled primitives used across the library (keeps individual component files focused on logic):

- `Card` — rounded-2xl, warm bg, soft shadow, hover lift
- `IconButton` — ghost button with rounded-full, warm hover
- `Badge` — small pill with accent-subtle background
- `Modal` — centered overlay with warm backdrop blur, rounded-2xl card
- `Tooltip` — minimal warm tooltip (replace browser `title` attrs)
- `DropdownMenu` — warm-styled context menu replacement (shared by folder + diagram menus)

---

### Day 3–4: Sidebar Redesign

#### Task 2.1 — Sidebar Container (`Sidebar.tsx`)

**Current:** Dark zinc-900 panel, 56px wide sections, flat list
**Target:** Claude-style conversation sidebar

Changes:
- Width: 260px with smooth collapse to 56px icon-only mode (animated with Framer Motion)
- Background: `--bg-secondary` with no hard right border — use a subtle 1px shadow instead
- Top section: App logo/wordmark + collapse toggle button
- Navigation items: rounded-xl hover states with warm bg, active item uses `--accent-subtle` tint with accent left-border (3px rounded)
- Section labels ("Diagrams", "Folders") rendered as small uppercase tracking-wide text-secondary labels
- Trash item at bottom of sidebar, separated by a thin divider
- Smooth 200ms width transition on collapse

#### Task 2.2 — Folder Tree (`FolderTree.tsx`, `FolderTreeItem.tsx`)

- Folder icons use the folder's `color` as a filled circle dot (8px) next to the name instead of a full colored icon
- Expand/collapse chevron animates rotation (90deg) via Framer Motion
- Drop target state: dashed `--accent` border with accent-subtle background
- Drag handle appears on hover (6-dot grip icon) instead of making the whole row draggable-looking
- Diagram count shown as a small muted number right-aligned

#### Task 2.3 — Folder Context Menu (`FolderContextMenu.tsx`)

- Rebuild using the shared `DropdownMenu` primitive
- Warm background, rounded-xl, subtle shadow-lg
- Menu items: 36px height, rounded-lg hover, icon + label layout
- Destructive items (Delete) use `--danger` on hover

---

### Day 5–6: Main Content Area — Header & Grid/List

#### Task 3.1 — Header Bar (inline in `LibraryView.tsx`)

**Current:** Compact 56px bar with cramped controls
**Target:** Spacious 64px header, clean separation

- Section title: 20px semibold, text-primary
- Search bar: pill-shaped (rounded-full), `--bg-tertiary` background, 40px height, smooth expand on focus (max-w-xs → max-w-md with transition), magnifying glass icon inside
- Action buttons (Import, New Diagram) move to the right
- "New Diagram" button: `--accent` background, rounded-xl, 40px height, subtle shadow, white text
- Import button: ghost style with warm border
- Sort dropdown + view toggle: minimal, icon-driven with warm hover states
- On mobile: search becomes a toggle icon that expands full-width

#### Task 3.2 — Diagram Grid (`DiagramGrid.tsx`, `DiagramCard.tsx`)

**Current:** zinc-800 cards with blue accents, tight grid
**Target:** Spacious card grid with warm, elevated cards

**DiagramCard redesign:**
- Card: `--bg-secondary`, rounded-2xl, 1px `--border`, shadow-sm → shadow-md on hover
- Hover: card lifts 2px (translateY via Framer Motion), shadow deepens
- Thumbnail area: rounded-xl inset, 16:10 aspect ratio, light warm-gray placeholder if no thumbnail
- Below thumbnail:
  - Diagram name: 14px semibold, single line truncated
  - Metadata line: type badge (pill) + "Updated 2h ago" in text-secondary
  - Tags: small warm pills, max 2 visible + "+N" overflow
- Star button: top-right corner of thumbnail area, always visible but muted — golden fill when starred
- Hover overlay: semi-transparent warm gradient from bottom with action buttons (Open, Duplicate, Trash) as rounded icon buttons
- Selection: checkbox appears top-left on hover, warm accent ring when selected
- Grid gap: 20px (up from 16px)
- Grid columns: 1 (mobile), 2 (sm), 3 (lg), 4 (xl) — fewer columns for larger cards

**Animation:**
- Cards enter with staggered fade-up (Framer Motion `staggerChildren: 0.04`)
- Card hover/lift: `whileHover={{ y: -2 }}` with spring transition

#### Task 3.3 — Diagram List (`DiagramList.tsx`, `DiagramRow.tsx`)

- Table header: text-secondary uppercase tracking-wide, no background — just bottom border
- Rows: 56px height, rounded-lg hover background (`--bg-tertiary`)
- Thumbnail: 40x30px rounded-lg inline thumbnail
- Alternating row backgrounds removed — rely on hover state instead
- Star icon inline in name column
- Actions column: icon buttons appear on hover (same as grid)

#### Task 3.4 — Context Menu (`DiagramCardContextMenu.tsx`)

- Rebuild using shared `DropdownMenu` primitive
- Group actions with subtle dividers: [Open, Rename] | [Duplicate, Move to] | [Export] | [Star] | [Trash]
- "Move to" submenu: inline expand (not a separate floating menu) with folder list + color dots
- Keyboard navigation support (arrow keys, Enter to select)

---

### Day 7–8: Modals, Trash, Empty States, Bulk Bar

#### Task 4.1 — Modal Redesign (all 3 modals + template picker)

**Shared pattern (via `Modal` primitive):**
- Centered, max-w-md, rounded-2xl
- Backdrop: warm semi-transparent overlay with blur(8px)
- Header: 20px semibold title, optional subtitle in text-secondary
- Body: generous padding (24px)
- Footer: right-aligned buttons — primary (`--accent`) and secondary (ghost)
- Close on Escape, click outside to dismiss
- Enter animation: scale(0.98) + opacity(0) → scale(1) + opacity(1)

**NewDiagramModal:**
- Name input: large (48px), rounded-xl, auto-focused
- Diagram type: 3 large selectable cards (icon + label + description) instead of a dropdown
- Template picker: inline below type selection (collapsible section "Start from template")

**TemplatePicker / TemplateCard:**
- Category tabs: pill-shaped tab bar (rounded-full buttons), warm active state
- Cards: same warm style as diagram cards but smaller, with a "Preview" overlay on hover

**NewFolderModal / RenameFolderModal:**
- Simpler: just a name input + color picker (horizontal row of colored circles, 24px each, ring on selected)

#### Task 4.2 — Trash View (`TrashView.tsx`)

- Warning banner at top: warm amber/yellow tint background with icon, "Items are permanently deleted after 30 days"
- "Empty Trash" button: ghost with `--danger` color, confirmation uses a modal (not `window.confirm`)
- Trashed items: same card/list rendering but with a muted overlay + "Restore" / "Delete" buttons
- Restore button: accent colored; Delete button: danger ghost

#### Task 4.3 — Empty States (`EmptyState.tsx`)

- Larger, friendlier illustrations (simple SVG line art in `--text-tertiary` color, no heavy graphics)
- `empty-library`: Drawing of a blank canvas with sparkles — "Create your first diagram" + accent CTA button
- `empty-folder`: Folder outline — "This folder is empty" + "New Diagram" link
- `no-results`: Magnifying glass — "No diagrams match your search"
- `empty-trash`: Checkmark — "Trash is empty"
- Centered vertically and horizontally with max-w-sm text

#### Task 4.4 — Bulk Action Bar (`BulkActionBar.tsx`)

**Current:** Fixed bottom bar
**Target:** Floating pill bar (claude.com style bottom bar)

- Position: fixed bottom-center, rounded-2xl, shadow-2xl
- Background: `--bg-secondary` with backdrop-blur
- Layout: selection count (left) | action buttons (center) | clear button (right)
- Animate in from bottom (translateY) when selection starts
- Action buttons: icon + label, warm hover states
- "Move to" opens a small upward popover with folder picker

---

### Day 9: Animations, Transitions & Polish

#### Task 5.1 — Page-Level Transitions

- Sidebar section changes: content area cross-fades (opacity 0→1, 150ms)
- View mode toggle (grid ↔ list): layout animation via Framer Motion `AnimatePresence`

#### Task 5.2 — Micro-Interactions

- Star toggle: brief scale pulse (1 → 1.2 → 1) on click
- Card selection checkbox: smooth check mark draw-in
- Folder expand/collapse: height animate with `layout` prop
- Modal open/close: scale + opacity spring animation
- Bulk bar: slide-up from bottom with spring

#### Task 5.3 — Scroll Behavior

- Content area: custom minimal scrollbar styling (thin, warm-colored thumb, rounded)
- Sidebar folder list: fade-out gradient at top/bottom when scrollable

#### Task 5.4 — Responsive Polish

- Mobile (< 640px): sidebar collapses to bottom sheet or hamburger overlay
- Tablet (640–1024px): sidebar collapsed by default (icon mode), expandable
- Desktop (> 1024px): sidebar expanded by default

---

### Day 10: Integration Testing & QA

#### Task 6.1 — Functionality Regression Checklist

Verify every existing feature works identically:

- [ ] Create diagram (manual, from template, each type)
- [ ] Open diagram navigates to `/d/[id]`
- [ ] Rename diagram (inline double-click)
- [ ] Star / unstar diagram
- [ ] Duplicate diagram
- [ ] Move diagram to folder (drag-and-drop + context menu)
- [ ] Trash diagram + restore + permanent delete
- [ ] Empty trash
- [ ] Search by name, tags, transcript
- [ ] Sort by all 6 fields, both directions
- [ ] Grid view + List view toggle
- [ ] Create folder (with color, nested)
- [ ] Rename folder
- [ ] Delete folder (diagrams move to root)
- [ ] Drag-and-drop reorder folders
- [ ] Folder context menu (rename, add subfolder, delete)
- [ ] Bulk select + bulk star/move/trash
- [ ] Import .excalidraw file
- [ ] Export single diagram (.excalidraw, JSON)
- [ ] Export bulk as ZIP
- [ ] Keyboard shortcuts: `/`, `Cmd+K`, `Cmd+N`, `Escape`
- [ ] Tags display and bulk tag operations
- [ ] Trash auto-purge (30 days)
- [ ] localStorage persistence (viewMode, sort, section)
- [ ] Migration from old localStorage format
- [ ] Version history (existing — no UI changes needed, it's in the editor)

#### Task 6.2 — Cross-Browser & Responsive Testing

- Chrome, Safari, Firefox (latest)
- Mobile Safari (iOS), Chrome (Android) — library browsing
- Test at 320px, 768px, 1024px, 1440px widths

---

## Files Changed Summary

| File | Action | Description |
|---|---|---|
| `app/globals.css` | **Modify** | Add warm color tokens, scrollbar styles, theme variables |
| `components/library/ui.tsx` | **Create** | Shared primitives (Card, IconButton, Badge, Modal, DropdownMenu, Tooltip) |
| `components/library/Sidebar.tsx` | **Modify** | Warm styling, collapsible, animated |
| `components/library/FolderTree.tsx` | **Modify** | Animated expand/collapse, warm styling |
| `components/library/FolderTreeItem.tsx` | **Modify** | Color dots, hover grip, warm states |
| `components/library/FolderContextMenu.tsx` | **Modify** | Use shared DropdownMenu |
| `components/library/LibraryView.tsx` | **Modify** | Header redesign, layout transitions, animation wrappers |
| `components/library/DiagramGrid.tsx` | **Modify** | Spacing, staggered animation |
| `components/library/DiagramCard.tsx` | **Modify** | Full card redesign — warm palette, hover lift, overlay actions |
| `components/library/DiagramList.tsx` | **Modify** | Warm table styling |
| `components/library/DiagramRow.tsx` | **Modify** | Warm row styling, hover actions |
| `components/library/DiagramCardContextMenu.tsx` | **Modify** | Use shared DropdownMenu, grouped sections |
| `components/library/NewDiagramModal.tsx` | **Modify** | Use Modal primitive, card-based type selection |
| `components/library/NewFolderModal.tsx` | **Modify** | Use Modal primitive, circle color picker |
| `components/library/RenameFolderModal.tsx` | **Modify** | Use Modal primitive |
| `components/library/TemplatePicker.tsx` | **Modify** | Pill tabs, warm card styling |
| `components/library/TemplateCard.tsx` | **Modify** | Warm card styling |
| `components/library/BulkActionBar.tsx` | **Modify** | Floating pill bar with animations |
| `components/library/FolderPicker.tsx` | **Modify** | Warm styling, upward popover |
| `components/library/SortDropdown.tsx` | **Modify** | Warm dropdown styling |
| `components/library/ViewModeToggle.tsx` | **Modify** | Warm toggle styling |
| `components/library/EmptyState.tsx` | **Modify** | Larger illustrations, warm styling, CTA buttons |
| `components/library/TrashView.tsx` | **Modify** | Warning banner, modal confirmation, warm styling |
| `package.json` | **Modify** | Add `framer-motion` dependency |

**New files:** 1 (`ui.tsx`)
**Modified files:** 23
**Deleted files:** 0
**New dependencies:** 1 (`framer-motion`)
**Functionality changes:** 0 — purely visual

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Functionality regression | Day 10 dedicated to full checklist QA |
| Drag-and-drop breaks with new styling | Test dnd-kit interactions after every card/sidebar change |
| Performance with Framer Motion | Use `layout` prop sparingly; disable animations on reduced-motion preference |
| Mobile layout breaks | Test responsive breakpoints each day, not just Day 10 |
| Scope creep into editor UI | Strict boundary: only `/library` route and `components/library/*` are in scope |
