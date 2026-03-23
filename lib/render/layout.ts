import dagre from "dagre";
import type {
  GraphResponse,
  NodeColor,
  NodeShape,
  FontStyle,
  ExcalidrawElement,
} from "@/types/diagram";

// fontFamily ids from Excalidraw bundle (types lie; bundle is source of truth)
const FONT_FAMILY: Record<FontStyle, number> = {
  handwritten: 5, // Excalifont
  normal: 6, // Nunito
  code: 8, // Comic Shanns
};
import { iconFileId, isValidIcon, type IconRequest } from "./icons";

// ── Sizing ─────────────────────────────────────────────────────────────────

const SHAPE_SIZE: Record<NodeShape, { w: number; h: number }> = {
  rectangle: { w: 160, h: 70 },
  diamond: { w: 160, h: 100 },
  ellipse: { w: 140, h: 60 },
};

// ── Color palette ───────────────────────────────────────────────────────────

const COLORS: Record<NodeColor, { fill: string; stroke: string }> = {
  blue: { fill: "#a5d8ff", stroke: "#1971c2" },
  green: { fill: "#b2f2bb", stroke: "#2f9e44" },
  purple: { fill: "#d0bfff", stroke: "#6741d9" },
  orange: { fill: "#ffd8a8", stroke: "#e67700" },
  red: { fill: "#ffc9c9", stroke: "#c92a2a" },
  teal: { fill: "#c3fae8", stroke: "#0c8599" },
  yellow: { fill: "#fff3bf", stroke: "#e67700" },
  grey: { fill: "#f1f3f5", stroke: "#495057" },
};

const GROUP_COLORS: Record<NodeColor, { fill: string; stroke: string }> = {
  blue: { fill: "#dbe4ff", stroke: "#4dabf7" },
  green: { fill: "#d3f9d8", stroke: "#69db7c" },
  purple: { fill: "#e5dbff", stroke: "#b197fc" },
  orange: { fill: "#fff4e6", stroke: "#ffa94d" },
  red: { fill: "#fff5f5", stroke: "#ff8787" },
  teal: { fill: "#e6fcf5", stroke: "#63e6be" },
  yellow: { fill: "#fff9db", stroke: "#ffe066" },
  grey: { fill: "#f8f9fa", stroke: "#ced4da" },
};

const GROUP_PADDING = 40;

interface Pt {
  x: number;
  y: number;
}
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: NodeShape;
}

// ── Main layout ─────────────────────────────────────────────────────────────

export function layoutGraph(graph: GraphResponse): {
  elements: ExcalidrawElement[];
  iconRequests: IconRequest[];
} {
  const { nodes, edges, groups = [], direction = "LR" } = graph;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 60 : 80,
    ranksep: direction === "LR" ? 120 : 100,
    marginx: 60,
    marginy: 60,
    acyclicer: "greedy",
    ranker: "network-simplex",
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeIds = new Set(nodes.map((n) => n.id));

  for (const node of nodes) {
    const size = SHAPE_SIZE[node.shape ?? "rectangle"];
    g.setNode(node.id, { width: size.w, height: size.h });
  }

  for (const edge of edges) {
    if (
      nodeIds.has(edge.from) &&
      nodeIds.has(edge.to) &&
      edge.from !== edge.to
    ) {
      g.setEdge(edge.from, edge.to);
    }
  }

  dagre.layout(g);

  // ── Node positions (top-left) ────────────────────────────────────────────

  const boxes = new Map<string, Box>();
  for (const node of nodes) {
    const pos = g.node(node.id);
    if (!pos) continue;
    const size = SHAPE_SIZE[node.shape ?? "rectangle"];
    boxes.set(node.id, {
      x: Math.round(pos.x - size.w / 2),
      y: Math.round(pos.y - size.h / 2),
      w: size.w,
      h: size.h,
      shape: node.shape ?? "rectangle",
    });
  }

  const elements: ExcalidrawElement[] = [];
  const iconRequests: IconRequest[] = [];

  // ── Group backgrounds ────────────────────────────────────────────────────

  for (const group of groups) {
    const memberBoxes = group.nodes
      .map((id) => boxes.get(id))
      .filter(Boolean) as Box[];
    if (memberBoxes.length === 0) continue;

    const minX = Math.min(...memberBoxes.map((b) => b.x)) - GROUP_PADDING;
    const minY = Math.min(...memberBoxes.map((b) => b.y)) - GROUP_PADDING;
    const maxX = Math.max(...memberBoxes.map((b) => b.x + b.w)) + GROUP_PADDING;
    const maxY = Math.max(...memberBoxes.map((b) => b.y + b.h)) + GROUP_PADDING;

    const safeGroupColor = (
      group.color && group.color in GROUP_COLORS ? group.color : "grey"
    ) as NodeColor;
    const gc = GROUP_COLORS[safeGroupColor];
    elements.push({
      type: "rectangle",
      id: `group-${group.id}`,
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      backgroundColor: gc.fill,
      fillStyle: "solid",
      strokeColor: gc.stroke,
      strokeWidth: 1,
      roundness: null,
      textAlign: "left",
      verticalAlign: "top",
      label: {
        text: group.label,
        fontSize: 14,
        verticalAlign: "top",
        textAlign: "left",
      },
      customData: { yapdraw: { type: "group", id: group.id } },
    });

    // group icon: bottom-left from slug
    if (group.icon && isValidIcon(group.icon)) {
      const slug = group.icon;
      const colorHex = gc.stroke;
      iconRequests.push({ slug, colorHex });
      elements.push({
        type: "image",
        id: `icon-group-${group.id}`,
        fileId: iconFileId(slug, colorHex),
        x: minX + 8,
        y: maxY - 28,
        width: 20,
        height: 20,
        status: "pending",
        scale: [1, 1],
        angle: 0,
        opacity: 100,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        link: null,
        locked: false,
        customData: { yapdraw: { type: "icon" } },
      });
    }
  }

  // ── Nodes ────────────────────────────────────────────────────────────────

  for (const node of nodes) {
    const box = boxes.get(node.id);
    if (!box) continue;

    const safeNodeColor = (
      node.color && node.color in COLORS ? node.color : "grey"
    ) as NodeColor;
    const c = COLORS[safeNodeColor];
    const el: ExcalidrawElement = {
      type: box.shape,
      id: node.id,
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      backgroundColor: c.fill,
      fillStyle: "solid",
      strokeColor: c.stroke,
      strokeWidth: 2,
      strokeStyle: node.strokeStyle ?? "solid",
      textAlign: "center",
      verticalAlign: "middle",
      label: {
        text: node.label,
        fontSize: 15,
        textAlign: "center",
        verticalAlign: "middle",
        fontFamily: FONT_FAMILY[node.font ?? "handwritten"],
      },
      customData: { yapdraw: { type: "node", id: node.id } },
    };
    if (box.shape === "rectangle") el.roundness = { type: 3 };
    elements.push(el);

    // node icon badge: top-left from slug
    if (node.icon && isValidIcon(node.icon)) {
      const slug = node.icon;
      const colorHex = c.stroke;
      iconRequests.push({ slug, colorHex });
      elements.push({
        type: "image",
        id: `icon-${node.id}`,
        fileId: iconFileId(slug, colorHex),
        x: box.x + 8,
        y: box.y + 8,
        width: 20,
        height: 20,
        status: "pending",
        scale: [1, 1],
        angle: 0,
        opacity: 100,
        isDeleted: false,
        groupIds: [],
        frameId: null,
        link: null,
        locked: false,
        customData: { yapdraw: { type: "icon" } },
      });
    }
  }

  // ── Edges: unbound arrows (explicit waypoints) ───────────────────────────
  // bound arrows need points + binding metadata in lockstep → easy normalization crash; Dagre waypoints already sit on shape edges

  const edgeCounts = new Map<string, number>();

  for (const edge of edges) {
    if (
      !nodeIds.has(edge.from) ||
      !nodeIds.has(edge.to) ||
      edge.from === edge.to
    )
      continue;

    const key = `${edge.from}→${edge.to}`;
    const count = edgeCounts.get(key) ?? 0;
    edgeCounts.set(key, count + 1);

    const dagreEdge = g.edge({ v: edge.from, w: edge.to });
    const waypoints: Pt[] = dagreEdge?.points ?? [];
    if (waypoints.length < 2) continue;

    const start = waypoints[0];
    const rest = waypoints.slice(1);

    // points[] are offsets from arrow x,y; first point must be [0,0]
    const points = [
      [0, 0],
      ...rest.map((p) => [
        Math.round(p.x - start.x),
        Math.round(p.y - start.y),
      ]),
    ];

    const end = waypoints[waypoints.length - 1];
    const width = Math.abs(end.x - start.x) || 1;
    const height = Math.abs(end.y - start.y) || 1;

    const arrow: ExcalidrawElement = {
      type: "arrow",
      id: `arrow-${key}-${count}`,
      x: Math.round(start.x),
      y: Math.round(start.y),
      width: Math.round(width),
      height: Math.round(height),
      points,
      strokeColor: "#495057",
      strokeWidth: 2,
      strokeStyle: edge.strokeStyle ?? "solid",
      endArrowhead:
        edge.endArrowhead !== undefined ? edge.endArrowhead : "arrow",
      startArrowhead: null,
      customData: { yapdraw: { type: "edge", from: edge.from, to: edge.to } },
    };

    if (edge.label) {
      arrow.label = {
        text: edge.label,
        fontSize: 13,
        textAlign: "center",
        verticalAlign: "middle",
      };
    }

    elements.push(arrow);
  }

  return { elements, iconRequests };
}
