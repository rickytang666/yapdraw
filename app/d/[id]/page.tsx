"use client";

import { useRef, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import ExcalidrawCanvas, {
  ExcalidrawCanvasHandle,
} from "@/components/ExcalidrawCanvas";
import VoicePanel from "@/components/VoicePanel";
import { type LoadingPhase } from "@/components/LoadingIndicator";
import EditorTopBar from "@/components/editor/EditorTopBar";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import { useAIChangeHistory } from "@/hooks/useAIChangeHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type {
  ExcalidrawElement,
  GraphResponse,
  BinaryFileData,
} from "@/types/diagram";
import type { Diagram } from "@/types/library";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorMessage(msg);
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 4000);
  }
  const [lastGraph, setLastGraph] = useState<GraphResponse | null>(null);
  const lastGraphInitRef = useRef(false);
  const [restoreFlash, setRestoreFlash] = useState(false);

  function triggerRestoreAnimation() {
    setRestoreFlash(true);
    setTimeout(() => setRestoreFlash(false), 500);
  }

  // Tracks the versionId of the snapshot taken just before the last AI change (for Cmd+Z)
  const lastAIVersionIdRef = useRef<string | null>(null);
  const isRestoringRef = useRef(false);

  // one snapshot per mic session
  const micSessionRef = useRef<{
    versionId: string;
    startElements: ExcalidrawElement[];
    hasChanges: boolean;
  } | null>(null);

  const diagram = useLiveQuery(() => db.diagrams.get(id), [id]);

  // Mark as opened + hydrate lastGraph from persisted graph on first load
  useEffect(() => {
    if (diagram) {
      db.diagrams.update(id, { lastOpenedAt: Date.now() });
      if (!lastGraphInitRef.current && diagram.graph) {
        setLastGraph(diagram.graph);
        lastGraphInitRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, diagram?.id]);

  const isLoading = loadingPhase !== "idle";
  const { triggerSave, forceSave, saveStatus, pauseSave, resumeSave } =
    useAutoSave(id, canvasRef);
  const { restoreVersion } = useVersionHistory(id);
  const aiHistory = useAIChangeHistory(id);

  // Redirect if diagram not found
  useEffect(() => {
    if (diagram === null) router.replace("/");
  }, [diagram, router]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useKeyboardShortcuts({
    "mod+s": () => {
      const elements = canvasRef.current?.getElements() ?? [];
      forceSave(elements);
    },
    "mod+z": () => {
      const vid = lastAIVersionIdRef.current;
      if (vid && !isRestoringRef.current) {
        isRestoringRef.current = true;
        handleRestoreChange(vid)
          .catch(console.error)
          .finally(() => {
            isRestoringRef.current = false;
          });
      }
    },
  });

  // ─── Voice / AI generation ────────────────────────────────────────────────

  async function handleMicStart() {
    if (!diagram) return
    const startElements = canvasRef.current?.getElements() ?? diagram.elements
    const versionId = await aiHistory.snapshotBeforeChange(
      startElements as ExcalidrawElement[],
      '',
      diagram.transcript,
      diagram.version,
    )
    micSessionRef.current = { versionId, startElements: startElements as ExcalidrawElement[], hasChanges: false }
    lastAIVersionIdRef.current = versionId
  }

  async function handleMicStop() {
    const session = micSessionRef.current
    micSessionRef.current = null
    // delete orphan snapshot if mic was opened but no generation succeeded
    if (session && !session.hasChanges) {
      await db.versions.delete(session.versionId)
      lastAIVersionIdRef.current = null
    }
  }

  async function handleSilence(text: string) {
    if (!text.trim() || !diagram || diagram.locked) return;
    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoadingPhase("generating");

    // reuse the mic session snapshot if available (one version per session),
    // otherwise fall back to a fresh snapshot (e.g. text input / mock submit)
    const session = micSessionRef.current
    const currentElements = session
      ? session.startElements
      : (canvasRef.current?.getElements() ?? diagram.elements) as ExcalidrawElement[]
    let versionId = session?.versionId ?? null
    if (!versionId) {
      versionId = await aiHistory.snapshotBeforeChange(
        currentElements as ExcalidrawElement[],
        text,
        diagram.transcript,
        diagram.version,
      )
      lastAIVersionIdRef.current = versionId
    }

    try {
      const res = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          currentGraph:
            (canvasRef.current?.getElements() ?? []).length > 0
              ? lastGraph
              : null,
        }),
        signal: AbortSignal.any([
          abortRef.current.signal,
          AbortSignal.timeout(30000),
        ]),
      });
      const data = await res.json();
      if (data.skipped) return;
      if (!res.ok || !data.elements) {
        console.error("generate-diagram failed:", data.error ?? data);
        // only delete orphan if it's not a shared session snapshot
        if (!session) {
          await db.versions.delete(versionId!)
          lastAIVersionIdRef.current = null
        }
        return;
      }

      const {
        elements,
        graph,
        files = [],
      }: {
        elements: ExcalidrawElement[];
        graph: GraphResponse;
        files: BinaryFileData[];
      } = data;
      setLastGraph(graph);
      setLoadingPhase("rendering");
      canvasRef.current?.updateDiagram(elements, { replace: true, files });

      // 2. Record the diff — updates DB label and adds card to VoicePanel
      if (session) session.hasChanges = true
      await aiHistory.recordChange(
        versionId!,
        text,
        currentElements as ExcalidrawElement[],
        elements,
      );

      await db.diagrams.update(id, {
        transcript: (diagram.transcript + "\n" + text).trim(),
        metadata: { ...diagram.metadata, generatedVia: "voice" },
        graph,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (!session) {
        await db.versions.delete(versionId!)
        lastAIVersionIdRef.current = null
      }
      if (err instanceof Error && err.name === "TimeoutError") {
        showError("took too long — try again");
      } else {
        console.error("Failed to generate diagram:", err);
        showError("something went wrong — try again");
      }
    } finally {
      setLoadingPhase("idle");
    }
  }

  // ─── Restore from a history card ──────────────────────────────────────────

  async function handleRestoreChange(versionId: string) {
    const target = await db.versions.get(versionId);
    if (!target) return;
    await restoreVersion(versionId);
    canvasRef.current?.updateDiagram(target.elements as ExcalidrawElement[], {
      replace: true,
    });
    lastAIVersionIdRef.current = null;
  }

  // ─── Duplicate ────────────────────────────────────────────────────────────

  async function handleDuplicate() {
    if (!diagram) return;
    const newId = nanoid();
    const now = Date.now();
    const duplicate: Diagram = {
      ...diagram,
      id: newId,
      name: `${diagram.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      trashedAt: null,
      starred: false,
    };
    await db.diagrams.add(duplicate);
    router.push(`/d/${newId}`);
  }

  async function handleToggleLock() {
    if (!diagram) return;
    await db.diagrams.update(id, { locked: !diagram.locked });
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (diagram === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA] text-[#64748B]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAFAFA]">
      <EditorTopBar
        diagram={diagram!}
        saveStatus={saveStatus}
        onBack={() => router.push("/library")}
        onRename={(name) =>
          db.diagrams.update(id, { name, updatedAt: Date.now() })
        }
        onStar={(starred) => db.diagrams.update(id, { starred })}
        onDuplicate={handleDuplicate}
        onToggleLock={handleToggleLock}
        canvasRef={canvasRef}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Voice panel — 35% wide, version timeline above chat */}
        <div className="w-[35%] h-full border-r border-[#E5E7EB] shrink-0">
          <VoicePanel
            diagramId={id}
            isLoading={isLoading}
            onSilence={handleSilence}
            onMockSubmit={handleSilence}
            onMicStart={handleMicStart}
            onMicStop={handleMicStop}
            canvasRef={canvasRef}
            onRestoreAnimation={triggerRestoreAnimation}
            pauseSave={pauseSave}
            resumeSave={resumeSave}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 p-3 bg-[#FAFAFA]">
          <div
            className="relative w-full h-full rounded-2xl overflow-hidden bg-white border border-[#E5E7EB]"
            style={{ maxWidth: 4096, maxHeight: 4096 }}
          >
            {/* Restore flash overlay */}
            <div
              className={`absolute inset-0 z-20 pointer-events-none bg-white transition-opacity duration-500 ${
                restoreFlash ? "opacity-20" : "opacity-0"
              }`}
            />
            <ExcalidrawCanvas
              ref={canvasRef}
              initialElements={diagram!.elements}
              initialFiles={diagram!.files ?? {}}
              onChange={(elements) => triggerSave(elements)}
            />
            {loadingPhase !== "idle" && (
              <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-zinc-400 animate-pulse pointer-events-none" />
            )}

            {/* Error toast */}
            {errorMessage && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="px-4 py-2 bg-red-500/90 text-white text-sm rounded-lg shadow-lg">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Locked overlay */}
            {diagram?.locked && (
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-6 z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg backdrop-blur-sm">
                  <span className="text-yellow-400 text-sm font-medium">
                    This diagram is locked. Voice input is disabled.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
