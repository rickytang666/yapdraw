import Dexie, { type EntityTable } from 'dexie'
import type { Diagram, Folder, DiagramVersion } from '@/types/library'

const db = new Dexie('yapdraw') as Dexie & {
  diagrams: EntityTable<Diagram, 'id'>
  folders: EntityTable<Folder, 'id'>
  versions: EntityTable<DiagramVersion, 'id'>
}

db.version(1).stores({
  diagrams:
    'id, folderId, name, diagramType, starred, createdAt, updatedAt, lastOpenedAt, trashedAt, *tags',
  folders: 'id, parentId, sortOrder',
  versions: 'id, diagramId, version, savedAt, [diagramId+version]',
})

export { db }

