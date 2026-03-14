import { NextRequest } from 'next/server'
import { generateDiagram } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { transcript?: string }

    if (typeof body.transcript !== 'string' || !body.transcript.trim()) {
      return Response.json(
        { error: 'transcript is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const elements = await generateDiagram(body.transcript)

    return Response.json({ elements })
  } catch (error) {
    console.error('generate-diagram error:', error)

    // Handle JSON parse errors from LLM
    if (error instanceof Error && error.message.includes('Invalid JSON')) {
      return Response.json(
        { error: 'Failed to parse diagram from LLM response' },
        { status: 500 }
      )
    }

    // Handle timeout/connection errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return Response.json(
        { error: 'LLM request timed out, please try again' },
        { status: 503 }
      )
    }

    return Response.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    )
  }
}
