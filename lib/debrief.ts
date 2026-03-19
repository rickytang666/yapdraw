import type { GraphResponse, ExcalidrawElement } from '@/types/diagram'

const SHAPE_TYPES = new Set(['rectangle', 'diamond', 'ellipse'])


// computes a plain-text summary of user manual edits since the last ai generation.
// called lazily right before sending to the llm — never runs on every onChange.
export function buildDebrief(
  elements: ExcalidrawElement[],
  lastGraph: GraphResponse,
): string | null {
  const canvasNodeIds = new Set<string>()
  const canvasEdgeKeys = new Set<string>() // "from→to"
  const nodeLabelMap = new Map<string, string>() // nodeId → current canvas label

  for (const el of elements) {
    if (el.isDeleted) continue
    const yd = el.customData?.yapdraw
    if (!yd) continue

    if (yd.type === 'node') {
      canvasNodeIds.add(yd.id)
      const label = el.label?.text ?? ''
      if (label) nodeLabelMap.set(yd.id, label)
    } else if (yd.type === 'edge') {
      canvasEdgeKeys.add(`${yd.from}→${yd.to}`)
    }
    // icons and groups are ignored
  }

  const lines: string[] = []

  // deleted nodes
  const deletedNodes = lastGraph.nodes.filter(n => !canvasNodeIds.has(n.id))
  if (deletedNodes.length > 0) {
    lines.push(`deleted nodes: ${deletedNodes.map(n => `"${n.label}"`).join(', ')}`)
  }

  // deleted edges
  const deletedEdges = lastGraph.edges.filter(
    e => !canvasEdgeKeys.has(`${e.from}→${e.to}`)
  )
  if (deletedEdges.length > 0) {
    const nodeLabel = (id: string) =>
      lastGraph.nodes.find(n => n.id === id)?.label ?? id
    lines.push(
      `deleted edges: ${deletedEdges.map(e => `${nodeLabel(e.from)} → ${nodeLabel(e.to)}`).join(', ')}`
    )
  }

  // renamed nodes (label drift)
  const renamed: string[] = []
  for (const node of lastGraph.nodes) {
    const current = nodeLabelMap.get(node.id)
    if (current && current !== node.label) {
      renamed.push(`"${node.label}" → "${current}"`)
    }
  }
  if (renamed.length > 0) {
    lines.push(`renamed: ${renamed.join(', ')}`)
  }

  // manually added shapes (untagged, no containerId, shape type)
  const manualAdds: string[] = []
  for (const el of elements) {
    if (el.isDeleted) continue
    if (el.customData?.yapdraw) continue // ai-generated
    if (!SHAPE_TYPES.has(el.type)) continue
    if (el.containerId) continue // bound text child
    const label = el.label?.text?.trim()
    manualAdds.push(label ? `a ${el.type} labeled "${label}"` : `an unlabeled ${el.type}`)
  }
  if (manualAdds.length > 0) {
    lines.push(`manually added: ${manualAdds.join(', ')}`)
  }

  if (lines.length === 0) return null

  return `Since last generation, the user manually:\n${lines.map(l => `- ${l}`).join('\n')}`
}
