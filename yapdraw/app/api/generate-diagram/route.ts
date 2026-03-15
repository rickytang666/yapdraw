import { NextRequest } from 'next/server'
import { generateDiagram } from '@/lib/llm'
import type { GraphResponse } from '@/types/diagram'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transcript?: string; currentGraph?: GraphResponse }

    if (typeof body.transcript !== 'string' || !body.transcript.trim()) {
      return Response.json(
        { error: 'transcript is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const { elements, graph } = await generateDiagram(body.transcript, body.currentGraph)
    return Response.json({ elements, graph })
  } catch (error) {
    // Expected: LLM refused to generate or returned non-diagram content — silently skip
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
