import OpenAI from "openai";
import type { ExcalidrawElement, GraphResponse } from "@/types/diagram";
import type { DiagramType } from "@/types/library";
import { getSystemPrompt } from "./prompts";
import { layoutGraph } from "./layout";
import { fetchIcons } from "./icons";

const USE_WATSONX = process.env.USE_WATSONX === "true";

const client = new OpenAI({
  baseURL:
    process.env.LLM_BASE_URL ||
    "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1",
  apiKey: process.env.LLM_API_KEY || "EMPTY",
});

const MODEL = process.env.LLM_MODEL || "openai/gpt-oss-120b";

// ── watsonx.ai ────────────────────────────────────────────────────────────────

const WATSONX_URL =
  process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com";
const WATSONX_MODEL = process.env.WATSONX_MODEL || "ibm/granite-3-8b-instruct";
const WATSONX_VERSION = "2023-05-29";

let iamTokenCache: { token: string; expiresAt: number } | null = null;

async function getIAMToken(): Promise<string> {
  if (iamTokenCache && Date.now() < iamTokenCache.expiresAt) {
    return iamTokenCache.token;
  }
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${process.env.WATSONX_API_KEY}`,
  });
  if (!res.ok) throw new Error(`IBM IAM token fetch failed: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  iamTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min early
  };
  return iamTokenCache.token;
}

async function watsonxChat(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const token = await getIAMToken();
  const res = await fetch(
    `${WATSONX_URL}/ml/v1/text/chat?version=${WATSONX_VERSION}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model_id: WATSONX_MODEL,
        project_id: process.env.WATSONX_PROJECT_ID,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        parameters: {
          temperature: 0.2,
          max_new_tokens: 8000,
        },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`watsonx chat failed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("watsonx returned empty content");
  return content;
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
): Promise<{
  elements: ExcalidrawElement[];
  graph: GraphResponse;
  files: import("@/types/diagram").BinaryFileData[];
}> {
  const userMessage = currentGraph
    ? `Current diagram:\n${JSON.stringify(currentGraph)}\n\nLatest instruction:\n${transcript}`
    : transcript;

  let content: string;
  if (USE_WATSONX) {
    content = await watsonxChat(getSystemPrompt(diagramType), userMessage);
  } else {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt(diagramType) },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    });
    content = response.choices[0]?.message?.content ?? "";
  }
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
      const fbFiles = await fetchIcons(fbRequests);
      return { elements: fbElements, graph: currentGraph, files: fbFiles };
    }
    throw new Error("LLM returned empty graph");
  }

  if (!Array.isArray(graph.nodes) || graph.nodes.length === 0) {
    const intentionalClear = (graph.remove?.nodes?.length ?? 0) > 0;
    if (currentGraph && currentGraph.nodes.length > 0 && !intentionalClear) {
      // LLM lost its way (no explicit remove signal) — fall back to unchanged current graph
      console.warn(
        "LLM returned empty nodes on incremental update; keeping current graph",
      );
      graph = currentGraph;
    } else if (!intentionalClear) {
      console.error("LLM returned empty graph. Parsed:", JSON.stringify(graph));
      console.error("Raw content:", content);
      throw new Error("LLM returned empty graph");
    }
    // intentionalClear: user said "delete everything" — allow empty graph through
  }

  // Safety merge: if this was an incremental update and the LLM kept at least one
  // existing node ID, restore any nodes/edges it accidentally dropped.
  // Nodes listed in graph.remove are intentional deletions — never restore those.
  // If zero IDs match, the LLM intentionally redesigned — don't merge.
  if (currentGraph) {
    const explicitlyRemovedNodes = new Set(graph.remove?.nodes ?? []);
    const explicitlyRemovedEdgeKeys = new Set(
      (graph.remove?.edges ?? []).map((e) => `${e.from}|${e.to}`),
    );
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
  const files = await fetchIcons(iconRequests);
  return { elements, graph, files };
}
