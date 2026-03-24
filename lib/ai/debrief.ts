import type { GraphResponse, ExcalidrawElement } from "@/types/diagram";

const SHAPE_TYPES = new Set(["rectangle", "diamond", "ellipse"]);

export interface DebriefResult {
  text: string;
  deletedNodeIds: string[];
  deletedEdgeKeys: Array<{ from: string; to: string }>;
}

// plain-text manual edits since last AI gen; built only right before LLM call
export function buildDebrief(
  elements: ExcalidrawElement[],
  lastGraph: GraphResponse,
): DebriefResult | null {
  const canvasNodeIds = new Set<string>();
  const canvasEdgeKeys = new Set<string>();
  const nodeLabelMap = new Map<string, string>();

  for (const el of elements) {
    if (el.isDeleted) continue;
    const yd = el.customData?.yapdraw;
    if (!yd) continue;

    if (yd.type === "node") {
      canvasNodeIds.add(yd.id);
      const label = el.label?.text ?? "";
      if (label) nodeLabelMap.set(yd.id, label);
    } else if (yd.type === "edge") {
      canvasEdgeKeys.add(`${yd.from}→${yd.to}`);
    }
  }

  const lines: string[] = [];

  const deletedNodes = lastGraph.nodes.filter((n) => !canvasNodeIds.has(n.id));
  if (deletedNodes.length > 0) {
    lines.push(
      `deleted nodes: ${deletedNodes.map((n) => `"${n.label}"`).join(", ")}`,
    );
  }

  const deletedEdges = lastGraph.edges.filter(
    (e) => !canvasEdgeKeys.has(`${e.from}→${e.to}`),
  );
  if (deletedEdges.length > 0) {
    const nodeLabel = (id: string) =>
      lastGraph.nodes.find((n) => n.id === id)?.label ?? id;
    lines.push(
      `deleted edges: ${deletedEdges.map((e) => `${nodeLabel(e.from)} → ${nodeLabel(e.to)}`).join(", ")}`,
    );
  }

  const renamed: string[] = [];
  for (const node of lastGraph.nodes) {
    const current = nodeLabelMap.get(node.id);
    if (current && current !== node.label) {
      renamed.push(`"${node.label}" → "${current}"`);
    }
  }
  if (renamed.length > 0) {
    lines.push(`renamed: ${renamed.join(", ")}`);
  }

  const manualAdds: string[] = [];
  for (const el of elements) {
    if (el.isDeleted) continue;
    if (el.customData?.yapdraw) continue;
    if (!SHAPE_TYPES.has(el.type)) continue;
    if (el.containerId) continue;
    const label = el.label?.text?.trim();
    manualAdds.push(
      label ? `a ${el.type} labeled "${label}"` : `an unlabeled ${el.type}`,
    );
  }
  if (manualAdds.length > 0) {
    lines.push(`manually added: ${manualAdds.join(", ")}`);
  }

  if (lines.length === 0) return null;

  return {
    text: `Since last generation, the user manually:\n${lines.map((l) => `- ${l}`).join("\n")}`,
    deletedNodeIds: deletedNodes.map((n) => n.id),
    deletedEdgeKeys: deletedEdges.map((e) => ({ from: e.from, to: e.to })),
  };
}
