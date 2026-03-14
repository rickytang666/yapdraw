import { ExcalidrawElement } from './diagram'

export type DiagramType = 'architecture' | 'flowchart' | 'sequence' | 'er' | 'freeform'
export type GenerationMethod = 'voice' | 'manual' | 'template' | 'import'
export type SortField = 'updatedAt' | 'lastOpenedAt' | 'createdAt' | 'name' | 'diagramType' | 'elementCount'
export type SortDirection = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'

export type SidebarSection = 'all' | 'starred' | 'recent' | 'trash' | `folder:${string}`

export const FOLDER_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
  'blue',
  'purple',
] as const

export type FolderColor = (typeof FOLDER_COLORS)[number]

export interface DiagramMetadata {
  elementCount: number
  arrowCount: number
  colorPalette: string[]
  generatedVia: GenerationMethod
}

export interface Diagram {
  id: string
  name: string
  folderId: string | null
  elements: ExcalidrawElement[]
  transcript: string
  diagramType: DiagramType
  thumbnail: string | null
  tags: string[]
  starred: boolean
  locked: boolean
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
  version: number
  trashedAt: number | null
  metadata: DiagramMetadata
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  color: FolderColor | null
  icon: string | null
  createdAt: number
  updatedAt: number
  sortOrder: number
}

export interface DiagramVersion {
  id: string
  diagramId: string
  version: number
  elements: ExcalidrawElement[]
  transcript: string
  savedAt: number
  label: string | null
}

export interface DiagramTemplate {
  id: string
  name: string
  category: 'architecture' | 'flowchart' | 'data' | 'blank'
  description: string
  elements: ExcalidrawElement[]
  suggestedType: DiagramType
}

export interface LibraryState {
  activeSection: SidebarSection
  viewMode: ViewMode
  sortField: SortField
  sortDirection: SortDirection
  searchQuery: string
  selectedIds: Set<string>
}

