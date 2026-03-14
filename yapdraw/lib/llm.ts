import OpenAI from 'openai'
import type { ExcalidrawElement, GraphResponse } from '@/types/diagram'
import { SYSTEM_PROMPT } from './prompts'
import { layoutGraph } from './layout'

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1',
  apiKey: process.env.LLM_API_KEY || 'EMPTY',
})

const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b'

function extractJSON(content: string): string {
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return content
}

export async function generateDiagram(
  transcript: string,
  currentGraph?: GraphResponse | null,
): Promise<{ elements: ExcalidrawElement[]; graph: GraphResponse }> {
  const userMessage = currentGraph
    ? `Current diagram:\n${JSON.stringify(currentGraph)}\n\nLatest instruction:\n${transcript}`
    : transcript

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
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
    console.error('Failed to parse LLM response as JSON:', content)
    throw new Error('Invalid JSON response from LLM')
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    throw new Error('LLM returned empty graph')
  }

  return { elements: layoutGraph(graph), graph }
}
