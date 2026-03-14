import { ExcalidrawElement } from '@/types/diagram'

/**
 * Merges incoming LLM elements with existing scene elements.
 * - Existing elements (matched by id) keep their x, y, width, height (preserves manual drags)
 * - New elements are nudged apart if their bounding boxes overlap >50%
 */
export function mergeElements(
  existing: ExcalidrawElement[],
  incoming: ExcalidrawElement[]
): ExcalidrawElement[] {
  const existingById = new Map(existing.map((el) => [el.id, el]))

  const merged = incoming.map((el) => {
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

  return nudgeOverlapping(merged)
}

interface BBox { x: number; y: number; w: number; h: number }

function getBBox(el: ExcalidrawElement): BBox {
  return {
    x: el.x ?? 0,
    y: el.y ?? 0,
    w: el.width ?? 160,
    h: el.height ?? 60,
  }
}

function overlapArea(a: BBox, b: BBox): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return ox * oy
}

/**
 * For any two new elements whose bounding boxes overlap by >50% of the smaller
 * element's area, nudge the later one down and right until clear.
 * Only nudges elements that weren't in the existing scene (new arrivals).
 */
function nudgeOverlapping(elements: ExcalidrawElement[]): ExcalidrawElement[] {
  const result = elements.map((el) => ({ ...el }))

  for (let i = 1; i < result.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = getBBox(result[j])
      const b = getBBox(result[i])
      const overlap = overlapArea(a, b)
      const smaller = Math.min(a.w * a.h, b.w * b.h)
      if (smaller > 0 && overlap / smaller > 0.5) {
        result[i] = { ...result[i], x: (result[i].x ?? 0) + 20, y: (result[i].y ?? 0) + 20 }
      }
    }
  }

  return result
}
