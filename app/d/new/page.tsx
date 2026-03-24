"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import { createDiagram } from "@/lib/diagram";

function NewDiagramInner() {
  const router = useRouter();
  const params = useSearchParams();
  const created = useRef(false);

  useEffect(() => {
    if (created.current) return;
    created.current = true;

    const folderId = params.get("folder");

    async function create() {
      const diagram = createDiagram({ name: 'Untitled Diagram', folderId: folderId || null });
      await db.diagrams.add(diagram);
      router.replace(`/d/${diagram.id}`);
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
