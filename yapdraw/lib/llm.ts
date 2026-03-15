import OpenAI from 'openai'
import type { ExcalidrawElement, GraphResponse } from '@/types/diagram'
import type { DiagramType } from '@/types/library'
import { getSystemPrompt } from './prompts'
import { layoutGraph } from './layout'

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1',
  apiKey: process.env.LLM_API_KEY || 'EMPTY',
})

const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b'

function extractJSON(content: string): string {
  // Strip code fences first
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Find the outermost balanced JSON object
  const start = content.indexOf('{')
  if (start === -1) return content
  let depth = 0
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) return content.slice(start, i + 1)
    }
  }
  // Truncated JSON — return what we have from the first brace
  return content.slice(start)
}

export async function generateDiagram(
  transcript: string,
  currentGraph?: GraphResponse | null,
  diagramType: DiagramType = 'freeform',
): Promise<{ elements: ExcalidrawElement[]; graph: GraphResponse }> {
  const userMessage = currentGraph
    ? `Current diagram:\n${JSON.stringify(currentGraph)}\n\nLatest instruction:\n${transcript}`
    : transcript

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: getSystemPrompt(diagramType) },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 8000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('LLM returned empty content')

  const jsonStr = extractJSON(content)
  let graph: GraphResponse

  try {
    graph = JSON.parse(jsonStr) as GraphResponse
  } catch {
    console.warn('Failed to parse LLM response as JSON:', content)
    if (currentGraph && currentGraph.nodes.length > 0) {
      console.warn('Falling back to current graph')
      return { elements: layoutGraph(currentGraph), graph: currentGraph }
    }
    throw new Error('LLM returned empty graph')
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    const intentionalClear = (graph.remove?.nodes?.length ?? 0) > 0
    if (currentGraph && currentGraph.nodes.length > 0 && !intentionalClear) {
      // LLM lost its way (no explicit remove signal) — fall back to unchanged current graph
      console.warn('LLM returned empty nodes on incremental update; keeping current graph')
      graph = currentGraph
    } else if (!intentionalClear) {
      console.error('LLM returned empty graph. Parsed:', JSON.stringify(graph))
      console.error('Raw content:', content)
      throw new Error('LLM returned empty graph')
    }
    // intentionalClear: user said "delete everything" — allow empty graph through
  }

  // Safety merge: if this was an incremental update and the LLM kept at least one
  // existing node ID, restore any nodes/edges it accidentally dropped.
  // Nodes listed in graph.remove are intentional deletions — never restore those.
  // If zero IDs match, the LLM intentionally redesigned — don't merge.
  if (currentGraph) {
    const explicitlyRemovedNodes = new Set(graph.remove?.nodes ?? [])
    const explicitlyRemovedEdgeKeys = new Set(
      (graph.remove?.edges ?? []).map(e => `${e.from}|${e.to}`)
    )
    const llmNodeIds = new Set(graph.nodes.map(n => n.id))
    const overlap = currentGraph.nodes.filter(n => llmNodeIds.has(n.id) || explicitlyRemovedNodes.has(n.id)).length
    if (overlap > 0) {
      const restoredNodes = currentGraph.nodes.filter(
        n => !llmNodeIds.has(n.id) && !explicitlyRemovedNodes.has(n.id),
      )
      const allNodeIds = new Set([...graph.nodes, ...restoredNodes].map(n => n.id))
      const llmEdgeKeys = new Set(graph.edges.map(e => `${e.from}|${e.to}`))
      const restoredEdges = (currentGraph.edges ?? []).filter(
        e =>
          !llmEdgeKeys.has(`${e.from}|${e.to}`) &&
          !explicitlyRemovedEdgeKeys.has(`${e.from}|${e.to}`) &&
          !explicitlyRemovedNodes.has(e.from) &&
          !explicitlyRemovedNodes.has(e.to) &&
          allNodeIds.has(e.from) &&
          allNodeIds.has(e.to),
      )
      graph = {
        direction: graph.direction ?? currentGraph.direction,
        nodes: [...graph.nodes, ...restoredNodes],
        edges: [...graph.edges, ...restoredEdges],
        groups: (graph.groups && graph.groups.length > 0) ? graph.groups : (currentGraph.groups ?? []),
      }
    }
  }

  return { elements: layoutGraph(graph), graph }
}
