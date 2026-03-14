// Raw Excalidraw element (native format after layout)
export type ExcalidrawElement = Record<string, any> & { id: string }

export interface LLMResponse {
  elements: ExcalidrawElement[]
}

// ── Graph format (what the LLM now outputs) ───────────────────────────────

export type NodeShape = 'rectangle' | 'diamond' | 'ellipse'
export type NodeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'yellow' | 'grey'
export type LayoutDirection = 'LR' | 'TB'

export interface GraphNode {
  id: string
  label: string
  shape?: NodeShape
  color?: NodeColor
  group?: string // matches a GraphGroup id
}

export interface GraphEdge {
  from: string
  to: string
  label?: string
}

export interface GraphGroup {
  id: string
  label: string
  color?: NodeColor
  nodes: string[] // node ids that belong to this group
}

export interface GraphResponse {
  direction?: LayoutDirection // 'LR' for architectures, 'TB' for flowcharts
  nodes: GraphNode[]
  edges: GraphEdge[]
  groups?: GraphGroup[]
  remove?: { nodes?: string[] } // node ids to explicitly delete (incremental updates only)
}
