"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import type { Diagram } from "@/types/library";

function NewDiagramInner() {
  const router = useRouter();
  const params = useSearchParams();
  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    const folderId = params.get("folder");

    async function create() {
      const id = nanoid();
      const now = Date.now();

      const diagram: Diagram = {
        id,
        name: "Untitled Diagram",
        folderId: folderId || null,
        elements: [],
        transcript: "",
        diagramType: "freeform",
        thumbnail: null,
        files: {},
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
          elementCount: 0,
          arrowCount: 0,
          colorPalette: [],
          generatedVia: "manual",
        },
      };

      await db.diagrams.add(diagram);
      router.replace(`/d/${id}`);
    }

    create();
  }, [router, params]);

  return null;
}

export default function NewDiagram() {
  return (
    <div className="flex items-center justify-center h-screen text-subtle">
      Creating diagram…
      <Suspense>
        <NewDiagramInner />
      </Suspense>
    </div>
  );
}
