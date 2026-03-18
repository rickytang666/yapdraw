'use client'

import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Folder, FolderColor } from '@/types/library'

export interface FolderNode extends Folder {
  children: FolderNode[]
  depth: number
  diagramCount: number
}

function buildTree(folders: Folder[], diagramCounts: Record<string, number>): FolderNode[] {
  const map = new Map<string, FolderNode>()

  for (const f of folders) {
    map.set(f.id, { ...f, children: [], depth: 0, diagramCount: diagramCounts[f.id] || 0 })
  }

  const roots: FolderNode[] = []

  for (const node of map.values()) {
    if (node.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(node.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  }

  function setDepths(nodes: FolderNode[], depth: number) {
    for (const n of nodes) {
      n.depth = depth
      setDepths(n.children, depth + 1)
    }
  }

  setDepths(roots, 0)

  function sortByOrder(nodes: FolderNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const n of nodes) sortByOrder(n.children)
  }

  sortByOrder(roots)

  return roots
}

function getDepth(folders: Folder[], parentId: string | null): number {
  if (parentId === null) return 0
  const parent = folders.find(f => f.id === parentId)
  if (!parent) return 0
  return 1 + getDepth(folders, parent.parentId)
}

function getAllDescendantIds(folders: Folder[], id: string): string[] {
  const children = folders.filter(f => f.parentId === id)
  const childIds = children.map(c => c.id)
  const deeper = childIds.flatMap(cid => getAllDescendantIds(folders, cid))
  return [...childIds, ...deeper]
}

function wouldCreateCycle(folders: Folder[], id: string, newParentId: string): boolean {
  let current: string | null = newParentId
  while (current !== null) {
    if (current === id) return true
    const parent = folders.find(f => f.id === current)
    current = parent?.parentId ?? null
  }
  return false
}

export function useFolders() {
  const rawFolders = useLiveQuery(() => db.folders.orderBy('sortOrder').toArray(), [])
  const allDiagrams = useLiveQuery(() => db.diagrams.filter(d => d.trashedAt === null).toArray(), [])

  const folders: Folder[] = rawFolders || []

  const diagramCounts = useMemo(() =>
    (allDiagrams || []).reduce<Record<string, number>>((acc, d) => {
      if (d.folderId) {
        acc[d.folderId] = (acc[d.folderId] || 0) + 1
      }
      return acc
    }, {}),
  [allDiagrams])

  const tree: FolderNode[] = useMemo(
    () => buildTree(folders, diagramCounts),
    [folders, diagramCounts]
  )

  const createFolder = useCallback(async (name: string, parentId?: string): Promise<string> => {
    const currentFolders = await db.folders.toArray()
    const resolvedParentId = parentId ?? null

    if (resolvedParentId !== null) {
      const depth = getDepth(currentFolders, resolvedParentId)
      if (depth >= 2) {
        throw new Error('Maximum folder depth of 3 exceeded')
      }
    }

    const siblings = currentFolders.filter(f => f.parentId === resolvedParentId)
    const maxOrder = siblings.reduce((max, f) => Math.max(max, f.sortOrder), -1)

    const id = nanoid()
    const now = Date.now()

    await db.folders.add({
      id,
      name,
      parentId: resolvedParentId,
      color: null,
      icon: null,
      createdAt: now,
      updatedAt: now,
      sortOrder: maxOrder + 1,
    })

    return id
  }, [])

  const renameFolder = useCallback(async (id: string, name: string): Promise<void> => {
    await db.folders.update(id, { name, updatedAt: Date.now() })
  }, [])

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    const currentFolders = await db.folders.toArray()
    const descendantIds = getAllDescendantIds(currentFolders, id)
    const allToDelete = [id, ...descendantIds]

    await db.transaction('rw', [db.diagrams, db.folders], async () => {
      await db.diagrams.where('folderId').anyOf(allToDelete).modify({ folderId: null, updatedAt: Date.now() })
      await db.folders.bulkDelete(allToDelete)
    })
  }, [])

  const moveFolder = useCallback(async (id: string, newParentId: string | null): Promise<void> => {
    const currentFolders = await db.folders.toArray()

    if (newParentId !== null && wouldCreateCycle(currentFolders, id, newParentId)) {
      throw new Error('Cannot move a folder into one of its own descendants')
    }

    if (newParentId !== null) {
      const parentDepth = getDepth(currentFolders, newParentId)
      if (parentDepth >= 2) {
        throw new Error('Maximum folder depth of 3 would be exceeded')
      }
    }

    const siblings = currentFolders.filter(f => f.parentId === newParentId && f.id !== id)
    const maxOrder = siblings.reduce((max, f) => Math.max(max, f.sortOrder), -1)

    await db.folders.update(id, { parentId: newParentId, sortOrder: maxOrder + 1, updatedAt: Date.now() })
  }, [])

  const reorderFolders = useCallback(async (orderedIds: string[]): Promise<void> => {
    await db.transaction('rw', db.folders, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.folders.update(orderedIds[i], { sortOrder: i, updatedAt: Date.now() })
      }
    })
  }, [])

  const setFolderColor = useCallback(async (id: string, color: FolderColor | null): Promise<void> => {
    await db.folders.update(id, { color, updatedAt: Date.now() })
  }, [])

  return {
    tree,
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    reorderFolders,
    setFolderColor,
  }
}
