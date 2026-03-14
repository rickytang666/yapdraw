import OpenAI from 'openai'
import { ExcalidrawElement, LLMResponse } from '@/types/diagram'
import { SYSTEM_PROMPT } from './prompts'

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1',
  apiKey: process.env.LLM_API_KEY || 'EMPTY',
})

const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-120b'

/**
 * Extract JSON from a string that may be wrapped in markdown code fences
 */
function extractJSON(content: string): string {
  // Try to find JSON in markdown code fence
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Try to find a JSON object directly
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return content
}

// Fields the LLM understands — strip Excalidraw internal metadata before sending
const LLM_FIELDS = new Set([
  'type', 'id', 'x', 'y', 'width', 'height',
  'points', 'strokeColor', 'backgroundColor', 'fillStyle',
  'strokeWidth', 'roundness', 'label', 'text', 'fontSize',
  'startBinding', 'endBinding', 'startArrowhead', 'endArrowhead',
  'opacity',
])

function stripToLLMFields(el: ExcalidrawElement): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of LLM_FIELDS) {
    if (key in el) out[key] = (el as Record<string, unknown>)[key]
  }
  return out
}

/**
 * Generate Excalidraw diagram elements from a transcript
 */
export async function generateDiagram(
  transcript: string,
  currentElements: ExcalidrawElement[]
): Promise<ExcalidrawElement[]> {
  // Strip Excalidraw internal fields (version, versionNonce, seed, boundElements, etc.)
  // so the LLM only sees the fields it knows how to reproduce
  const cleanElements = currentElements
    .filter(el => el.type !== 'delete')
    .map(stripToLLMFields)

  const currentState =
    cleanElements.length > 0
      ? JSON.stringify(cleanElements, null, 2)
      : 'Empty diagram (no existing elements)'

  const userMessage = `Current diagram state:
${currentState}

User's description:
${transcript}

Generate a complete diagram that accurately reflects everything described. Include every distinct component or step mentioned — do not summarize or collapse steps.`

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 16000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    console.warn('LLM returned empty content')
    return []
  }

  // Parse JSON (with fallback for markdown-wrapped responses)
  const jsonStr = extractJSON(content)
  let parsed: LLMResponse

  try {
    parsed = JSON.parse(jsonStr) as LLMResponse
  } catch (err) {
    console.error('Failed to parse LLM response as JSON:', content)
    throw new Error('Invalid JSON response from LLM')
  }

  if (!Array.isArray(parsed.elements)) {
    console.warn('LLM response missing elements array:', parsed)
    return []
  }

  // Filter out elements without valid IDs
  const validElements = parsed.elements.filter(
    (el): el is ExcalidrawElement =>
      typeof el === 'object' &&
      el !== null &&
      typeof el.id === 'string' &&
      el.id.length > 0
  )

  if (validElements.length !== parsed.elements.length) {
    console.warn(
      `Filtered ${parsed.elements.length - validElements.length} invalid elements`
    )
  }

  return validElements
}
