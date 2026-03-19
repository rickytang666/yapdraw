import OpenAI from "openai";
import type { ExcalidrawElement, GraphResponse } from "@/types/diagram";
import type { DiagramType } from "@/types/library";
import { getSystemPrompt } from "./prompts";
import { layoutGraph } from "./layout";
import { fetchIcons } from "./icons";

export type UserProvider = 'openrouter' | 'google'

export interface ProviderConfig {
  provider: UserProvider
  apiKey: string  // empty = fall back to groq
}

const USER_PROVIDERS: Record<UserProvider, { baseURL: string; model: string }> = {
  openrouter: { baseURL: 'https://openrouter.ai/api/v1',                            model: 'google/gemini-3.1-flash-lite-preview' },
  google:     { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-3.1-flash-lite-preview'         },
}

// groq is the free-tier fallback — key comes from server env only
const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'EMPTY',
})
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function resolveClient(config?: ProviderConfig | null): { client: OpenAI; model: string } {
  if (config?.apiKey) {
    const p = USER_PROVIDERS[config.provider]
    return { client: new OpenAI({ baseURL: p.baseURL, apiKey: config.apiKey }), model: p.model }
  }
  return { client: groqClient, model: GROQ_MODEL }
}

function extractJSON(content: string): string {
  // Strip code fences first
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find the outermost balanced JSON object
  const start = content.indexOf("{");
  if (start === -1) return content;
  let depth = 0;
  for (let i = start; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  // Truncated JSON — return what we have from the first brace
  return content.slice(start);
}

export async function generateDiagram(
  transcript: string,
  currentGraph?: GraphResponse | null,
  diagramType: DiagramType = "freeform",
  manualEditDebrief?: { text: string; deletedNodeIds: string[]; deletedEdgeKeys: Array<{ from: string; to: string }> } | null,
  providerConfig?: ProviderConfig | null,
): Promise<{
  elements: ExcalidrawElement[];
  graph: GraphResponse;
  files: import("@/types/diagram").BinaryFileData[];
}> {
  const userMessage = currentGraph
    ? `Current diagram:\n${JSON.stringify(currentGraph)}\n\n${manualEditDebrief ? manualEditDebrief.text + '\n\n' : ''}Latest instruction:\n${transcript}`
    : transcript;

  const { client, model } = resolveClient(providerConfig)

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: getSystemPrompt(diagramType) },
      { role: "user", content: userMessage },
    ],
    temperature: 0.2,
    max_tokens: 3000,
  });
  const content = response.choices[0]?.message?.content ?? "";
  if (!content) throw new Error("LLM returned empty content");

  const jsonStr = extractJSON(content);
  let graph: GraphResponse;

  try {
    graph = JSON.parse(jsonStr) as GraphResponse;
  } catch {
    console.warn("Failed to parse LLM response as JSON:", content);
    if (currentGraph && currentGraph.nodes.length > 0) {
      console.warn("Falling back to current graph");
      const { elements: fbElements, iconRequests: fbRequests } =
        layoutGraph(currentGraph);
      const fbFiles = fetchIcons(fbRequests);
      return { elements: fbElements, graph: currentGraph, files: fbFiles };
    }
    throw new Error("LLM returned empty graph");
  }

  // Only wipe the canvas if the user explicitly said so — never trust the LLM alone
  const explicitWipe =
    /\b(delete|clear|wipe|erase|remove)\s+(every|all)(\s*thing)?\b/i.test(
      transcript,
    );

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    if (currentGraph && currentGraph.nodes.length > 0 && !explicitWipe) {
      // LLM returned empty but user didn't ask to wipe — keep existing graph
      console.warn(
        "LLM returned empty nodes; keeping current graph (no explicit wipe instruction)",
      );
      graph = currentGraph;
    } else if (!explicitWipe) {
      console.error("LLM returned empty graph. Parsed:", JSON.stringify(graph));
      console.error("Raw content:", content);
      throw new Error("LLM returned empty graph");
    }
    // explicitWipe: user said "delete everything" — allow empty graph through
  }

  // Safety merge: if this was an incremental update and the LLM kept at least one
  // existing node ID, restore any nodes/edges it accidentally dropped.
  // Nodes listed in graph.remove are intentional deletions — never restore those.
  // If zero IDs match, the LLM intentionally redesigned — don't merge.
  if (currentGraph && !explicitWipe) {
    const explicitlyRemovedNodes = new Set([
      ...(graph.remove?.nodes ?? []),
      ...(manualEditDebrief?.deletedNodeIds ?? []),
    ]);
    const explicitlyRemovedEdgeKeys = new Set([
      ...(graph.remove?.edges ?? []).map((e) => `${e.from}|${e.to}`),
      ...(manualEditDebrief?.deletedEdgeKeys ?? []).map((e) => `${e.from}|${e.to}`),
    ]);
    const llmNodeIds = new Set(graph.nodes.map((n) => n.id));
    const overlap = currentGraph.nodes.filter(
      (n) => llmNodeIds.has(n.id) || explicitlyRemovedNodes.has(n.id),
    ).length;
    if (overlap > 0) {
      const restoredNodes = currentGraph.nodes.filter(
        (n) => !llmNodeIds.has(n.id) && !explicitlyRemovedNodes.has(n.id),
      );
      const allNodeIds = new Set(
        [...graph.nodes, ...restoredNodes].map((n) => n.id),
      );
      const llmEdgeKeys = new Set(graph.edges.map((e) => `${e.from}|${e.to}`));
      const restoredEdges = (currentGraph.edges ?? []).filter(
        (e) =>
          !llmEdgeKeys.has(`${e.from}|${e.to}`) &&
          !explicitlyRemovedEdgeKeys.has(`${e.from}|${e.to}`) &&
          !explicitlyRemovedNodes.has(e.from) &&
          !explicitlyRemovedNodes.has(e.to) &&
          allNodeIds.has(e.from) &&
          allNodeIds.has(e.to),
      );
      graph = {
        direction: graph.direction ?? currentGraph.direction,
        nodes: [...graph.nodes, ...restoredNodes],
        edges: [...graph.edges, ...restoredEdges],
        groups:
          graph.groups && graph.groups.length > 0
            ? graph.groups
            : (currentGraph.groups ?? []),
      };
    }
  }

  const { elements, iconRequests } = layoutGraph(graph);
  const files = fetchIcons(iconRequests);
  return { elements, graph, files };
}
