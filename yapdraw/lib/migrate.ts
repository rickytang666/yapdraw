import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram } from '@/types/library'

const LEGACY_STORAGE_KEY = 'yapdraw_elements'
const MIGRATION_DONE_KEY = 'yapdraw_migrated_v1'

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATION_DONE_KEY)) return

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      const elements = JSON.parse(raw)
      if (Array.isArray(elements) && elements.length > 0) {
        const now = Date.now()
        const diagram: Diagram = {
          id: nanoid(),
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
            arrowCount: elements.filter((e: { type?: string }) => e.type === 'arrow').length,
            colorPalette: [],
            generatedVia: 'manual',
          },
        }
        await db.diagrams.add(diagram)
      }
    }
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    localStorage.setItem(MIGRATION_DONE_KEY, '1')
  }
}
