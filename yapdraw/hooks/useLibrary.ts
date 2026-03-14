import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type {
  Diagram, Folder, LibraryState, SidebarSection,
  SortField, SortDirection, ViewMode,
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

  const allDiagrams = useLiveQuery(
    () => db.diagrams.filter(d => d.trashedAt === null).toArray(),
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

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase()
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.transcript.toLowerCase().includes(q)
      )
    }

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

  // ─── Navigation ───────────────────────────────────────────

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

  const purgeExpiredTrash = useCallback(async () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    const expired = await db.diagrams
      .filter(d => d.trashedAt !== null && d.trashedAt! < cutoff)
      .toArray()

    if (expired.length === 0) return

    await db.transaction('rw', [db.diagrams, db.versions], async () => {
      for (const d of expired) {
        await db.versions.where('diagramId').equals(d.id).delete()
      }
      await db.diagrams.bulkDelete(expired.map(d => d.id))
    })
  }, [])

  return {
    state,
    diagrams,
    folders: (folders || []) as Folder[],
    trashedCount: trashedDiagrams?.length || 0,

    setSection, setViewMode, setSort, setSearch,
    toggleSelect, clearSelection,

    renameDiagram, starDiagram, lockDiagram, moveDiagram,
    duplicateDiagram, trashDiagram, restoreDiagram,
    permanentlyDelete, emptyTrash, setTags,

    bulkMove, bulkTrash, bulkStar, bulkTag,
    purgeExpiredTrash,
  }
}
