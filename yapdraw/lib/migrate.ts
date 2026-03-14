import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram } from '@/types/library'

const OLD_STORAGE_KEY = 'yapdraw_elements'
const MIGRATION_FLAG = 'yapdraw_migrated_v1'

export async function migrateFromLocalStorage(): Promise<string | null> {
  if (typeof window === 'undefined') return null

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
        colorPalette: [
          ...new Set(
            elements
              .map((e: any) => e.backgroundColor)
              .filter(Boolean),
          ),
        ].slice(0, 6),
        generatedVia: 'voice',
      },
    }

    await db.diagrams.add(diagram)
    localStorage.removeItem(OLD_STORAGE_KEY)
    localStorage.setItem(MIGRATION_FLAG, '1')

    // eslint-disable-next-line no-console
    console.log(`Migrated localStorage diagram as "${diagram.name}" (${id})`)
    return id
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', err)
    localStorage.setItem(MIGRATION_FLAG, '1')
    return null
  }
}

