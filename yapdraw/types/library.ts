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
