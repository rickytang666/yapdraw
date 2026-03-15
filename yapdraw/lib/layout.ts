import dagre from 'dagre'
import type { GraphResponse, NodeColor, NodeShape, ExcalidrawElement } from '@/types/diagram'

// ── Sizing ────────────────────────────────────────────────────────────────

const SHAPE_SIZE: Record<NodeShape, { w: number; h: number }> = {
  rectangle: { w: 160, h: 70 },
  diamond:   { w: 160, h: 100 },
  ellipse:   { w: 140, h: 60 },
}

// ── Color palette ─────────────────────────────────────────────────────────

const COLORS: Record<NodeColor, { fill: string; stroke: string }> = {
  blue:   { fill: '#a5d8ff', stroke: '#1971c2' },
  green:  { fill: '#b2f2bb', stroke: '#2f9e44' },
  purple: { fill: '#d0bfff', stroke: '#6741d9' },
  orange: { fill: '#ffd8a8', stroke: '#e67700' },
  red:    { fill: '#ffc9c9', stroke: '#c92a2a' },
  teal:   { fill: '#c3fae8', stroke: '#0c8599' },
  yellow: { fill: '#fff3bf', stroke: '#e67700' },
  grey:   { fill: '#f1f3f5', stroke: '#495057' },
}

const GROUP_COLORS: Record<NodeColor, { fill: string; stroke: string }> = {
  blue:   { fill: '#dbe4ff', stroke: '#4dabf7' },
  green:  { fill: '#d3f9d8', stroke: '#69db7c' },
  purple: { fill: '#e5dbff', stroke: '#b197fc' },
  orange: { fill: '#fff4e6', stroke: '#ffa94d' },
  red:    { fill: '#fff5f5', stroke: '#ff8787' },
  teal:   { fill: '#e6fcf5', stroke: '#63e6be' },
  yellow: { fill: '#fff9db', stroke: '#ffe066' },
  grey:   { fill: '#f8f9fa', stroke: '#ced4da' },
}

const GROUP_PADDING = 40

interface Pt { x: number; y: number }
interface Box { x: number; y: number; w: number; h: number; shape: NodeShape }

// ── Main layout function ──────────────────────────────────────────────────

export function layoutGraph(graph: GraphResponse): ExcalidrawElement[] {
  const { nodes, edges, groups = [], direction = 'LR' } = graph

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 60 : 80,
    ranksep: direction === 'LR' ? 120 : 100,
    marginx: 60,
    marginy: 60,
    acyclicer: 'greedy',
    ranker: 'network-simplex',
  })
  g.setDefaultEdgeLabel(() => ({}))

  const nodeIds = new Set(nodes.map(n => n.id))

  for (const node of nodes) {
    const size = SHAPE_SIZE[node.shape ?? 'rectangle']
    g.setNode(node.id, { width: size.w, height: size.h })
  }

  for (const edge of edges) {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to) {
      g.setEdge(edge.from, edge.to)
    }
  }

  dagre.layout(g)

  // ── Collect computed node positions (top-left origin) ──────────────────

  const boxes = new Map<string, Box>()
  for (const node of nodes) {
    const pos = g.node(node.id)
    if (!pos) continue
    const size = SHAPE_SIZE[node.shape ?? 'rectangle']
    boxes.set(node.id, {
      x: Math.round(pos.x - size.w / 2),
      y: Math.round(pos.y - size.h / 2),
      w: size.w,
      h: size.h,
      shape: node.shape ?? 'rectangle',
    })
  }

  const elements: ExcalidrawElement[] = []

  // ── Group background zones (behind nodes) ─────────────────────────────

  for (const group of groups) {
    const memberBoxes = group.nodes.map(id => boxes.get(id)).filter(Boolean) as Box[]
    if (memberBoxes.length === 0) continue

    const minX = Math.min(...memberBoxes.map(b => b.x)) - GROUP_PADDING
    const minY = Math.min(...memberBoxes.map(b => b.y)) - GROUP_PADDING
    const maxX = Math.max(...memberBoxes.map(b => b.x + b.w)) + GROUP_PADDING
    const maxY = Math.max(...memberBoxes.map(b => b.y + b.h)) + GROUP_PADDING

    const gc = GROUP_COLORS[group.color ?? 'grey'] ?? GROUP_COLORS['grey']
    elements.push({
      type: 'rectangle',
      id: `group-${group.id}`,
      x: minX, y: minY,
      width: maxX - minX,
      height: maxY - minY,
      backgroundColor: gc.fill,
      fillStyle: 'solid',
      strokeColor: gc.stroke,
      strokeWidth: 1,
      roundness: null,
      label: { text: group.label, fontSize: 14, verticalAlign: 'top', textAlign: 'left' },
    })
  }

  // ── Nodes ─────────────────────────────────────────────────────────────

  for (const node of nodes) {
    const box = boxes.get(node.id)
    if (!box) continue

    const c = COLORS[node.color ?? 'grey'] ?? COLORS['grey']
    const el: ExcalidrawElement = {
      type: box.shape,
      id: node.id,
      x: box.x, y: box.y,
      width: box.w, height: box.h,
      backgroundColor: c.fill,
      fillStyle: 'solid',
      strokeColor: c.stroke,
      strokeWidth: 2,
      label: { text: node.label, fontSize: 15, textAlign: 'center', verticalAlign: 'middle' },
    }
    if (box.shape === 'rectangle') el.roundness = { type: 3 }
    elements.push(el)
  }

  // ── Edges as UNBOUND arrows (explicit coordinates, no Excalidraw bindings)
  //
  // Why unbound: Excalidraw bound arrows require exact geometric consistency
  // between startBinding/endBinding metadata and the points[] array.
  // One wrong value → "Linear element is not normalized" crash.
  //
  // Dagre already clips edge waypoints to shape boundaries — the first waypoint
  // is on the source shape edge, the last is on the target shape edge.
  // We use these directly as the arrow path. Zero binding complexity.
  // ─────────────────────────────────────────────────────────────────────────

  const edgeCounts = new Map<string, number>()

  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.from === edge.to) continue

    const key = `${edge.from}→${edge.to}`
    const count = edgeCounts.get(key) ?? 0
    edgeCounts.set(key, count + 1)

    const dagreEdge = g.edge({ v: edge.from, w: edge.to })
    const waypoints: Pt[] = dagreEdge?.points ?? []
    if (waypoints.length < 2) continue

    // Dagre waypoints are already clipped to shape edges:
    //   waypoints[0]     = point where arrow leaves source shape
    //   waypoints[last]  = point where arrow enters target shape
    //   waypoints[1..-2] = intermediate routing points (orthogonal bends)
    const start = waypoints[0]
    const rest = waypoints.slice(1)

    // Excalidraw requires points[] as offsets from (x, y), with points[0] = [0, 0]
    const points = [[0, 0], ...rest.map(p => [
      Math.round(p.x - start.x),
      Math.round(p.y - start.y),
    ])]

    const end = waypoints[waypoints.length - 1]
    const width = Math.abs(end.x - start.x) || 1
    const height = Math.abs(end.y - start.y) || 1

    const arrow: ExcalidrawElement = {
      type: 'arrow',
      id: `arrow-${key}-${count}`,
      x: Math.round(start.x),
      y: Math.round(start.y),
      width: Math.round(width),
      height: Math.round(height),
      points,
      strokeColor: '#495057',
      strokeWidth: 2,
      endArrowhead: 'arrow',
      startArrowhead: null,
      // No startBinding/endBinding — unbound arrows never throw normalization errors
    }

    if (edge.label) {
      arrow.label = { text: edge.label, fontSize: 13, textAlign: 'center', verticalAlign: 'middle' }
    }

    elements.push(arrow)
  }

  return elements
}
