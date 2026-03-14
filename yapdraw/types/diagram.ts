// Elements are native Excalidraw JSON — the LLM generates them directly.
// We use a loose type here and rely on Excalidraw's own runtime validation.
// The only constraint we enforce: every element must have a stable kebab-case id.
export type ExcalidrawElement = Record<string, any> & { id: string }

export interface LLMResponse {
  elements: ExcalidrawElement[]
}
