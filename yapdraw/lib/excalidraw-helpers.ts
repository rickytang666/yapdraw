import { ExcalidrawElement } from '@/types/diagram'

// Valid Excalidraw element types — filter out any pseudo-types the LLM might hallucinate
const VALID_TYPES = new Set([
  'rectangle', 'ellipse', 'diamond', 'arrow', 'line', 'text', 'image', 'frame', 'freedraw',
])

/**
 * Converts LLM arrow format to the skeleton format expected by convertToExcalidrawElements.
 *
 * The LLM outputs: startBinding: { elementId, fixedPoint }
 * convertToExcalidrawElements expects: start: { id }
 *
 * If we pass startBinding/endBinding directly, convertToExcalidrawElements treats them as
 * already-native data and skips setting up boundElements on the target shapes — so arrows
 * appear visually correct but don't actually snap/bind.
 *
 * Call this BEFORE convertToExcalidrawElements.
 */
export function prepareForConversion(elements: ExcalidrawElement[]): ExcalidrawElement[] {
  return elements.map((el) => {
    if (el.type !== 'arrow' && el.type !== 'line') return el
    const out: Record<string, unknown> = { ...el }
    if (el.startBinding && typeof el.startBinding === 'object' && (el.startBinding as Record<string, unknown>).elementId) {
      out.start = { id: (el.startBinding as Record<string, unknown>).elementId }
      delete out.startBinding
    }
    if (el.endBinding && typeof el.endBinding === 'object' && (el.endBinding as Record<string, unknown>).elementId) {
      out.end = { id: (el.endBinding as Record<string, unknown>).elementId }
      delete out.endBinding
    }
    return out as ExcalidrawElement
  })
}

/**
 * Merges incoming LLM elements with existing scene elements.
 * - Shape elements (matched by id) keep their x, y, width, height (preserves manual drags)
 * - Arrow positions are NOT preserved — their coordinates must stay consistent with `points`
 * - Invalid/pseudo element types are filtered out
 * - New elements are nudged apart if their bounding boxes overlap >50%
 */
export function mergeElements(
  existing: ExcalidrawElement[],
  incoming: ExcalidrawElement[]
): ExcalidrawElement[] {
  const existingById = new Map(existing.map((el) => [el.id, el]))

  const merged = incoming
    .filter(el => VALID_TYPES.has(el.type))
    .map((el) => {
      const normalized = normalizeLinearElement(el)
      const prev = existingById.get(normalized.id)
      // Don't preserve positions for arrows — their x/y must match their points array
      if (!prev || normalized.type === 'arrow' || normalized.type === 'line') return normalized
      return {
        ...normalized,
        x: prev.x ?? normalized.x,
        y: prev.y ?? normalized.y,
        width: prev.width ?? normalized.width,
        height: prev.height ?? normalized.height,
      }
    })

  return nudgeOverlapping(merged)
}

/**
 * Normalizes elements coming from the LLM:
 * - Arrows/lines: ensure points array exists, fill in missing visual defaults
 * - Shapes: ensure label has centered alignment defaults
 */
function normalizeLinearElement(el: ExcalidrawElement): ExcalidrawElement {
  // Inject label alignment defaults so text renders centered, not top-left
  if (el.label && typeof el.label === 'object') {
    el = {
      ...el,
      label: { textAlign: 'center', verticalAlign: 'middle', ...el.label },
    }
  }

  if (el.type !== 'arrow' && el.type !== 'line') return el

  // Arrow defaults: fill in what the LLM commonly omits
  let withDefaults: ExcalidrawElement = {
    strokeColor: '#1e1e1e',
    strokeWidth: 2,
    endArrowhead: 'arrow',
    ...el,
  }

  // Excalidraw binding requires focus + gap alongside fixedPoint.
  // The LLM only sends { elementId, fixedPoint } — add the missing fields.
  if (withDefaults.startBinding && typeof withDefaults.startBinding === 'object') {
    withDefaults = {
      ...withDefaults,
      startBinding: { focus: 0, gap: 1, ...withDefaults.startBinding },
    }
  }
  if (withDefaults.endBinding && typeof withDefaults.endBinding === 'object') {
    withDefaults = {
      ...withDefaults,
      endBinding: { focus: 0, gap: 1, ...withDefaults.endBinding },
    }
  }

  if (!Array.isArray(withDefaults.points) || withDefaults.points.length < 2) {
    // Default: a short horizontal line — Excalidraw will recompute once bindings resolve
    return { ...withDefaults, points: [[0, 0], [1, 0]] }
  }

  // Ensure first point is [0, 0] — Excalidraw throws "not normalized" if it isn't
  const [p0x, p0y] = withDefaults.points[0] as [number, number]
  if (p0x !== 0 || p0y !== 0) {
    return {
      ...withDefaults,
      x: (withDefaults.x ?? 0) + p0x,
      y: (withDefaults.y ?? 0) + p0y,
      points: (withDefaults.points as [number, number][]).map(([px, py]) => [px - p0x, py - p0y]),
    }
  }

  return withDefaults
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
