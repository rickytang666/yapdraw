import { NextRequest } from 'next/server'
import { generateDiagram } from '@/lib/llm'
import type { ProviderConfig } from '@/lib/llm'
import type { GraphResponse } from '@/types/diagram'
import type { DiagramType } from '@/types/library'

function isAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  // openai sdk surfaces 401/403 in the message
  return msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('invalid api key')
}

export async function POST(request: NextRequest) {
  try {
    let body: {
      transcript?: string
      currentGraph?: GraphResponse
      diagramType?: DiagramType
      manualEditDebrief?: { text: string; deletedNodeIds: string[]; deletedEdgeKeys: Array<{ from: string; to: string }> }
      providerConfig?: ProviderConfig
    }

    try {
      body = await request.json()
    } catch {
      return Response.json(
        { error: 'request body must be valid JSON' },
        { status: 400 }
      )
    }

    if (typeof body.transcript !== 'string' || !body.transcript.trim()) {
      return Response.json(
        { error: 'transcript is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const args = [body.transcript, body.currentGraph, body.diagramType, body.manualEditDebrief] as const

    try {
      const { elements, graph, files } = await generateDiagram(...args, body.providerConfig)
      return Response.json({ elements, graph, files })
    } catch (err) {
      // invalid user key — silently fall back to groq
      if (isAuthError(err) && body.providerConfig?.apiKey) {
        const { elements, graph, files } = await generateDiagram(...args, null)
        return Response.json({ elements, graph, files, usedFallback: true })
      }
      throw err
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('empty graph')) {
      return Response.json({ skipped: true })
    }
    if (error instanceof Error && error.message.includes('timeout')) {
      return Response.json({ error: 'LLM request timed out' }, { status: 503 })
    }

    console.error('generate-diagram error:', error)
    return Response.json({ error: 'Failed to generate diagram' }, { status: 500 })
  }
}
