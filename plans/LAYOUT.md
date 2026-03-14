# YapDraw Library — Technical Plan

## Overview

The Library adds multi-diagram persistence, folder organization, search, version history, and import/export to YapDraw. The current app is a single-route voice-to-diagram tool that stores one diagram in `localStorage`. The Library turns it into a workspace.

This document covers every file change, interface, hook, component, and migration step needed to ship the feature across three sprints.

---

## Tech Stack Additions

| Layer | Choice | Reason |
|-------|--------|--------|
| Client DB | Dexie.js 4.x (`dexie`) | Type-safe IndexedDB wrapper, compound indexes, live queries via `useLiveQuery`, multi-tab safe |
| IDs | `nanoid` | 21-char URL-safe IDs, 4x smaller than UUID, zero deps |
| Routing | Next.js App Router (dynamic segments) | Already in the stack — just add `/d/[id]/page.tsx` |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` | Framework-agnostic, works with React 19, accessible |
| Thumbnails | Excalidraw `exportToBlob` | Already available on the imperative API — no new deps |
| File export | `file-saver` | Cross-browser `saveAs()` for PNG/SVG/JSON downloads |
| ZIP (bulk export) | `jszip` | Client-side ZIP generation for multi-diagram export |

### Install Command

```bash
npm install dexie nanoid @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities file-saver jszip
npm install -D @types/file-saver
```

---

## Data Model — Full TypeScript Interfaces

All interfaces live in `types/library.ts`. The existing `types/diagram.ts` stays unchanged (it only defines `ExcalidrawElement` and `LLMResponse`).

```typescript
// types/library.ts

import { ExcalidrawElement } from './diagram'

// ─── Enums & Literals ───────────────────────────────────────────

export type DiagramType = 'architecture' | 'flowchart' | 'sequence' | 'er' | 'freeform'
export type GenerationMethod = 'voice' | 'manual' | 'template' | 'import'
export type SortField = 'updatedAt' | 'lastOpenedAt' | 'createdAt' | 'name' | 'diagramType' | 'elementCount'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'

export type SidebarSection = 'all' | 'starred' | 'recent' | 'trash' | `folder:${string}`

export const FOLDER_COLORS = [
  'slate', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple'
] as const
export type FolderColor = typeof FOLDER_COLORS[number]

// ─── Core Entities ──────────────────────────────────────────────

export interface Diagram {
  id: string                      // nanoid()
  name: string                    // user-editable, default "Untitled Diagram"
  folderId: string | null         // null = root level
  elements: ExcalidrawElement[]   // the Excalidraw scene
  transcript: string              // full voice transcript that produced this
  diagramType: DiagramType
  thumbnail: string | null        // base64 data URL, ~200x150 PNG
  tags: string[]                  // user-defined, e.g. ["backend", "sprint-4"]
  starred: boolean
  locked: boolean                 // prevent accidental voice/edit overwrites
  createdAt: number               // Date.now()
  updatedAt: number               // auto-set on every save
  lastOpenedAt: number            // set on open, drives "Recent" sort
  version: number                 // incremented on each save
  trashedAt: number | null        // non-null = in trash. auto-purge after 30d
  metadata: DiagramMetadata
}

export interface DiagramMetadata {
  elementCount: number
  arrowCount: number
  colorPalette: string[]          // unique backgroundColor values, max 6
  generatedVia: GenerationMethod
}

export interface Folder {
  id: string                      // nanoid()
  name: string
  parentId: string | null         // null = root. max 3 levels deep
  color: FolderColor | null
  icon: string | null             // emoji string, e.g. "🚀"
  createdAt: number
  updatedAt: number
  sortOrder: number               // manual ordering within parent
}

export interface DiagramVersion {
  id: string                      // nanoid()
  diagramId: string               // FK to Diagram.id
  version: number                 // matches Diagram.version at snapshot time
  elements: ExcalidrawElement[]
  transcript: string
  savedAt: number
  label: string | null            // optional user label, e.g. "before refactor"
}

// ─── Template ───────────────────────────────────────────────────

export interface DiagramTemplate {
  id: string
  name: string
  category: 'architecture' | 'flowchart' | 'data' | 'blank'
  description: string
  elements: ExcalidrawElement[]
  suggestedType: DiagramType
}

// ─── UI State ───────────────────────────────────────────────────

export interface LibraryState {
  activeSection: SidebarSection
  viewMode: ViewMode
  sortField: SortField
  sortDirection: SortDirection
  searchQuery: string
  selectedIds: Set<string>        // for bulk operations
}
```

---

## Database Layer — `lib/db.ts`

```typescript
// lib/db.ts

import Dexie, { type EntityTable } from 'dexie'
import { Diagram, Folder, DiagramVersion } from '@/types/library'

const db = new Dexie('yapdraw') as Dexie & {
  diagrams: EntityTable<Diagram, 'id'>
  folders: EntityTable<Folder, 'id'>
  versions: EntityTable<DiagramVersion, 'id'>
}

db.version(1).stores({
  diagrams: 'id, folderId, name, diagramType, starred, createdAt, updatedAt, lastOpenedAt, trashedAt, *tags',
  folders: 'id, parentId, sortOrder',
  versions: 'id, diagramId, version, savedAt, [diagramId+version]'
})

export { db }
```

### Index Design Rationale

| Table | Index | Used By |
|-------|-------|---------|
| `diagrams.folderId` | Folder contents query | `useFolders` — list diagrams in a folder |
| `diagrams.starred` | Starred filter | Sidebar "Starred" section |
| `diagrams.updatedAt` | Default sort | Library grid default ordering |
| `diagrams.lastOpenedAt` | Recent sort | Sidebar "Recent" section |
| `diagrams.trashedAt` | Trash filter | Sidebar "Trash" section + auto-purge |
| `diagrams.*tags` | MultiEntry index | Tag filter queries (`where('tags').equals(tag)`) |
| `versions.[diagramId+version]` | Compound index | Version history panel — fetch all versions for a diagram |
| `folders.parentId` | Tree building | Sidebar folder tree — children of a folder |
| `folders.sortOrder` | Manual ordering | Drag-to-reorder folders |

### Why Dexie over raw IndexedDB

Raw IndexedDB is callback-hell. Dexie gives us:
- `useLiveQuery()` — reactive hook that re-renders when DB changes (including from other tabs)
- Compound indexes (`[diagramId+version]`)
- MultiEntry indexes (`*tags` — indexes each tag individually)
- Transaction support for atomic multi-table writes
- TypeScript generics on tables

---

## Routing Changes

### Current

```
/                → page.tsx (canvas + voice panel, single diagram)
```

### New

```
/                → page.tsx (Library view — grid of diagrams)
/d/[id]          → app/d/[id]/page.tsx (Editor — canvas + voice panel for a specific diagram)
/d/new           → app/d/new/page.tsx (creates diagram in DB, redirects to /d/[id])
```

### Route Files

**`app/page.tsx`** — gutted and replaced with the Library view:

```typescript
// app/page.tsx
'use client'
import LibraryView from '@/components/library/LibraryView'

export default function Home() {
  return <LibraryView />
}
```

**`app/d/new/page.tsx`** — create-and-redirect:

```typescript
// app/d/new/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram } from '@/types/library'

export default function NewDiagram() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const templateId = params.get('template')
    const folderId = params.get('folder')

    async function create() {
      const id = nanoid()
      const now = Date.now()

      let elements: any[] = []
      let diagramType: Diagram['diagramType'] = 'freeform'
      let generatedVia: Diagram['metadata']['generatedVia'] = 'manual'

      if (templateId) {
        const { getTemplate } = await import('@/lib/templates')
        const tpl = getTemplate(templateId)
        if (tpl) {
          elements = tpl.elements
          diagramType = tpl.suggestedType
          generatedVia = 'template'
        }
      }

      const diagram: Diagram = {
        id,
        name: 'Untitled Diagram',
        folderId: folderId || null,
        elements,
        transcript: '',
        diagramType,
        thumbnail: null,
        tags: [],
        starred: false,
        locked: false,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        version: 1,
        trashedAt: null,
        metadata: {
          elementCount: elements.length,
          arrowCount: elements.filter((e: any) => e.type === 'arrow').length,
          colorPalette: [],
          generatedVia,
        },
      }

      await db.diagrams.add(diagram)
      router.replace(`/d/${id}`)
    }

    create()
  }, [router, params])

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-900 text-zinc-400">
      Creating diagram…
    </div>
  )
}
```

**`app/d/[id]/page.tsx`** — the Editor (refactored from old `page.tsx`):

```typescript
// app/d/[id]/page.tsx
'use client'

import { useRef, useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import ExcalidrawCanvas, { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import EditorTopBar from '@/components/editor/EditorTopBar'
import { useAutoSave } from '@/hooks/useAutoSave'
import { ExcalidrawElement } from '@/types/diagram'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null)
  const [isLoading, setIsLoading] = useState(false)

  const diagram = useLiveQuery(() => db.diagrams.get(id), [id])

  // Mark as opened
  useEffect(() => {
    if (diagram) {
      db.diagrams.update(id, { lastOpenedAt: Date.now() })
    }
  }, [id, !!diagram])

  // Auto-save hook — watches canvas changes, debounced writes to DB
  const { triggerSave, saveStatus } = useAutoSave(id, canvasRef)

  // Redirect if diagram doesn't exist (deleted, bad URL)
  useEffect(() => {
    if (diagram === null) router.replace('/')
  }, [diagram, router])

  async function handleSilence(text: string) {
    if (!text.trim() || !diagram || diagram.locked) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          currentElements: diagram.elements,
        }),
      })
      const { elements }: { elements: ExcalidrawElement[] } = await res.json()
      canvasRef.current?.updateDiagram(elements)

      // Persist transcript
      await db.diagrams.update(id, {
        transcript: (diagram.transcript + '\n' + text).trim(),
        metadata: {
          ...diagram.metadata,
          generatedVia: 'voice',
        },
      })
    } catch (err) {
      console.error('Failed to generate diagram:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (diagram === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900 text-zinc-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <EditorTopBar
        diagram={diagram!}
        saveStatus={saveStatus}
        onBack={() => router.push('/')}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[35%] h-full border-r border-zinc-800 shrink-0">
          <VoicePanel
            isLoading={isLoading}
            onSilence={handleSilence}
            onMockSubmit={handleSilence}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 relative">
          <ExcalidrawCanvas ref={canvasRef} initialElements={diagram!.elements} />
          <LoadingIndicator isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
```

---

## Component Architecture — Full Breakdown

### New Component Tree

```
app/page.tsx (Library)
└── LibraryView
    ├── Sidebar
    │   ├── SidebarFixedSections        (All, Starred, Recent, Trash)
    │   ├── FolderTree                   (recursive)
    │   │   └── FolderTreeItem           (per folder — collapsible, context menu)
    │   └── NewFolderButton
    ├── LibraryHeader
    │   ├── SearchBar
    │   ├── SortDropdown
    │   ├── ViewModeToggle              (grid / list)
    │   └── NewDiagramButton            (dropdown: blank, template, import)
    ├── DiagramGrid                      (when viewMode === 'grid')
    │   └── DiagramCard                  (thumbnail, name, meta, context menu)
    ├── DiagramList                      (when viewMode === 'list')
    │   └── DiagramRow                   (checkbox, name, type, folder, tags, dates)
    ├── BulkActionBar                    (floating, visible when selectedIds.size > 0)
    ├── TemplatePicker                   (modal)
    ├── TagManager                       (popover)
    ├── EmptyState                       (contextual — empty folder, no results, etc.)
    └── TrashView                        (replaces grid when section === 'trash')

app/d/[id]/page.tsx (Editor)
├── EditorTopBar
│   ├── BackButton
│   ├── InlineName                       (click-to-edit)
│   ├── StarToggle
│   ├── TagPills
│   ├── DiagramTypeBadge
│   ├── SaveStatusIndicator
│   └── EditorMenu                       (export, version history, duplicate, lock)
├── VoicePanel                           (existing, unchanged)
├── ExcalidrawCanvas                     (modified — accepts initialElements prop)
├── LoadingIndicator                     (existing, unchanged)
└── VersionHistoryPanel                  (slide-in from right)
    └── VersionEntry                     (timestamp, element count, label, restore/preview)
```

---

## Hook Specifications

### `hooks/useLibrary.ts` — Library State + CRUD

```typescript
// hooks/useLibrary.ts

import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type {
  Diagram, Folder, LibraryState, SidebarSection,
  SortField, SortDirection, ViewMode
} from '@/types/library'

const STORAGE_KEY_PREFS = 'yapdraw_library_prefs'

function loadPrefs(): Partial<LibraryState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}')
  } catch { return {} }
}

function savePrefs(prefs: Partial<LibraryState>) {
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs))
}

export function useLibrary() {
  const saved = useMemo(() => loadPrefs(), [])

  const [state, setState] = useState<LibraryState>({
    activeSection: (saved.activeSection as SidebarSection) || 'all',
    viewMode: (saved.viewMode as ViewMode) || 'grid',
    sortField: (saved.sortField as SortField) || 'updatedAt',
    sortDirection: (saved.sortDirection as SortDirection) || 'desc',
    searchQuery: '',
    selectedIds: new Set(),
  })

  // ─── Live Queries ─────────────────────────────────────────

  // All non-trashed diagrams (base query — filtered/sorted in useMemo)
  const allDiagrams = useLiveQuery(
    () => db.diagrams.where('trashedAt').equals(0).or('trashedAt').equals(null as any)
          .toArray()
          .then(results => results.filter(d => d.trashedAt === null)),
    []
  )

  const trashedDiagrams = useLiveQuery(
    () => db.diagrams.filter(d => d.trashedAt !== null).toArray(),
    []
  )

  const folders = useLiveQuery(
    () => db.folders.orderBy('sortOrder').toArray(),
    []
  )

  // ─── Filtered + Sorted Diagrams ───────────────────────────

  const diagrams = useMemo(() => {
    if (!allDiagrams) return []

    let filtered = [...allDiagrams]

    // Section filter
    switch (state.activeSection) {
      case 'starred':
        filtered = filtered.filter(d => d.starred)
        break
      case 'recent':
        filtered = filtered
          .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
          .slice(0, 20)
        break
      case 'trash':
        return trashedDiagrams || []
      default:
        if (state.activeSection.startsWith('folder:')) {
          const fid = state.activeSection.slice(7)
          filtered = filtered.filter(d => d.folderId === fid)
        }
    }

    // Search filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase()
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.transcript.toLowerCase().includes(q)
      )
    }

    // Sort
    const dir = state.sortDirection === 'asc' ? 1 : -1
    filtered.sort((a, b) => {
      switch (state.sortField) {
        case 'name': return dir * a.name.localeCompare(b.name)
        case 'diagramType': return dir * a.diagramType.localeCompare(b.diagramType)
        case 'elementCount': return dir * (a.metadata.elementCount - b.metadata.elementCount)
        case 'createdAt': return dir * (a.createdAt - b.createdAt)
        case 'lastOpenedAt': return dir * (a.lastOpenedAt - b.lastOpenedAt)
        case 'updatedAt':
        default: return dir * (a.updatedAt - b.updatedAt)
      }
    })

    return filtered
  }, [allDiagrams, trashedDiagrams, state])

  // ─── Actions ──────────────────────────────────────────────

  const setSection = useCallback((section: SidebarSection) => {
    setState(s => {
      const next = { ...s, activeSection: section, selectedIds: new Set<string>() }
      savePrefs({ activeSection: section })
      return next
    })
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(s => ({ ...s, viewMode: mode }))
    savePrefs({ viewMode: mode })
  }, [])

  const setSort = useCallback((field: SortField, direction: SortDirection) => {
    setState(s => ({ ...s, sortField: field, sortDirection: direction }))
    savePrefs({ sortField: field, sortDirection: direction })
  }, [])

  const setSearch = useCallback((query: string) => {
    setState(s => ({ ...s, searchQuery: query }))
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setState(s => {
      const next = new Set(s.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { ...s, selectedIds: next }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setState(s => ({ ...s, selectedIds: new Set() }))
  }, [])

  // ─── Diagram CRUD ─────────────────────────────────────────

  const renameDiagram = useCallback(async (id: string, name: string) => {
    await db.diagrams.update(id, { name, updatedAt: Date.now() })
  }, [])

  const starDiagram = useCallback(async (id: string, starred: boolean) => {
    await db.diagrams.update(id, { starred })
  }, [])

  const lockDiagram = useCallback(async (id: string, locked: boolean) => {
    await db.diagrams.update(id, { locked })
  }, [])

  const moveDiagram = useCallback(async (id: string, folderId: string | null) => {
    await db.diagrams.update(id, { folderId, updatedAt: Date.now() })
  }, [])

  const duplicateDiagram = useCallback(async (id: string): Promise<string> => {
    const original = await db.diagrams.get(id)
    if (!original) throw new Error('Diagram not found')

    const now = Date.now()
    const newId = nanoid()
    const copy: Diagram = {
      ...original,
      id: newId,
      name: `${original.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      starred: false,
      locked: false,
      trashedAt: null,
    }
    await db.diagrams.add(copy)
    return newId
  }, [])

  const trashDiagram = useCallback(async (id: string) => {
    await db.diagrams.update(id, { trashedAt: Date.now() })
  }, [])

  const restoreDiagram = useCallback(async (id: string) => {
    const diagram = await db.diagrams.get(id)
    if (!diagram) return

    // Check if original folder still exists
    if (diagram.folderId) {
      const folder = await db.folders.get(diagram.folderId)
      if (!folder) {
        await db.diagrams.update(id, { trashedAt: null, folderId: null })
        return
      }
    }
    await db.diagrams.update(id, { trashedAt: null })
  }, [])

  const permanentlyDelete = useCallback(async (id: string) => {
    await db.transaction('rw', [db.diagrams, db.versions], async () => {
      await db.versions.where('diagramId').equals(id).delete()
      await db.diagrams.delete(id)
    })
  }, [])

  const emptyTrash = useCallback(async () => {
    const trashed = await db.diagrams.filter(d => d.trashedAt !== null).toArray()
    const ids = trashed.map(d => d.id)
    await db.transaction('rw', [db.diagrams, db.versions], async () => {
      for (const id of ids) {
        await db.versions.where('diagramId').equals(id).delete()
      }
      await db.diagrams.bulkDelete(ids)
    })
  }, [])

  const setTags = useCallback(async (id: string, tags: string[]) => {
    await db.diagrams.update(id, { tags, updatedAt: Date.now() })
  }, [])

  // ─── Bulk Actions ─────────────────────────────────────────

  const bulkMove = useCallback(async (ids: string[], folderId: string | null) => {
    await db.diagrams.where('id').anyOf(ids).modify({ folderId, updatedAt: Date.now() })
    clearSelection()
  }, [clearSelection])

  const bulkTrash = useCallback(async (ids: string[]) => {
    await db.diagrams.where('id').anyOf(ids).modify({ trashedAt: Date.now() })
    clearSelection()
  }, [clearSelection])

  const bulkStar = useCallback(async (ids: string[], starred: boolean) => {
    await db.diagrams.where('id').anyOf(ids).modify({ starred })
    clearSelection()
  }, [clearSelection])

  const bulkTag = useCallback(async (ids: string[], tag: string, action: 'add' | 'remove') => {
    const diagrams = await db.diagrams.where('id').anyOf(ids).toArray()
    await db.transaction('rw', db.diagrams, async () => {
      for (const d of diagrams) {
        const tags = action === 'add'
          ? [...new Set([...d.tags, tag])]
          : d.tags.filter(t => t !== tag)
        await db.diagrams.update(d.id, { tags })
      }
    })
    clearSelection()
  }, [clearSelection])

  // ─── Auto-Purge ───────────────────────────────────────────

  // Called once on mount in LibraryView
  const purgeExpiredTrash = useCallback(async () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 days
    const expired = await db.diagrams
      .filter(d => d.trashedAt !== null && d.trashedAt < cutoff)
      .toArray()

    if (expired.length === 0) return

    await db.transaction('rw', [db.diagrams, db.versions], async () => {
      for (const d of expired) {
        await db.versions.where('diagramId').equals(d.id).delete()
      }
      await db.diagrams.bulkDelete(expired.map(d => d.id))
    })
    console.log(`Auto-purged ${expired.length} expired trash items`)
  }, [])

  return {
    // State
    state,
    diagrams,
    folders: folders || [],
    trashedCount: trashedDiagrams?.length || 0,

    // Navigation
    setSection, setViewMode, setSort, setSearch,

    // Selection
    toggleSelect, clearSelection,

    // Diagram CRUD
    renameDiagram, starDiagram, lockDiagram, moveDiagram,
    duplicateDiagram, trashDiagram, restoreDiagram,
    permanentlyDelete, emptyTrash, setTags,

    // Bulk
    bulkMove, bulkTrash, bulkStar, bulkTag,

    // Maintenance
    purgeExpiredTrash,
  }
}
```

### `hooks/useFolders.ts` — Folder CRUD + Tree Building

```typescript
// hooks/useFolders.ts

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Folder, FolderColor } from '@/types/library'

export interface FolderNode extends Folder {
  children: FolderNode[]
  depth: number
  diagramCount: number
}

const MAX_DEPTH = 3

export function useFolders() {
  const folders = useLiveQuery(() => db.folders.orderBy('sortOrder').toArray(), [])
  const diagrams = useLiveQuery(
    () => db.diagrams.filter(d => d.trashedAt === null).toArray(),
    []
  )

  // Build tree from flat list
  const tree: FolderNode[] = buildTree(folders || [], diagrams || [])

  const createFolder = useCallback(async (
    name: string,
    parentId: string | null = null
  ): Promise<string> => {
    // Enforce max depth
    if (parentId) {
      const depth = getDepth(folders || [], parentId)
      if (depth >= MAX_DEPTH - 1) {
        throw new Error(`Folders can be nested up to ${MAX_DEPTH} levels deep`)
      }
    }

    const siblings = (folders || []).filter(f => f.parentId === parentId)
    const maxOrder = siblings.reduce((max, f) => Math.max(max, f.sortOrder), -1)

    const id = nanoid()
    const now = Date.now()
    await db.folders.add({
      id,
      name,
      parentId,
      color: null,
      icon: null,
      createdAt: now,
      updatedAt: now,
      sortOrder: maxOrder + 1,
    })
    return id
  }, [folders])

  const renameFolder = useCallback(async (id: string, name: string) => {
    await db.folders.update(id, { name, updatedAt: Date.now() })
  }, [])

  const setFolderColor = useCallback(async (id: string, color: FolderColor | null) => {
    await db.folders.update(id, { color, updatedAt: Date.now() })
  }, [])

  const setFolderIcon = useCallback(async (id: string, icon: string | null) => {
    await db.folders.update(id, { icon, updatedAt: Date.now() })
  }, [])

  const deleteFolder = useCallback(async (id: string, moveToRoot: boolean = true) => {
    await db.transaction('rw', [db.folders, db.diagrams], async () => {
      // Get all descendant folder IDs (recursive)
      const descendants = getDescendantIds(folders || [], id)
      const allIds = [id, ...descendants]

      if (moveToRoot) {
        // Move all diagrams in this folder + descendants to root
        await db.diagrams
          .where('folderId').anyOf(allIds)
          .modify({ folderId: null, updatedAt: Date.now() })
      }

      // Delete all folders in the subtree
      await db.folders.bulkDelete(allIds)
    })
  }, [folders])

  const moveFolder = useCallback(async (id: string, newParentId: string | null) => {
    // Prevent circular reference
    if (newParentId) {
      const descendants = getDescendantIds(folders || [], id)
      if (descendants.includes(newParentId)) {
        throw new Error('Cannot move folder into its own subtree')
      }
      // Check depth constraint
      const subtreeDepth = getSubtreeDepth(folders || [], id)
      const parentDepth = getDepth(folders || [], newParentId)
      if (parentDepth + subtreeDepth + 1 > MAX_DEPTH) {
        throw new Error(`This would exceed the ${MAX_DEPTH}-level nesting limit`)
      }
    }
    await db.folders.update(id, { parentId: newParentId, updatedAt: Date.now() })
  }, [folders])

  const reorderFolders = useCallback(async (orderedIds: string[]) => {
    await db.transaction('rw', db.folders, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.folders.update(orderedIds[i], { sortOrder: i })
      }
    })
  }, [])

  return {
    tree,
    folders: folders || [],
    createFolder, renameFolder, setFolderColor, setFolderIcon,
    deleteFolder, moveFolder, reorderFolders,
  }
}

// ─── Tree Helpers (pure functions) ────────────────────────────

function buildTree(folders: Folder[], diagrams: { folderId: string | null }[]): FolderNode[] {
  const countMap = new Map<string, number>()
  for (const d of diagrams) {
    if (d.folderId) {
      countMap.set(d.folderId, (countMap.get(d.folderId) || 0) + 1)
    }
  }

  function build(parentId: string | null, depth: number): FolderNode[] {
    return folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(f => ({
        ...f,
        depth,
        diagramCount: countMap.get(f.id) || 0,
        children: build(f.id, depth + 1),
      }))
  }

  return build(null, 0)
}

function getDepth(folders: Folder[], id: string): number {
  let depth = 0
  let current = folders.find(f => f.id === id)
  while (current?.parentId) {
    depth++
    current = folders.find(f => f.id === current!.parentId)
  }
  return depth
}

function getSubtreeDepth(folders: Folder[], id: string): number {
  const children = folders.filter(f => f.parentId === id)
  if (children.length === 0) return 0
  return 1 + Math.max(...children.map(c => getSubtreeDepth(folders, c.id)))
}

function getDescendantIds(folders: Folder[], id: string): string[] {
  const children = folders.filter(f => f.parentId === id)
  return children.flatMap(c => [c.id, ...getDescendantIds(folders, c.id)])
}
```

### `hooks/useAutoSave.ts` — Debounced Save + Thumbnail + Version Snapshots

```typescript
// hooks/useAutoSave.ts

import { useRef, useCallback, useEffect, useState, type RefObject } from 'react'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 2000
const VERSION_SNAPSHOT_INTERVAL = 5 * 60 * 1000  // 5 minutes
const VERSION_SNAPSHOT_EVERY_N = 10               // or every 10 saves

export function useAutoSave(
  diagramId: string,
  canvasRef: RefObject<ExcalidrawCanvasHandle | null>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastVersionTimeRef = useRef<number>(Date.now())
  const saveCountRef = useRef(0)

  const save = useCallback(async (elements: ExcalidrawElement[]) => {
    setSaveStatus('saving')
    try {
      const diagram = await db.diagrams.get(diagramId)
      if (!diagram) return

      const now = Date.now()
      const newVersion = diagram.version + 1
      saveCountRef.current++

      // Extract metadata
      const metadata = {
        ...diagram.metadata,
        elementCount: elements.length,
        arrowCount: elements.filter(e => e.type === 'arrow').length,
        colorPalette: [...new Set(
          elements
            .map(e => e.backgroundColor)
            .filter(Boolean)
        )].slice(0, 6),
      }

      // Generate thumbnail (skip for very large diagrams)
      let thumbnail = diagram.thumbnail
      if (elements.length <= 2000 && canvasRef.current) {
        try {
          thumbnail = await canvasRef.current.exportThumbnail?.() || thumbnail
        } catch { /* keep old thumbnail */ }
      }

      // Update diagram
      await db.diagrams.update(diagramId, {
        elements,
        updatedAt: now,
        version: newVersion,
        metadata,
        thumbnail,
      })

      // Version snapshot decision
      const timeSinceLastVersion = now - lastVersionTimeRef.current
      const shouldSnapshot =
        saveCountRef.current % VERSION_SNAPSHOT_EVERY_N === 0 ||
        timeSinceLastVersion > VERSION_SNAPSHOT_INTERVAL

      if (shouldSnapshot) {
        await db.versions.add({
          id: nanoid(),
          diagramId,
          version: newVersion,
          elements,
          transcript: diagram.transcript,
          savedAt: now,
          label: null,
        })
        lastVersionTimeRef.current = now
      }

      setSaveStatus('saved')
    } catch (err) {
      console.error('Auto-save failed:', err)
      setSaveStatus('error')
    }
  }, [diagramId, canvasRef])

  const triggerSave = useCallback((elements: ExcalidrawElement[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(elements), SAVE_DEBOUNCE_MS)
  }, [save])

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // Force save (Ctrl+S)
  const forceSave = useCallback(async (elements: ExcalidrawElement[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    // Force a version snapshot
    saveCountRef.current = VERSION_SNAPSHOT_EVERY_N - 1
    await save(elements)
  }, [save])

  return { triggerSave, forceSave, saveStatus }
}
```

### `hooks/useVersionHistory.ts` — Version Fetching + Restore + Prune

```typescript
// hooks/useVersionHistory.ts

import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { DiagramVersion } from '@/types/library'

export function useVersionHistory(diagramId: string) {
  const versions = useLiveQuery(
    () => db.versions
      .where('diagramId').equals(diagramId)
      .reverse()
      .sortBy('savedAt'),
    [diagramId]
  )

  const restoreVersion = useCallback(async (versionId: string) => {
    const version = await db.versions.get(versionId)
    const diagram = await db.diagrams.get(diagramId)
    if (!version || !diagram) return

    // Save current state as a version first (so user can undo the restore)
    await db.versions.add({
      id: nanoid(),
      diagramId,
      version: diagram.version,
      elements: diagram.elements,
      transcript: diagram.transcript,
      savedAt: Date.now(),
      label: `Before restore to v${version.version}`,
    })

    // Apply the old version
    await db.diagrams.update(diagramId, {
      elements: version.elements,
      transcript: version.transcript,
      updatedAt: Date.now(),
      version: diagram.version + 1,
    })
  }, [diagramId])

  const labelVersion = useCallback(async (versionId: string, label: string) => {
    await db.versions.update(versionId, { label })
  }, [])

  const deleteVersion = useCallback(async (versionId: string) => {
    await db.versions.delete(versionId)
  }, [])

  // Prune old versions:
  // Keep all from last 24h
  // Then 1 per day for 7 days
  // Then 1 per week for 4 weeks
  // Then 1 per month indefinitely
  const pruneVersions = useCallback(async () => {
    const all = await db.versions
      .where('diagramId').equals(diagramId)
      .sortBy('savedAt')

    if (all.length <= 10) return // don't prune small histories

    const now = Date.now()
    const DAY = 86400000
    const WEEK = 7 * DAY

    const toDelete: string[] = []
    const buckets = new Map<string, DiagramVersion[]>()

    for (const v of all) {
      const age = now - v.savedAt
      let bucket: string

      if (age < DAY) {
        continue // keep all from last 24h
      } else if (age < 7 * DAY) {
        bucket = `day-${Math.floor(v.savedAt / DAY)}`
      } else if (age < 28 * DAY) {
        bucket = `week-${Math.floor(v.savedAt / WEEK)}`
      } else {
        bucket = `month-${new Date(v.savedAt).getFullYear()}-${new Date(v.savedAt).getMonth()}`
      }

      if (!buckets.has(bucket)) buckets.set(bucket, [])
      buckets.get(bucket)!.push(v)
    }

    // For each bucket, keep the latest, delete the rest (unless labeled)
    for (const [, versions] of buckets) {
      const sorted = versions.sort((a, b) => b.savedAt - a.savedAt)
      for (let i = 1; i < sorted.length; i++) {
        if (!sorted[i].label) {
          toDelete.push(sorted[i].id)
        }
      }
    }

    if (toDelete.length > 0) {
      await db.versions.bulkDelete(toDelete)
    }
  }, [diagramId])

  return {
    versions: versions || [],
    restoreVersion,
    labelVersion,
    deleteVersion,
    pruneVersions,
  }
}
```

### `hooks/useSearch.ts` — Full-Text Search with Weighted Scoring

```typescript
// hooks/useSearch.ts

import { useMemo } from 'react'
import type { Diagram } from '@/types/library'

interface SearchResult {
  diagram: Diagram
  score: number
  matchedField: 'name' | 'tags' | 'transcript' | 'diagramType'
  snippet: string | null       // highlighted transcript excerpt
}

const WEIGHTS = {
  name: 3,
  tags: 2,
  transcript: 1,
  diagramType: 1,
}

export function useSearch(diagrams: Diagram[], query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const results: SearchResult[] = []

    for (const d of diagrams) {
      let bestScore = 0
      let bestField: SearchResult['matchedField'] = 'name'
      let snippet: string | null = null

      // Name match
      const nameIdx = d.name.toLowerCase().indexOf(q)
      if (nameIdx !== -1) {
        // Exact start match scores higher
        const bonus = nameIdx === 0 ? 2 : 0
        const score = WEIGHTS.name + bonus
        if (score > bestScore) {
          bestScore = score
          bestField = 'name'
        }
      }

      // Tag match
      for (const tag of d.tags) {
        if (tag.toLowerCase().includes(q)) {
          const score = WEIGHTS.tags
          if (score > bestScore) {
            bestScore = score
            bestField = 'tags'
          }
        }
      }

      // Transcript match
      const txIdx = d.transcript.toLowerCase().indexOf(q)
      if (txIdx !== -1) {
        const score = WEIGHTS.transcript
        if (score > bestScore || !bestScore) {
          bestScore = Math.max(bestScore, score)
          bestField = 'transcript'
        }
        // Extract snippet: 40 chars before + match + 40 chars after
        const start = Math.max(0, txIdx - 40)
        const end = Math.min(d.transcript.length, txIdx + q.length + 40)
        snippet = (start > 0 ? '…' : '') +
          d.transcript.slice(start, end) +
          (end < d.transcript.length ? '…' : '')
      }

      // Type match
      if (d.diagramType.toLowerCase().includes(q)) {
        bestScore = Math.max(bestScore, WEIGHTS.diagramType)
        if (bestScore === WEIGHTS.diagramType) bestField = 'diagramType'
      }

      if (bestScore > 0) {
        results.push({ diagram: d, score: bestScore, matchedField: bestField, snippet })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }, [diagrams, query])
}
```

---

## ExcalidrawCanvas Modifications

The existing component needs two changes:

1. Accept `initialElements` prop (instead of always loading from localStorage)
2. Expose `exportThumbnail()` on the imperative handle

### Diff Summary

```typescript
// ExcalidrawCanvas.tsx — changes only

// ADD prop
interface ExcalidrawCanvasProps {
  initialElements?: ExcalidrawElement[]
}

// CHANGE forwardRef signature
const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, ExcalidrawCanvasProps>(
  ({ initialElements }, ref) => {
    // ...

    // REMOVE: localStorage loading in loadInitialData
    // REPLACE with: use initialElements prop
    useEffect(() => {
      import('@excalidraw/excalidraw').then((mod) => {
        setExcalidraw(() => mod.Excalidraw)
        setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
        if (initialElements?.length) {
          const converted = isNativeFormat(initialElements[0])
            ? initialElements
            : mod.convertToExcalidrawElements(initialElements, { regenerateIds: false })
          setInitialData({ elements: converted })
        }
      })
    }, []) // initialElements intentionally excluded — only used on mount

    // ADD to imperative handle
    useImperativeHandle(ref, () => ({
      updateDiagram(incoming) { /* ... existing ... */ },

      async exportThumbnail(): Promise<string | null> {
        if (!apiRef.current) return null
        try {
          const blob = await apiRef.current.exportToBlob({
            mimeType: 'image/png',
            quality: 0.5,
            maxWidthOrHeight: 400,
          })
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        } catch {
          return null
        }
      },

      getElements(): ExcalidrawElement[] {
        if (!apiRef.current) return []
        return [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
      },
    }))

    // REMOVE: onChange → debouncedApplyUpdate (auto-save is now in the Editor page)
    // REPLACE with: onChange callback prop
  }
)
```

### Updated Handle Interface

```typescript
export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
  exportThumbnail: () => Promise<string | null>
  getElements: () => ExcalidrawElement[]
}
```

---

## Export & Import — `lib/export.ts` and `lib/import.ts`

### Export

```typescript
// lib/export.ts

import { saveAs } from 'file-saver'
import type { Diagram } from '@/types/library'

export async function exportAsPNG(
  api: { exportToBlob: Function },
  filename: string
) {
  const blob = await api.exportToBlob({
    mimeType: 'image/png',
    quality: 1,
    maxWidthOrHeight: 4096,
  })
  saveAs(blob, `${filename}.png`)
}

export async function exportAsSVG(
  api: { exportToSvg: Function },
  filename: string
) {
  const svg = await api.exportToSvg({})
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svg)
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  saveAs(blob, `${filename}.svg`)
}

export function exportAsExcalidraw(diagram: Diagram) {
  const data = {
    type: 'excalidraw',
    version: 2,
    elements: diagram.elements,
    appState: { viewBackgroundColor: '#ffffff' },
    files: {},
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, `${diagram.name}.excalidraw`)
}

export function exportAsJSON(diagram: Diagram) {
  const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' })
  saveAs(blob, `${diagram.name}.yapdraw.json`)
}

export async function exportBulkAsZip(
  diagrams: Diagram[],
  format: 'excalidraw' | 'json'
) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  for (const d of diagrams) {
    if (format === 'excalidraw') {
      const data = {
        type: 'excalidraw',
        version: 2,
        elements: d.elements,
        appState: { viewBackgroundColor: '#ffffff' },
        files: {},
      }
      zip.file(`${d.name}.excalidraw`, JSON.stringify(data, null, 2))
    } else {
      zip.file(`${d.name}.yapdraw.json`, JSON.stringify(d, null, 2))
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `yapdraw-export-${Date.now()}.zip`)
}
```

### Import

```typescript
// lib/import.ts

import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import type { Diagram } from '@/types/library'
import type { ExcalidrawElement } from '@/types/diagram'

export async function importExcalidrawFile(file: File): Promise<string> {
  const text = await file.text()
  const data = JSON.parse(text)

  if (!Array.isArray(data.elements)) {
    throw new Error('Invalid .excalidraw file: missing elements array')
  }

  const elements = data.elements as ExcalidrawElement[]
  const id = nanoid()
  const now = Date.now()
  const name = file.name.replace(/\.excalidraw$/, '') || 'Imported Diagram'

  const diagram: Diagram = {
    id,
    name,
    folderId: null,
    elements,
    transcript: '',
    diagramType: 'freeform',
    thumbnail: null,
    tags: ['imported'],
    starred: false,
    locked: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    version: 1,
    trashedAt: null,
    metadata: {
      elementCount: elements.length,
      arrowCount: elements.filter(e => e.type === 'arrow').length,
      colorPalette: [...new Set(elements.map(e => e.backgroundColor).filter(Boolean))].slice(0, 6),
      generatedVia: 'import',
    },
  }

  await db.diagrams.add(diagram)
  return id
}

export async function importYapDrawJSON(file: File): Promise<string> {
  const text = await file.text()
  const data = JSON.parse(text) as Diagram

  // Re-ID to avoid collisions
  const id = nanoid()
  const now = Date.now()

  const diagram: Diagram = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    version: 1,
    trashedAt: null,
    starred: false,
  }

  await db.diagrams.add(diagram)
  return id
}
```

---

## Templates — `lib/templates/`

### Template Index

```typescript
// lib/templates/index.ts

import type { DiagramTemplate } from '@/types/library'

// Static imports — bundled at build time, no network request
import microservices from './microservices.json'
import monolith from './monolith.json'
import serverless from './serverless.json'
import eventDriven from './event-driven.json'
import userAuth from './user-auth.json'
import cicdPipeline from './cicd-pipeline.json'
import decisionTree from './decision-tree.json'
import erDiagram from './er-diagram.json'
import dataPipeline from './data-pipeline.json'

const templates: DiagramTemplate[] = [
  microservices, monolith, serverless, eventDriven,
  userAuth, cicdPipeline, decisionTree,
  erDiagram, dataPipeline,
] as DiagramTemplate[]

export function getAllTemplates(): DiagramTemplate[] {
  return templates
}

export function getTemplate(id: string): DiagramTemplate | undefined {
  return templates.find(t => t.id === id)
}

export function getTemplatesByCategory(category: DiagramTemplate['category']): DiagramTemplate[] {
  return templates.filter(t => t.category === category)
}
```

### Example Template JSON

```jsonc
// lib/templates/microservices.json
{
  "id": "microservices",
  "name": "Microservices Architecture",
  "category": "architecture",
  "description": "API gateway + 3 services, each with its own database, connected via message queue",
  "suggestedType": "architecture",
  "elements": [
    { "type": "rectangle", "id": "api-gateway", "x": 350, "y": 50, "width": 160, "height": 60,
      "backgroundColor": "#a5d8ff", "strokeColor": "#1971c2",
      "label": { "text": "API Gateway" } },
    { "type": "rectangle", "id": "user-service", "x": 100, "y": 200, "width": 160, "height": 60,
      "backgroundColor": "#b2f2bb", "strokeColor": "#2f9e44",
      "label": { "text": "User Service" } },
    { "type": "rectangle", "id": "order-service", "x": 350, "y": 200, "width": 160, "height": 60,
      "backgroundColor": "#b2f2bb", "strokeColor": "#2f9e44",
      "label": { "text": "Order Service" } },
    { "type": "rectangle", "id": "notification-service", "x": 600, "y": 200, "width": 180, "height": 60,
      "backgroundColor": "#b2f2bb", "strokeColor": "#2f9e44",
      "label": { "text": "Notification Service" } },
    { "type": "rectangle", "id": "user-db", "x": 100, "y": 340, "width": 160, "height": 60,
      "backgroundColor": "#ffd8a8", "strokeColor": "#e67700",
      "label": { "text": "Users DB" } },
    { "type": "rectangle", "id": "order-db", "x": 350, "y": 340, "width": 160, "height": 60,
      "backgroundColor": "#ffd8a8", "strokeColor": "#e67700",
      "label": { "text": "Orders DB" } },
    { "type": "rectangle", "id": "message-queue", "x": 300, "y": 480, "width": 260, "height": 60,
      "backgroundColor": "#e5dbff", "strokeColor": "#6741d9",
      "label": { "text": "Message Queue (RabbitMQ)" } },
    { "type": "arrow", "id": "gw-to-users", "x": 350, "y": 110,
      "start": { "id": "api-gateway" }, "end": { "id": "user-service" } },
    { "type": "arrow", "id": "gw-to-orders", "x": 430, "y": 110,
      "start": { "id": "api-gateway" }, "end": { "id": "order-service" } },
    { "type": "arrow", "id": "gw-to-notif", "x": 510, "y": 110,
      "start": { "id": "api-gateway" }, "end": { "id": "notification-service" } },
    { "type": "arrow", "id": "users-to-db", "x": 180, "y": 260,
      "start": { "id": "user-service" }, "end": { "id": "user-db" } },
    { "type": "arrow", "id": "orders-to-db", "x": 430, "y": 260,
      "start": { "id": "order-service" }, "end": { "id": "order-db" } },
    { "type": "arrow", "id": "orders-to-mq", "x": 430, "y": 380,
      "start": { "id": "order-service" }, "end": { "id": "message-queue" } },
    { "type": "arrow", "id": "mq-to-notif", "x": 600, "y": 480,
      "start": { "id": "message-queue" }, "end": { "id": "notification-service" } }
  ]
}
```

---

## Migration From localStorage — `lib/migrate.ts`

```typescript
// lib/migrate.ts

import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram } from '@/types/library'

const OLD_STORAGE_KEY = 'yapdraw_elements'
const MIGRATION_FLAG = 'yapdraw_migrated_v1'

export async function migrateFromLocalStorage(): Promise<string | null> {
  // Only run once
  if (localStorage.getItem(MIGRATION_FLAG)) return null

  const raw = localStorage.getItem(OLD_STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(MIGRATION_FLAG, '1')
    return null
  }

  try {
    const elements = JSON.parse(raw)
    if (!Array.isArray(elements) || elements.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, '1')
      return null
    }

    const id = nanoid()
    const now = Date.now()

    const diagram: Diagram = {
      id,
      name: 'My First Diagram',
      folderId: null,
      elements,
      transcript: '',
      diagramType: 'freeform',
      thumbnail: null,
      tags: [],
      starred: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      trashedAt: null,
      metadata: {
        elementCount: elements.length,
        arrowCount: elements.filter((e: any) => e.type === 'arrow').length,
        colorPalette: [...new Set(
          elements.map((e: any) => e.backgroundColor).filter(Boolean)
        )].slice(0, 6),
        generatedVia: 'voice',
      },
    }

    await db.diagrams.add(diagram)
    localStorage.removeItem(OLD_STORAGE_KEY)
    localStorage.setItem(MIGRATION_FLAG, '1')

    console.log(`Migrated localStorage diagram as "${diagram.name}" (${id})`)
    return id
  } catch (err) {
    console.error('Migration failed:', err)
    localStorage.setItem(MIGRATION_FLAG, '1')
    return null
  }
}
```

---

## Keyboard Shortcuts — `hooks/useKeyboardShortcuts.ts`

```typescript
// hooks/useKeyboardShortcuts.ts

import { useEffect } from 'react'

interface ShortcutMap {
  [combo: string]: () => void
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('mod')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')
      parts.push(e.key.toLowerCase())
      const combo = parts.join('+')

      const action = shortcuts[combo]
      if (action) {
        e.preventDefault()
        action()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

// Usage in Library:
// useKeyboardShortcuts({
//   '/': () => focusSearchBar(),
//   'mod+n': () => router.push('/d/new'),
//   'escape': () => clearSelection(),
// })

// Usage in Editor:
// useKeyboardShortcuts({
//   'mod+s': () => forceSave(canvasRef.current?.getElements() || []),
//   'mod+shift+s': () => duplicateAndOpen(),
//   'mod+backspace': () => router.push('/'),
// })
```

---

## Drag-and-Drop Integration

### Library Sidebar + Grid

Using `@dnd-kit/core`:

```typescript
// In LibraryView.tsx — simplified DnD setup

import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'

function LibraryView() {
  const { moveDiagram } = useLibrary()
  const [activeDrag, setActiveDrag] = useState<Diagram | null>(null)

  function handleDragStart(event: DragStartEvent) {
    const diagram = /* lookup by event.active.id */
    setActiveDrag(diagram)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const overId = over.id as string

    // Dropped on a folder
    if (overId.startsWith('folder:')) {
      const folderId = overId.slice(7)
      moveDiagram(active.id as string, folderId)
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Sidebar /> {/* Folder items are droppable targets */}
      <DiagramGrid /> {/* Diagram cards are draggable */}
      <DragOverlay>
        {activeDrag && <DiagramCard diagram={activeDrag} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
```

### Folder Reorder

Using `@dnd-kit/sortable`:

```typescript
// In FolderTree.tsx — sortable folder list within each parent

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableFolderItem({ folder }: { folder: FolderNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: folder.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FolderTreeItem folder={folder} />
    </div>
  )
}
```

---

## Complete File Map (New + Modified)

```
yapdraw/
├── app/
│   ├── page.tsx                          ← REWRITTEN: renders LibraryView
│   ├── layout.tsx                        ← MODIFIED: wrap children in DndContext provider
│   ├── globals.css                       ← UNCHANGED
│   ├── d/
│   │   ├── [id]/
│   │   │   └── page.tsx                  ← NEW: Editor page
│   │   └── new/
│   │       └── page.tsx                  ← NEW: create + redirect
│   └── api/
│       ├── generate-diagram/route.ts     ← UNCHANGED
│       └── deepgram-token/route.ts       ← UNCHANGED
│
├── components/
│   ├── ExcalidrawCanvas.tsx              ← MODIFIED: initialElements prop, exportThumbnail, getElements
│   ├── VoicePanel.tsx                    ← UNCHANGED
│   ├── MicButton.tsx                     ← UNCHANGED
│   ├── TranscriptDisplay.tsx             ← UNCHANGED
│   ├── InterimIndicator.tsx              ← UNCHANGED
│   ├── LoadingIndicator.tsx              ← UNCHANGED
│   │
│   ├── library/
│   │   ├── LibraryView.tsx               ← NEW: top-level library layout + DnD context
│   │   ├── Sidebar.tsx                   ← NEW: fixed sections + folder tree + new folder btn
│   │   ├── SidebarFixedSection.tsx       ← NEW: All / Starred / Recent / Trash items
│   │   ├── FolderTree.tsx                ← NEW: recursive sortable folder tree
│   │   ├── FolderTreeItem.tsx            ← NEW: single folder row (collapse, context menu, drop target)
│   │   ├── FolderContextMenu.tsx         ← NEW: right-click rename/color/delete/add subfolder
│   │   ├── FolderColorPicker.tsx         ← NEW: 8-color swatch picker
│   │   ├── FolderIconPicker.tsx          ← NEW: compact emoji picker
│   │   ├── LibraryHeader.tsx             ← NEW: search + sort + view toggle + new diagram button
│   │   ├── SearchBar.tsx                 ← NEW: debounced input + result highlighting
│   │   ├── SearchResults.tsx             ← NEW: weighted search result list
│   │   ├── SortDropdown.tsx              ← NEW: 6 sort options + direction toggle
│   │   ├── ViewModeToggle.tsx            ← NEW: grid/list toggle
│   │   ├── NewDiagramDropdown.tsx        ← NEW: blank / template / import actions
│   │   ├── DiagramGrid.tsx               ← NEW: responsive card grid
│   │   ├── DiagramCard.tsx               ← NEW: thumbnail + name + meta + context menu + draggable
│   │   ├── DiagramCardContextMenu.tsx    ← NEW: open/rename/duplicate/move/tags/star/lock/export/trash
│   │   ├── DiagramList.tsx               ← NEW: sortable table view
│   │   ├── DiagramRow.tsx                ← NEW: table row + checkbox + inline actions
│   │   ├── BulkActionBar.tsx             ← NEW: floating bar for multi-select operations
│   │   ├── FolderPicker.tsx              ← NEW: reusable popover for "Move to" actions
│   │   ├── TagManager.tsx                ← NEW: add/remove tags popover + autocomplete
│   │   ├── TemplatePicker.tsx            ← NEW: modal with categorized template grid
│   │   ├── TemplateCard.tsx              ← NEW: single template preview
│   │   ├── TrashView.tsx                 ← NEW: trash listing + restore/delete/empty
│   │   └── EmptyState.tsx                ← NEW: contextual empty states (empty folder, no results, etc.)
│   │
│   └── editor/
│       ├── EditorTopBar.tsx              ← NEW: back, name, star, tags, type badge, save status, menu
│       ├── InlineName.tsx                ← NEW: click-to-edit name input
│       ├── SaveStatusIndicator.tsx       ← NEW: "Saving..." / "Saved 2m ago" / "Error"
│       ├── EditorMenu.tsx                ← NEW: dropdown (export, history, duplicate, lock)
│       ├── VersionHistoryPanel.tsx       ← NEW: slide-in panel with version list
│       └── VersionEntry.tsx              ← NEW: single version row (timestamp, count, label, actions)
│
├── hooks/
│   ├── useDeepgram.ts                    ← UNCHANGED
│   ├── useSpeechFallback.ts              ← UNCHANGED
│   ├── useDiagramState.ts               ← DEPRECATED (replaced by useAutoSave + direct DB reads)
│   ├── useLibrary.ts                     ← NEW: library state + diagram CRUD + bulk ops
│   ├── useFolders.ts                     ← NEW: folder CRUD + tree building
│   ├── useAutoSave.ts                    ← NEW: debounced save + thumbnail + version snapshots
│   ├── useVersionHistory.ts              ← NEW: version fetching + restore + prune
│   ├── useSearch.ts                      ← NEW: weighted full-text search
│   └── useKeyboardShortcuts.ts           ← NEW: global keyboard shortcut handler
│
├── lib/
│   ├── db.ts                             ← NEW: Dexie database definition
│   ├── migrate.ts                        ← NEW: localStorage → IndexedDB one-time migration
│   ├── export.ts                         ← NEW: PNG/SVG/Excalidraw/JSON/ZIP export
│   ├── import.ts                         ← NEW: .excalidraw and .yapdraw.json import
│   ├── templates/
│   │   ├── index.ts                      ← NEW: template registry
│   │   ├── microservices.json            ← NEW
│   │   ├── monolith.json                 ← NEW
│   │   ├── serverless.json               ← NEW
│   │   ├── event-driven.json             ← NEW
│   │   ├── user-auth.json                ← NEW
│   │   ├── cicd-pipeline.json            ← NEW
│   │   ├── decision-tree.json            ← NEW
│   │   ├── er-diagram.json               ← NEW
│   │   └── data-pipeline.json            ← NEW
│   ├── prompts.ts                        ← UNCHANGED
│   ├── llm.ts                            ← UNCHANGED
│   └── excalidraw-helpers.ts             ← UNCHANGED
│
└── types/
    ├── diagram.ts                        ← UNCHANGED
    └── library.ts                        ← NEW: all library interfaces, types, enums
```

---

## Sprint Breakdown — Task-Level

### Sprint 1: Foundation (~20h)

_Goal: Multiple diagrams, Library landing page, basic navigation._

| # | Task | Files | Estimate | Depends On |
|---|------|-------|----------|------------|
| 1.1 | Install deps (`dexie`, `nanoid`, `file-saver`, `@dnd-kit/*`, `jszip`) | `package.json` | 0.5h | — |
| 1.2 | Define all types | `types/library.ts` | 1h | — |
| 1.3 | Create Dexie DB schema | `lib/db.ts` | 1h | 1.2 |
| 1.4 | Write migration script | `lib/migrate.ts` | 1h | 1.3 |
| 1.5 | Modify `ExcalidrawCanvas` — add `initialElements` prop + `exportThumbnail` + `getElements` | `components/ExcalidrawCanvas.tsx` | 2h | — |
| 1.6 | Create Editor page at `/d/[id]` — move old `page.tsx` logic here, wire to DB | `app/d/[id]/page.tsx` | 3h | 1.3, 1.5 |
| 1.7 | Create `/d/new` route — create diagram + redirect | `app/d/new/page.tsx` | 1h | 1.3 |
| 1.8 | Build `EditorTopBar` — back button, inline name, star, save status | `components/editor/EditorTopBar.tsx`, `InlineName.tsx`, `SaveStatusIndicator.tsx` | 2h | 1.6 |
| 1.9 | Implement `useAutoSave` hook | `hooks/useAutoSave.ts` | 2h | 1.3, 1.5 |
| 1.10 | Build Library page (grid view only) — `LibraryView`, `DiagramGrid`, `DiagramCard` | `app/page.tsx`, `components/library/LibraryView.tsx`, `DiagramGrid.tsx`, `DiagramCard.tsx` | 4h | 1.3 |
| 1.11 | Build `Sidebar` with fixed sections (All, Starred, Recent, Trash) — no folders yet | `components/library/Sidebar.tsx`, `SidebarFixedSection.tsx` | 1.5h | 1.10 |
| 1.12 | Implement soft delete + `TrashView` + auto-purge on mount | `components/library/TrashView.tsx`, logic in `useLibrary` | 1.5h | 1.10 |
| 1.13 | Run migration on first Library load | Call `migrateFromLocalStorage()` in `LibraryView` `useEffect` | 0.5h | 1.4, 1.10 |
| 1.14 | Deprecate `useDiagramState` — ensure nothing imports it | — | 0.5h | 1.6, 1.9 |

**Sprint 1 Acceptance Criteria:**
- Opening the app shows a Library grid of saved diagrams
- "New Diagram" creates a blank diagram and opens the editor
- Editor auto-saves to IndexedDB every 2s
- Back button returns to Library
- Diagrams show thumbnails in Library
- Deleting moves to Trash, trash has restore and permanent delete
- Old localStorage diagram is imported on first load

---

### Sprint 2: Organization (~24h)

_Goal: Folders, sort, search, tags, list view, drag-and-drop, bulk operations._

| # | Task | Files | Estimate | Depends On |
|---|------|-------|----------|------------|
| 2.1 | Implement `useFolders` hook — CRUD + tree building + depth validation | `hooks/useFolders.ts` | 3h | 1.3 |
| 2.2 | Build `FolderTree` + `FolderTreeItem` — recursive, collapsible, context menu | `components/library/FolderTree.tsx`, `FolderTreeItem.tsx` | 3h | 2.1 |
| 2.3 | Build `FolderContextMenu` — rename, color, icon, delete, add subfolder | `FolderContextMenu.tsx`, `FolderColorPicker.tsx`, `FolderIconPicker.tsx` | 2h | 2.2 |
| 2.4 | Wire sidebar folder clicks to filter diagrams | Update `Sidebar.tsx` + `useLibrary` | 1h | 2.2 |
| 2.5 | DnD: drag diagram cards onto sidebar folders | `LibraryView.tsx` (DndContext), `DiagramCard.tsx` (draggable), `FolderTreeItem.tsx` (droppable) | 3h | 2.2, 1.10 |
| 2.6 | DnD: sortable folder reorder | `FolderTree.tsx` (SortableContext) | 1.5h | 2.2 |
| 2.7 | Build `SortDropdown` — 6 fields + direction toggle, persist to localStorage | `components/library/SortDropdown.tsx` | 1.5h | 1.10 |
| 2.8 | Implement `useSearch` hook + `SearchBar` + `SearchResults` | `hooks/useSearch.ts`, `SearchBar.tsx`, `SearchResults.tsx` | 3h | 1.10 |
| 2.9 | Build `TagManager` popover — add/remove tags, autocomplete from existing | `components/library/TagManager.tsx` | 2h | 1.10 |
| 2.10 | Add tag pills to `DiagramCard` and `EditorTopBar` | Update `DiagramCard.tsx`, `EditorTopBar.tsx` | 1h | 2.9 |
| 2.11 | Star toggle — sidebar "Starred" section, star button on cards + editor | Update `Sidebar.tsx`, `DiagramCard.tsx`, `EditorTopBar.tsx` | 1h | 1.10 |
| 2.12 | Build `DiagramList` (table view) + `ViewModeToggle` | `DiagramList.tsx`, `DiagramRow.tsx`, `ViewModeToggle.tsx` | 3h | 1.10 |
| 2.13 | Build `BulkActionBar` — multi-select checkboxes in list view, floating action bar | `BulkActionBar.tsx`, update `DiagramRow.tsx` | 2h | 2.12 |
| 2.14 | Build `FolderPicker` popover — reused by card context menu + bulk move | `FolderPicker.tsx` | 1.5h | 2.1 |
| 2.15 | Build `DiagramCardContextMenu` — open, rename, duplicate, move, tags, star, lock, export, trash | `DiagramCardContextMenu.tsx` | 2h | 2.9, 2.14 |
| 2.16 | Build `EmptyState` component — empty folder, no search results, empty library | `EmptyState.tsx` | 1h | — |

**Sprint 2 Acceptance Criteria:**
- Create folders up to 3 levels deep
- Drag diagrams onto folders in the sidebar
- Search finds diagrams by name, tag, and transcript text
- Sort by 6 different fields with asc/desc
- Tag diagrams and filter by tag
- List view with sortable columns and multi-select
- Bulk move, tag, star, and delete

---

### Sprint 3: Polish (~25h)

_Goal: Version history, templates, full export/import, keyboard shortcuts, responsive._

| # | Task | Files | Estimate | Depends On |
|---|------|-------|----------|------------|
| 3.1 | Implement `useVersionHistory` hook — fetch, restore, label, prune | `hooks/useVersionHistory.ts` | 2h | 1.9 |
| 3.2 | Build `VersionHistoryPanel` — slide-in panel, version list, preview, restore | `components/editor/VersionHistoryPanel.tsx`, `VersionEntry.tsx` | 3h | 3.1 |
| 3.3 | Wire version pruning — run on editor open | Update `app/d/[id]/page.tsx` | 0.5h | 3.1 |
| 3.4 | Create 9 template JSON files | `lib/templates/*.json` | 3h | — |
| 3.5 | Build `TemplatePicker` modal + `TemplateCard` | `TemplatePicker.tsx`, `TemplateCard.tsx` | 2h | 3.4 |
| 3.6 | Wire "From Template" flow — template picker → `/d/new?template=X` | `NewDiagramDropdown.tsx`, update `app/d/new/page.tsx` | 1h | 3.5 |
| 3.7 | Implement export functions (PNG, SVG, .excalidraw, JSON) | `lib/export.ts` | 2h | — |
| 3.8 | Wire export to `EditorMenu` and `DiagramCardContextMenu` | Update both components | 1h | 3.7 |
| 3.9 | Implement import functions (.excalidraw, .yapdraw.json) | `lib/import.ts` | 1.5h | — |
| 3.10 | Wire import to `NewDiagramDropdown` — file picker flow | Update `NewDiagramDropdown.tsx` | 1h | 3.9 |
| 3.11 | Bulk export — multi-select → ZIP download | Wire `exportBulkAsZip` to `BulkActionBar` | 1h | 3.7, 2.13 |
| 3.12 | Build `useKeyboardShortcuts` hook + wire to Library and Editor | `hooks/useKeyboardShortcuts.ts`, update both pages | 1.5h | — |
| 3.13 | Folder colors + icons — integrate pickers into folder context menu | Update `FolderContextMenu.tsx` | 1.5h | 2.3 |
| 3.14 | Responsive layout — sidebar drawer on mobile, grid 1-2 cols, editor stacked | Update `LibraryView.tsx`, `Sidebar.tsx`, `app/d/[id]/page.tsx` | 3h | — |
| 3.15 | Lock feature — lock icon on card, prevent voice generation + manual edits | Update `DiagramCard.tsx`, `EditorTopBar.tsx`, editor page | 1h | — |

**Sprint 3 Acceptance Criteria:**
- Version history panel shows past versions with timestamps
- Restore a version (current state auto-saved first)
- 9 templates available in "New Diagram → From Template"
- Export any diagram as PNG/SVG/.excalidraw/JSON from editor or library
- Import .excalidraw files into the library
- `/` focuses search, `Ctrl+S` force saves, `Ctrl+N` creates new diagram
- Library is usable on mobile (sidebar collapses, grid adapts)

---

## Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| IndexedDB reads on every render | Dexie `useLiveQuery` is reactive — only re-queries when the observed table changes. No polling. |
| Large element arrays in memory | Only the currently-viewed diagram loads `elements[]`. Library grid only reads `id`, `name`, `thumbnail`, `metadata`, `tags`, `updatedAt`. Use Dexie `.toCollection().primaryKeys()` + `.bulkGet()` pattern for sparse reads if needed. |
| Thumbnail generation lag | Skip thumbnail on save if `elements.length > 2000`. Generate on editor close instead. Use `quality: 0.5` and `maxWidthOrHeight: 400`. |
| Search over transcripts | Client-side substring search is fine up to ~10k diagrams. Beyond that, add a `searchIndex` field (lowercased concat of name + tags + first 500 chars of transcript) and index it in Dexie. |
| Version history bloat | Auto-prune runs on editor open. Labeled versions are never pruned. Pruning keeps: all <24h, 1/day for 7d, 1/week for 4w, 1/month after. |
| Multi-tab conflicts | Dexie fires `onChanges` across tabs via `BroadcastChannel`. `useLiveQuery` auto-refreshes. For the same diagram open in two tabs, show a warning banner but don't block — last-write-wins is acceptable for a local-first app. |
| Bundle size from new deps | `dexie`: ~45KB min. `nanoid`: ~400B. `@dnd-kit`: ~25KB. `file-saver`: ~3KB. `jszip`: ~45KB (lazy-loaded only on bulk export). Total: ~75KB upfront + 45KB lazy. |

---

## Testing Checklist

### Migration
- [ ] App with existing localStorage diagram → opens Library → shows "My First Diagram" card
- [ ] App with empty localStorage → opens Library → shows empty state
- [ ] Migration only runs once (second load doesn't duplicate)

### Library CRUD
- [ ] Create blank diagram → appears in Library grid
- [ ] Create from template → opens editor with pre-populated elements
- [ ] Rename diagram from Library card context menu
- [ ] Rename diagram from Editor top bar
- [ ] Duplicate diagram → copy appears with "(copy)" suffix
- [ ] Delete diagram → moves to Trash → visible in Trash view
- [ ] Restore from Trash → returns to original folder (or root if folder deleted)
- [ ] Permanently delete → gone from Trash, versions cleaned up
- [ ] Empty Trash → all trashed diagrams permanently deleted

### Folders
- [ ] Create folder → appears in sidebar
- [ ] Create subfolder → nested correctly, max 3 levels enforced
- [ ] Move diagram to folder via drag-and-drop
- [ ] Move diagram to folder via context menu → Move to
- [ ] Delete folder → diagrams move to root
- [ ] Rename folder, change color, change icon
- [ ] Folder shows correct diagram count badge
- [ ] Circular folder nesting blocked (can't move folder into its own child)

### Search + Sort + Filter
- [ ] Search by name → results highlight match
- [ ] Search by tag → results show correct diagrams
- [ ] Search by transcript text → snippet shows matched excerpt
- [ ] Sort by each of 6 fields, ascending and descending
- [ ] Star a diagram → appears in Starred section
- [ ] Sort and view mode preferences persist across reloads

### Auto-Save + Version History
- [ ] Edit diagram → "Saved Xm ago" updates in top bar
- [ ] Force save via Ctrl+S → version snapshot created
- [ ] Version history panel shows correct version list
- [ ] Restore old version → canvas updates, current state saved as new version first
- [ ] Version pruning runs and reduces old entries

### Export + Import
- [ ] Export PNG → valid image downloads
- [ ] Export SVG → valid SVG downloads
- [ ] Export .excalidraw → opens correctly at excalidraw.com
- [ ] Export JSON → valid YapDraw JSON
- [ ] Import .excalidraw → creates diagram with correct elements
- [ ] Bulk export → ZIP contains all selected diagrams