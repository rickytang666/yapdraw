import type { GraphResponse } from "@/types/diagram";

// mermaid ids: alphanumeric + underscore only
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

// `"` in labels breaks mermaid parsing
function escapeLabel(label: string): string {
  return label.replace(/"/g, "'");
}

function nodeShape(shape: string | undefined): [string, string] {
  switch (shape) {
    case "diamond":
      return ["{ ", " }"];
    case "ellipse":
      return ["((", "))"];
    default:
      return ["[", "]"];
  }
}

export function graphToMermaid(graph: GraphResponse): string {
  const dir = graph.direction === "LR" ? "LR" : "TB";
  const lines: string[] = [`flowchart ${dir}`];

  const groupedNodeIds = new Set<string>();
  for (const group of graph.groups ?? []) {
    lines.push(
      `  subgraph ${sanitizeId(group.id)}["${escapeLabel(group.label)}"]`,
    );
    for (const nodeId of group.nodes) {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      groupedNodeIds.add(node.id);
      const [open, close] = nodeShape(node.shape);
      lines.push(
        `    ${sanitizeId(node.id)}${open}"${escapeLabel(node.label)}"${close}`,
      );
    }
    lines.push("  end");
  }

  for (const node of graph.nodes) {
    if (groupedNodeIds.has(node.id)) continue;
    const [open, close] = nodeShape(node.shape);
    lines.push(
      `  ${sanitizeId(node.id)}${open}"${escapeLabel(node.label)}"${close}`,
    );
  }

  for (const edge of graph.edges) {
    const from = sanitizeId(edge.from);
    const to = sanitizeId(edge.to);
    const label = edge.label ? `|"${escapeLabel(edge.label)}"|` : "";
    const arrow =
      edge.strokeStyle === "dashed"
        ? "-.->"
        : edge.endArrowhead === null
          ? "---"
          : "-->";
    lines.push(`  ${from} ${arrow}${label} ${to}`);
  }

  return lines.join("\n");
}
