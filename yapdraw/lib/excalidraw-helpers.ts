import { ExcalidrawElement } from '@/types/diagram'

/**
 * Merges incoming LLM elements with existing scene elements.
 * - Existing elements (matched by id) keep their x, y, width, height (preserves manual drags)
 * - New elements are added at LLM-provided positions
 */
export function mergeElements(
  existing: ExcalidrawElement[],
  incoming: ExcalidrawElement[]
): ExcalidrawElement[] {
  const existingById = new Map(existing.map((el) => [el.id, el]))

  return incoming.map((el) => {
    const prev = existingById.get(el.id)
    if (!prev) return el
    return {
      ...el,
      x: prev.x ?? el.x,
      y: prev.y ?? el.y,
      width: prev.width ?? el.width,
      height: prev.height ?? el.height,
    }
  })
}
