import { nanoid } from "nanoid";
import type { Diagram, DiagramType, GenerationMethod } from "@/types/library";
import type { ExcalidrawElement, BinaryFileData } from "@/types/diagram";

interface DiagramInit {
  name: string;
  folderId?: string | null;
  elements?: ExcalidrawElement[];
  files?: Record<string, BinaryFileData>;
  transcript?: string;
  diagramType?: DiagramType;
  generatedVia?: GenerationMethod;
  colorPalette?: string[];
}

export function createDiagram({
  name,
  folderId = null,
  elements = [],
  files = {},
  transcript = "",
  diagramType = "freeform",
  generatedVia = "manual",
  colorPalette = [],
}: DiagramInit): Diagram {
  const now = Date.now();
  return {
    id: nanoid(),
    name,
    folderId,
    elements,
    transcript,
    diagramType,
    thumbnail: null,
    files,
    graph: null,
    tags: [],
    starred: false,
    locked: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    version: 1,
    trashedAt: null,
    metadata: {
      elementCount: elements.length,
      arrowCount: elements.filter((e) => e.type === "arrow").length,
      colorPalette,
      generatedVia,
    },
  };
}
