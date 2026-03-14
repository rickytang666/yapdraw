"use client";

import { useRef, useState } from "react";
import ExcalidrawCanvas, {
  ExcalidrawCanvasHandle,
} from "@/components/ExcalidrawCanvas";
import VoicePanel from "@/components/VoicePanel";

export default function Home() {
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (transcript: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, currentElements: [] }),
      });

      const data = await res.json();

      if (res.ok && data.elements) {
        console.log("Generated elements:", data.elements);
        canvasRef.current?.updateDiagram(data.elements);
      } else {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[35%] h-full border-r border-zinc-200 shrink-0">
        <VoicePanel onSilence={handleGenerate} isLoading={isLoading} />
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex items-center justify-center bg-zinc-100 overflow-auto">
        <ExcalidrawCanvas ref={canvasRef} />
      </div>
    </div>
  );
}
