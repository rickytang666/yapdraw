"use client";

import { useRef, useEffect } from "react";
import ExcalidrawCanvas, {
  ExcalidrawCanvasHandle,
} from "@/components/ExcalidrawCanvas";
import VoicePanel from "@/components/VoicePanel";

// Smoke test elements (Excalidraw skeleton format)
const SMOKE_TEST_ELEMENTS = [
  {
    id: "web-app",
    type: "rectangle",
    x: 100,
    y: 150,
    width: 160,
    height: 60,
    strokeColor: "#1971c2",
    backgroundColor: "#a5d8ff",
    label: { text: "Web App", fontSize: 16 },
  },
  {
    id: "api-server",
    type: "rectangle",
    x: 400,
    y: 150,
    width: 160,
    height: 60,
    roundness: { type: 3 },
    strokeColor: "#2f9e44",
    backgroundColor: "#b2f2bb",
    label: { text: "API Server", fontSize: 16 },
  },
  {
    id: "web-to-api",
    type: "arrow",
    x: 260,
    y: 180,
    width: 140,
    height: 0,
    start: { id: "web-app" },
    end: { id: "api-server" },
  },
];

export default function Home() {
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);

  useEffect(() => {
    // Give Excalidraw a moment to mount before pushing elements
    const t = setTimeout(() => {
      canvasRef.current?.updateDiagram(SMOKE_TEST_ELEMENTS as any);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[35%] h-full border-r border-zinc-200 shrink-0">
        <VoicePanel />
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center bg-zinc-100 overflow-auto">
        <ExcalidrawCanvas ref={canvasRef} />
      </div>
    </div>
  );
}
