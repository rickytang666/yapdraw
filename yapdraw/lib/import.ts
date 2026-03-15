import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram, DiagramType } from '@/types/library'
import type { ExcalidrawElement } from '@/types/diagram'

export async function importExcalidrawFile(file: File): Promise<string> {
  const text = await file.text()
  const parsed = JSON.parse(text)

  const elements: ExcalidrawElement[] = Array.isArray(parsed.elements) ? parsed.elements : []
  const name = file.name.replace(/\.excalidraw$/i, '') || 'Imported Diagram'

  const id = nanoid()
  const now = Date.now()

  const diagram: Diagram = {
    id,
    name,
    folderId: null,
    elements,
    transcript: '',
    diagramType: 'freeform',
    thumbnail: null, files: {},
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
      arrowCount: elements.filter(e => e.type === 'arrow').length,
      colorPalette: [],
      generatedVia: 'import',
    },
  }

  await db.diagrams.add(diagram)
  return id
}

export async function importYapDrawJSON(file: File): Promise<string> {
  const text = await file.text()
  const parsed = JSON.parse(text)

  const elements: ExcalidrawElement[] = Array.isArray(parsed.elements) ? parsed.elements : []
  const name: string = typeof parsed.name === 'string' && parsed.name.trim()
    ? parsed.name.trim()
    : file.name.replace(/\.json$/i, '') || 'Imported Diagram'

  const validTypes: DiagramType[] = ['freeform', 'system-architecture', 'operations-flowchart']
  const diagramType: DiagramType =
    validTypes.includes(parsed.diagramType) ? parsed.diagramType : 'freeform'

  const id = nanoid()
  const now = Date.now()

  const diagram: Diagram = {
    id,
    name,
    folderId: null,
    elements,
    transcript: typeof parsed.transcript === 'string' ? parsed.transcript : '',
    diagramType,
    thumbnail: null, files: {},
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
      arrowCount: elements.filter(e => e.type === 'arrow').length,
      colorPalette: Array.isArray(parsed.metadata?.colorPalette) ? parsed.metadata.colorPalette : [],
      generatedVia: 'import',
    },
  }

  await db.diagrams.add(diagram)
  return id
}
