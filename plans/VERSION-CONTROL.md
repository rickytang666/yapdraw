# YapDraw — AI Change Version Control

## Overview

Three tightly related features that together give users full control over AI-driven diagram changes:

1. **Save on exit** — force-save whenever the user navigates away or hides the tab, so no work is ever lost
2. **AI change timeline** — every AI prompt that modifies the diagram creates a named snapshot and a clickable summary card above the chat that jumps back to that exact state
3. **⌘Z undo** — reverts the canvas to the snapshot taken immediately before the most recent AI change

These build on the existing `useVersionHistory` (Dexie `versions` table) and `useAutoSave` infrastructure.

---

## How It Fits the Current Architecture

```
app/d/[id]/page.tsx          ← orchestrates everything
├── useAutoSave              ← add beforeunload / visibilitychange saves  (3.1)
├── useAIChangeHistory       ← NEW: manages per-session snapshot list      (3.2)
├── VoicePanel               ← render change history above the chat        (3.3)
│   └── ChangeHistoryEntry   ← NEW: single clickable card                  (3.4)
└── handleSilence()          ← pre-snapshot → LLM → diff → post-record    (3.5)
```

The **versions table** already stores snapshots. The new work is:
- Tagging AI snapshots with the originating prompt + a diff summary
- Surfacing them in the VoicePanel
- Wiring Cmd+Z to restore the most recent one

---

## Data Model Changes

### DiagramVersion.label — repurposed

`label: string | null` is already on every version row. We will store a structured JSON string for AI-created snapshots:

```ts
// For AI snapshots the label is a JSON string of AIVersionMeta
interface AIVersionMeta {
  prompt: string          // the user's voice/text prompt
  summary: string         // "Added 4 shapes, removed 1 arrow, changed 2 labels"
  source: 'ai'
}
```

Plain-string labels (set by the user in VersionHistoryPanel) and `null` remain unchanged.

### Helper functions

```ts
function encodeAIMeta(meta: AIVersionMeta): string {
  return JSON.stringify(meta)
}

function decodeAIMeta(label: string | null): AIVersionMeta | null {
  if (!label) return null
  try {
    const parsed = JSON.parse(label)
    return parsed.source === 'ai' ? parsed : null
  } catch { return null }
}
```

Place these in `lib/versionMeta.ts`.

---

## Feature 3.1 — Save on Exit / Tab Hide

**File:** `hooks/useAutoSave.ts`

Add two event listeners inside the existing hook's `useEffect` cleanup block:

```ts
// inside useAutoSave, alongside the cleanup useEffect

useEffect(() => {
  // Force-save when the user closes the tab or navigates away
  function handleBeforeUnload() {
    const elements = canvasRef.current?.getElements() ?? []
    if (elements.length > 0) {
      // beforeunload must be synchronous — we can't await, but we can
      // kick off the DB write and hope it completes before the page unloads.
      // Modern browsers give ~a few hundred ms for unload handlers.
      save(elements)
    }
  }

  // Force-save when the tab is hidden (user switches tabs / minimises)
  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      const elements = canvasRef.current?.getElements() ?? []
      if (elements.length > 0) {
        save(elements)
      }
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
  }
}, [save, canvasRef])
```

No interface changes needed — `save` is already a stable `useCallback`.

---

## Feature 3.2 — useAIChangeHistory Hook

**File:** `hooks/useAIChangeHistory.ts`

Manages an in-memory list of AI change entries for the current editor session. Survives React re-renders but resets on page reload (the source of truth is the DB `versions` table — this hook just makes the session UX fast without a live query).

```ts
import { useState, useCallback } from 'react'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { ExcalidrawElement } from '@/types/diagram'
import { encodeAIMeta } from '@/lib/versionMeta'

export interface AIChangeEntry {
  versionId: string       // ID of the DiagramVersion row (the pre-change snapshot)
  prompt: string          // what the user said
  summary: string         // diff description
  savedAt: number
}

export function useAIChangeHistory(diagramId: string) {
  const [entries, setEntries] = useState<AIChangeEntry[]>([])

  /**
   * Call BEFORE the LLM request. Snapshots current elements into the
   * versions table tagged as an AI pre-snapshot. Returns the versionId
   * so the caller can wire Cmd+Z.
   */
  const snapshotBeforeChange = useCallback(async (
    currentElements: ExcalidrawElement[],
    prompt: string,
    currentTranscript: string,
    currentVersion: number,
  ): Promise<string> => {
    const versionId = nanoid()
    const now = Date.now()

    // Placeholder label — summary will be filled in by recordChange()
    await db.versions.add({
      id: versionId,
      diagramId,
      version: currentVersion,
      elements: currentElements,
      transcript: currentTranscript,
      savedAt: now,
      label: encodeAIMeta({ prompt, summary: '…', source: 'ai' }),
    })

    return versionId
  }, [diagramId])

  /**
   * Call AFTER the LLM returns. Computes diff, updates the snapshot label
   * with the real summary, and adds the entry to the in-memory list.
   */
  const recordChange = useCallback(async (
    versionId: string,
    prompt: string,
    beforeElements: ExcalidrawElement[],
    afterElements: ExcalidrawElement[],
  ): Promise<void> => {
    const summary = diffSummary(beforeElements, afterElements)
    const meta = encodeAIMeta({ prompt, summary, source: 'ai' })

    await db.versions.update(versionId, { label: meta })

    setEntries(prev => [
      { versionId, prompt, summary, savedAt: Date.now() },
      ...prev,         // newest first
    ])
  }, [])

  /**
   * Remove all entries from the in-memory list (e.g. after restoring).
   * The DB rows are untouched.
   */
  const clearEntries = useCallback(() => setEntries([]), [])

  return { entries, snapshotBeforeChange, recordChange, clearEntries }
}

// ─── Diff helper ─────────────────────────────────────────────────────────────

type AnyElement = { id: string; type?: string }

function diffSummary(before: AnyElement[], after: AnyElement[]): string {
  const beforeById = new Map(before.map(e => [e.id, e]))
  const afterById  = new Map(after.map(e => [e.id, e]))

  const added   = after.filter(e => !beforeById.has(e.id))
  const removed = before.filter(e => !afterById.has(e.id))
  const kept    = after.filter(e => beforeById.has(e.id))

  const parts: string[] = []

  const countByType = (els: AnyElement[]) =>
    els.reduce<Record<string, number>>((acc, e) => {
      const t = e.type ?? 'element'
      acc[t] = (acc[t] ?? 0) + 1
      return acc
    }, {})

  const describe = (els: AnyElement[], verb: string) => {
    const counts = countByType(els)
    const strs = Object.entries(counts).map(([type, n]) =>
      `${n} ${type}${n > 1 ? 's' : ''}`
    )
    if (strs.length) parts.push(`${verb} ${strs.join(', ')}`)
  }

  describe(added, 'Added')
  describe(removed, 'Removed')

  // Detect label changes on kept elements
  const labelChanges = kept.filter(e => {
    const old = beforeById.get(e.id) as any
    const cur = e as any
    return old?.label?.text !== cur?.label?.text && cur?.label?.text
  })
  if (labelChanges.length) {
    parts.push(`Updated ${labelChanges.length} label${labelChanges.length > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    if (after.length !== before.length) return 'Rearranged diagram'
    return 'Refined diagram'
  }

  return parts.join(' · ')
}
```

---

## Feature 3.3 — ChangeHistoryEntry Component

**File:** `components/editor/ChangeHistoryEntry.tsx`

A clickable card rendered in the VoicePanel for each AI change. Clicking restores the pre-change snapshot.

```tsx
'use client'

import { IconClockRewind, IconArrowBackUp } from '@tabler/icons-react'

interface Props {
  prompt: string
  summary: string
  savedAt: number
  onRestore: () => void
}

export default function ChangeHistoryEntry({ prompt, summary, savedAt, onRestore }: Props) {
  const relTime = relativeTime(savedAt)

  return (
    <div
      className="group flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-blue-500/50 hover:bg-zinc-800 cursor-pointer transition-colors"
      onClick={onRestore}
      title="Click to restore this state"
    >
      {/* prompt */}
      <p className="text-xs text-zinc-300 leading-snug line-clamp-2">"{prompt}"</p>

      {/* diff summary + time */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-zinc-500 leading-tight">{summary}</p>
        <span className="text-[10px] text-zinc-600 shrink-0">{relTime}</span>
      </div>

      {/* restore hint */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconArrowBackUp size={11} className="text-blue-400" />
        <span className="text-[10px] text-blue-400">Restore this state</span>
      </div>
    </div>
  )
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
```

---

## Feature 3.4 — VoicePanel Changes

**File:** `components/VoicePanel.tsx`

Add a `changeHistory` section above the transcript area. The panel receives the history and restore callback from the editor page.

### Updated Props

```ts
interface VoicePanelProps {
  isLoading: boolean
  onSilence: (transcript: string) => void
  onMockSubmit?: (text: string) => void
  // new:
  changeHistory?: AIChangeEntry[]
  onRestoreChange?: (versionId: string) => void
}
```

### New JSX block — insert between the mic section and the transcript area

```tsx
{/* AI Change History */}
{changeHistory && changeHistory.length > 0 && (
  <div className="px-4 pt-2 pb-1 flex flex-col gap-2">
    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
      Change history
    </p>
    {changeHistory.map(entry => (
      <ChangeHistoryEntry
        key={entry.versionId}
        prompt={entry.prompt}
        summary={entry.summary}
        savedAt={entry.savedAt}
        onRestore={() => onRestoreChange?.(entry.versionId)}
      />
    ))}
  </div>
)}
```

---

## Feature 3.5 — Editor Page Wiring

**File:** `app/d/[id]/page.tsx`

### State additions

```ts
const aiHistory = useAIChangeHistory(id)
const lastAIVersionIdRef = useRef<string | null>(null)  // for Cmd+Z
```

### Updated handleSilence

```ts
async function handleSilence(text: string) {
  if (!text.trim() || !diagram || diagram.locked) return
  setIsLoading(true)

  // 1. Snapshot BEFORE the change
  const currentElements = canvasRef.current?.getElements() ?? diagram.elements
  const versionId = await aiHistory.snapshotBeforeChange(
    currentElements,
    text,
    diagram.transcript,
    diagram.version,
  )
  lastAIVersionIdRef.current = versionId

  try {
    const res = await fetch('/api/generate-diagram', { ... })
    const { elements } = await res.json()

    // 2. Apply change
    canvasRef.current?.updateDiagram(elements, { replace: true })

    // 3. Record diff summary (updates the DB label + adds to in-memory list)
    await aiHistory.recordChange(versionId, text, currentElements, elements)

    await db.diagrams.update(id, {
      transcript: (diagram.transcript + '\n' + text).trim(),
      metadata: { ...diagram.metadata, generatedVia: 'voice' },
    })
  } catch (err) {
    console.error('Failed to generate diagram:', err)
    // Remove the pre-snapshot from the DB if the request failed
    await db.versions.delete(versionId)
    lastAIVersionIdRef.current = null
  } finally {
    setIsLoading(false)
  }
}
```

### Restore from history card

```ts
async function handleRestoreChange(versionId: string) {
  await restoreVersion(versionId)
  // updateDiagram so the canvas reflects immediately without a page reload
  const restored = await db.versions.get(versionId)
  if (restored) {
    canvasRef.current?.updateDiagram(restored.elements as ExcalidrawElement[], { replace: true })
  }
  // Clear in-memory history since the state is now from the past
  aiHistory.clearEntries()
  lastAIVersionIdRef.current = null
}
```

Note: `restoreVersion` is already exported from `useVersionHistory`.

### Cmd+Z keyboard shortcut

Add to the existing `useKeyboardShortcuts` call:

```ts
useKeyboardShortcuts({
  'mod+s': () => {
    const elements = canvasRef.current?.getElements() || []
    forceSave(elements)
  },
  'mod+z': async () => {
    const vid = lastAIVersionIdRef.current
    if (!vid) return                    // nothing to undo
    await handleRestoreChange(vid)
  },
})
```

### Pass to VoicePanel

```tsx
<VoicePanel
  isLoading={isLoading}
  onSilence={handleSilence}
  onMockSubmit={handleSilence}
  changeHistory={aiHistory.entries}
  onRestoreChange={handleRestoreChange}
/>
```

---

## File Map

| # | File | Change |
|---|------|--------|
| 3.1 | `hooks/useAutoSave.ts` | Add `beforeunload` + `visibilitychange` save-on-exit |
| 3.2 | `lib/versionMeta.ts` | **NEW** `encodeAIMeta` / `decodeAIMeta` helpers |
| 3.3 | `hooks/useAIChangeHistory.ts` | **NEW** per-session snapshot list + diff summary |
| 3.4 | `components/editor/ChangeHistoryEntry.tsx` | **NEW** clickable change card |
| 3.5 | `components/VoicePanel.tsx` | Add `changeHistory` + `onRestoreChange` props, render history section |
| 3.6 | `app/d/[id]/page.tsx` | Pre-snapshot → LLM → diff → record; Cmd+Z; pass history to VoicePanel |

---

## Acceptance Criteria

- [ ] Closing the tab or switching to another tab triggers an immediate save — no edits are lost
- [ ] Every AI prompt that produces a change creates a card in the change history section of the VoicePanel
- [ ] Each card shows the original prompt text, a diff summary (e.g. "Added 3 rectangles, removed 1 arrow"), and a relative timestamp
- [ ] Clicking a card restores the diagram to the state it was in immediately before that prompt was executed
- [ ] After restoring, the change history list clears (the diagram is now "clean" from the restored point)
- [ ] `Cmd+Z` / `Ctrl+Z` reverts to the state before the most recent AI change (one level only — re-pressing after a restore has no further effect until the next AI change)
- [ ] If an AI request fails, no snapshot is recorded and the history card is not shown
- [ ] Manual canvas edits (dragging, resizing, etc.) do not create history cards and are not undone by Cmd+Z

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| User presses Cmd+Z before any AI change | No-op — `lastAIVersionIdRef` is null |
| User presses Cmd+Z twice in a row | Second press is a no-op — ref is cleared after first restore |
| AI request fails mid-flight | Pre-snapshot is deleted from DB; no card is shown |
| User manually edits canvas between AI prompts | Snapshot before the next AI prompt includes those edits, so they are preserved in history |
| Page reloads | In-memory history clears; DB snapshots remain; VersionHistoryPanel still shows all past snapshots |
| Two rapid AI prompts | Each gets its own snapshot; Cmd+Z only reverts the latest |
