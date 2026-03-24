import { ExcalidrawElement } from "@/types/diagram";

// whitelist real Excalidraw types; LLM may invent pseudo-types
const VALID_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "arrow",
  "line",
  "text",
  "image",
  "frame",
  "freedraw",
]);

// native arrow fields + explicit null bindings — convertToExcalidrawElements half-converts layout arrows → drag normalization crash
export function enrichArrows(arrows: ExcalidrawElement[]): ExcalidrawElement[] {
  const result: ExcalidrawElement[] = [];

  for (const el of arrows) {
    const labelText =
      el.label && typeof el.label === "object"
        ? ((el.label as Record<string, unknown>).text as string | undefined)
        : undefined;
    const labelFontSize =
      el.label && typeof el.label === "object"
        ? (((el.label as Record<string, unknown>).fontSize as
            | number
            | undefined) ?? 13)
        : 13;
    const textId = `${el.id}-label`;

    const points = Array.isArray(el.points)
      ? (el.points as [number, number][])
      : [];
    const last = points.length > 0 ? points[points.length - 1] : [0, 0];
    const midX = (el.x ?? 0) + last[0] / 2;
    const midY = (el.y ?? 0) + last[1] / 2;

    const arrow: ExcalidrawElement = {
      angle: 0,
      opacity: 100,
      roughness: 0,
      fillStyle: "solid",
      strokeStyle: "solid",
      backgroundColor: "transparent",
      seed: Math.floor(Math.random() * 2147483647),
      version: 1,
      versionNonce: Math.floor(Math.random() * 2147483647),
      isDeleted: false as const,
      groupIds: [],
      updated: Date.now(),
      link: null,
      locked: false,
      lastCommittedPoint: null,
      frameId: null,
      ...el,
      boundElements: labelText ? [{ type: "text", id: textId }] : [],
      // null after spread — layout arrows must stay unbound
      startBinding: null,
      endBinding: null,
    };
    delete (arrow as Record<string, unknown>).label;
    result.push(arrow);

    if (labelText) {
      const lineHeight = 1.25;
      result.push({
        type: "text",
        id: textId,
        x: midX,
        y: midY,
        width: labelText.length * labelFontSize * 0.6,
        height: labelFontSize * lineHeight,
        text: labelText,
        containerId: el.id,
        textAlign: "center",
        verticalAlign: "middle",
        fontSize: labelFontSize,
        fontFamily: 1,
        lineHeight,
        baseline: labelFontSize,
        autoResize: true,
        angle: 0,
        opacity: 100,
        strokeColor: "#1e1e1e",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        roughness: 0,
        seed: Math.floor(Math.random() * 2147483647),
        version: 1,
        versionNonce: Math.floor(Math.random() * 2147483647),
        isDeleted: false as const,
        groupIds: [],
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        frameId: null,
      } as ExcalidrawElement);
    }
  }

  return result;
}

// map startBinding/endBinding → start/end ids so convert wires boundElements on target shapes
export function prepareForConversion(
  elements: ExcalidrawElement[],
): ExcalidrawElement[] {
  return elements.map((el) => {
    if (el.type !== "arrow" && el.type !== "line") return el;
    const out: Record<string, unknown> = { ...el };
    if (
      el.startBinding &&
      typeof el.startBinding === "object" &&
      (el.startBinding as Record<string, unknown>).elementId
    ) {
      out.start = {
        id: (el.startBinding as Record<string, unknown>).elementId,
      };
      delete out.startBinding;
    }
    if (
      el.endBinding &&
      typeof el.endBinding === "object" &&
      (el.endBinding as Record<string, unknown>).elementId
    ) {
      out.end = { id: (el.endBinding as Record<string, unknown>).elementId };
      delete out.endBinding;
    }
    return out as ExcalidrawElement;
  });
}

export function mergeElements(
  existing: ExcalidrawElement[],
  incoming: ExcalidrawElement[],
): ExcalidrawElement[] {
  const existingById = new Map(existing.map((el) => [el.id, el]));

  const merged = incoming
    .filter((el) => VALID_TYPES.has(el.type))
    .map((el) => {
      const normalized = normalizeLinearElement(el);
      const prev = existingById.get(normalized.id);
      // arrows/lines: x/y must stay consistent with points[]
      if (!prev || normalized.type === "arrow" || normalized.type === "line")
        return normalized;
      return {
        ...normalized,
        x: prev.x ?? normalized.x,
        y: prev.y ?? normalized.y,
        width: prev.width ?? normalized.width,
        height: prev.height ?? normalized.height,
      };
    });

  return nudgeOverlapping(merged);
}

function normalizeLinearElement(el: ExcalidrawElement): ExcalidrawElement {
  if (el.label && typeof el.label === "object") {
    el = {
      ...el,
      label: { textAlign: "center", verticalAlign: "middle", ...el.label },
    };
  }

  if (el.type !== "arrow" && el.type !== "line") return el;

  let withDefaults: ExcalidrawElement = {
    strokeColor: "#1e1e1e",
    strokeWidth: 2,
    endArrowhead: "arrow",
    ...el,
  };

  // bindings need focus+gap; LLM often sends only elementId + fixedPoint
  if (
    withDefaults.startBinding &&
    typeof withDefaults.startBinding === "object"
  ) {
    withDefaults = {
      ...withDefaults,
      startBinding: { focus: 0, gap: 1, ...withDefaults.startBinding },
    };
  }
  if (withDefaults.endBinding && typeof withDefaults.endBinding === "object") {
    withDefaults = {
      ...withDefaults,
      endBinding: { focus: 0, gap: 1, ...withDefaults.endBinding },
    };
  }

  if (!Array.isArray(withDefaults.points) || withDefaults.points.length < 2) {
    return {
      ...withDefaults,
      points: [
        [0, 0],
        [1, 0],
      ],
    };
  }

  // Excalidraw requires points[0] === [0,0] or "not normalized"
  const [p0x, p0y] = withDefaults.points[0] as [number, number];
  if (p0x !== 0 || p0y !== 0) {
    return {
      ...withDefaults,
      x: (withDefaults.x ?? 0) + p0x,
      y: (withDefaults.y ?? 0) + p0y,
      points: (withDefaults.points as [number, number][]).map(([px, py]) => [
        px - p0x,
        py - p0y,
      ]),
    };
  }

  return withDefaults;
}

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function getBBox(el: ExcalidrawElement): BBox {
  return {
    x: el.x ?? 0,
    y: el.y ?? 0,
    w: el.width ?? 160,
    h: el.height ?? 60,
  };
}

function overlapArea(a: BBox, b: BBox): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

// >50% overlap of smaller bbox → nudge later element (new arrivals only)
function nudgeOverlapping(elements: ExcalidrawElement[]): ExcalidrawElement[] {
  const result = elements.map((el) => ({ ...el }));

  for (let i = 1; i < result.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = getBBox(result[j]);
      const b = getBBox(result[i]);
      const overlap = overlapArea(a, b);
      const smaller = Math.min(a.w * a.h, b.w * b.h);
      if (smaller > 0 && overlap / smaller > 0.5) {
        result[i] = {
          ...result[i],
          x: (result[i].x ?? 0) + 20,
          y: (result[i].y ?? 0) + 20,
        };
      }
    }
  }

  return result;
}
