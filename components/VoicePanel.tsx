"use client";

import { useState, useEffect } from "react";
import { IconSend } from "@tabler/icons-react";
import MicButton from "./MicButton";
import InterimIndicator from "./InterimIndicator";
import VersionTimeline from "./editor/VersionTimeline";
import { useDeepgram, type SpeechSpeed } from "@/hooks/useDeepgram";
import type { ExcalidrawCanvasHandle } from "@/components/ExcalidrawCanvas";
import type { ExcalidrawElement } from "@/types/diagram";
import type { DiagramType } from "@/types/library";

interface VoicePanelProps {
  diagramId: string;
  diagramType: DiagramType;
  isLoading: boolean;
  onSilence: (transcript: string) => void;
  onMockSubmit?: (text: string) => void;
  onMicStart?: () => void;
  onMicStop?: () => void;
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>;
  onRestoreAnimation: () => void;
  pauseSave: (liveElements: ExcalidrawElement[]) => void;
  resumeSave: () => void;
}

export default function VoicePanel({
  diagramId,
  diagramType,
  isLoading,
  onSilence,
  onMockSubmit,
  onMicStart,
  onMicStop,
  canvasRef,
  onRestoreAnimation,
  pauseSave,
  resumeSave,
}: VoicePanelProps) {
  const [mockInput, setMockInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [speed, setSpeed] = useState<SpeechSpeed>(() => {
    if (typeof window === "undefined") return "normal";
    return (
      (localStorage.getItem("yapdraw-speech-speed") as SpeechSpeed) ?? "normal"
    );
  });

  useEffect(() => {
    localStorage.setItem("yapdraw-speech-speed", speed);
  }, [speed]);

  const handleSilence = (transcript: string) => {
    setMessages((prev) => [...prev, transcript]);
    onSilence(transcript);
  };

  const {
    isListening,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    reset,
  } = useDeepgram(handleSilence, speed, diagramType === "system-architecture");

  const handleToggle = () => {
    if (isListening) {
      stop();
      onMicStop?.();
    } else {
      reset();
      onMicStart?.();
      start();
    }
  };

  const submitMock = () => {
    if (!mockInput.trim()) return;
    const text = mockInput.trim();
    setMessages((prev) => [...prev, text]);
    onMockSubmit?.(text);
    setMockInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white text-foreground">
      {/* Version timeline — above the chat */}
      <VersionTimeline
        diagramId={diagramId}
        canvasRef={canvasRef}
        onRestoreAnimation={onRestoreAnimation}
        pauseSave={pauseSave}
        resumeSave={resumeSave}
      />

      {/* Mic button */}
      <div className="flex flex-col items-center gap-2 pt-5 pb-3">
        <MicButton isListening={isListening} onClick={handleToggle} />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-subtle text-xs">
            {isListening
              ? "Listening — pause to generate"
              : isLoading
                ? "Drawing..."
                : "Click to start"}
          </span>
          <p className="text-placeholder text-xs">Just talk. Your diagram builds itself.</p>
        </div>
        <div className="flex items-center gap-1 text-xs mt-1">
          {(["fast", "normal", "slow"] as SpeechSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded transition-colors ${
                speed === s
                  ? "bg-primary text-white"
                  : "text-placeholder hover:text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable area: transcript + example chips when empty */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-3 space-y-2 px-4">
          {messages.length === 0 && !finalTranscript && (
            <div className="hidden lg:contents">
              <p className="text-placeholder text-xs px-1 pb-1">Try an example:</p>
              {[
                {
                  label: "React → Node API → Postgres & Redis",
                  prompt:
                    "React frontend calls a Node API, which reads from Postgres and caches in Redis",
                },
                {
                  label: "Form validation flow",
                  prompt:
                    "User submits a form, it gets validated, if valid send a confirmation email, if not show an error",
                },
                {
                  label: "Order fulfillment process",
                  prompt:
                    "Customer places an order, warehouse picks and packs it, courier delivers it, customer confirms receipt",
                },
              ].map(({ label, prompt }) => (
                <button
                  key={label}
                  disabled={isLoading || isListening}
                  onClick={() => {
                    setMessages((prev) => [...prev, prompt]);
                    onMockSubmit?.(prompt);
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface text-muted hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <p
              key={i}
              className="text-foreground text-sm px-1 leading-relaxed whitespace-pre-wrap"
            >
              {msg}
            </p>
          ))}
          {finalTranscript && (
            <p className="text-foreground text-sm px-1 leading-relaxed whitespace-pre-wrap">
              {finalTranscript}
            </p>
          )}
          <InterimIndicator text={interimTranscript} />
        </div>
      </div>

      {/* Mock text input */}
      {onMockSubmit && (
        <div className="px-4 py-2 border-t border-border-subtle flex gap-2">
          <input
            className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Or type a description…"
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitMock();
            }}
          />
          <button
            onClick={submitMock}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center justify-center"
          >
            <IconSend size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
