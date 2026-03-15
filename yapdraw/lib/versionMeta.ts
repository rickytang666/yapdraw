export interface AIVersionMeta {
  prompt: string
  summary: string
  source: 'ai'
}

export function encodeAIMeta(meta: AIVersionMeta): string {
  return JSON.stringify(meta)
}

export function decodeAIMeta(label: string | null): AIVersionMeta | null {
  if (!label) return null
  try {
    const parsed = JSON.parse(label)
    return parsed.source === 'ai' ? (parsed as AIVersionMeta) : null
  } catch {
    return null
  }
}
