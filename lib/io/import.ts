import { db } from "@/lib/db";
import { createDiagram } from "@/lib/diagram";
import type { DiagramType } from "@/types/library";
import type { ExcalidrawElement } from "@/types/diagram";

export async function importExcalidrawFile(file: File): Promise<string> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  const elements: ExcalidrawElement[] = Array.isArray(parsed.elements)
    ? parsed.elements
    : [];
  const name = file.name.replace(/\.excalidraw$/i, "") || "Imported Diagram";

  const diagram = createDiagram({ name, elements, generatedVia: "import" });
  await db.diagrams.add(diagram);
  return diagram.id;
}

export async function importYapDrawJSON(file: File): Promise<string> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  const elements: ExcalidrawElement[] = Array.isArray(parsed.elements)
    ? parsed.elements
    : [];
  const name: string =
    typeof parsed.name === "string" && parsed.name.trim()
      ? parsed.name.trim()
      : file.name.replace(/\.json$/i, "") || "Imported Diagram";

  const validTypes: DiagramType[] = [
    "freeform",
    "system-architecture",
    "operations-flowchart",
  ];
  const diagramType: DiagramType = validTypes.includes(parsed.diagramType)
    ? parsed.diagramType
    : "freeform";

  const transcript =
    typeof parsed.transcript === "string" ? parsed.transcript : "";
  const colorPalette = Array.isArray(parsed.metadata?.colorPalette)
    ? parsed.metadata.colorPalette
    : [];

  const diagram = createDiagram({
    name,
    elements,
    transcript,
    diagramType,
    generatedVia: "import",
    colorPalette,
  });
  await db.diagrams.add(diagram);
  return diagram.id;
}
