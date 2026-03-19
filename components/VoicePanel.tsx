"use client";

import { useState, useEffect } from "react";
import MicButton from "./MicButton";
import InterimIndicator from "./InterimIndicator";
import VersionTimeline from "./editor/VersionTimeline";
import { useDeepgram, type SpeechSpeed } from "@/hooks/useDeepgram";
import Image from "next/image";
import type { ExcalidrawCanvasHandle } from "@/components/ExcalidrawCanvas";
import type { ExcalidrawElement } from "@/types/diagram";

interface VoicePanelProps {
  diagramId: string;
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
  } = useDeepgram(handleSilence, speed);

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
    <div className="flex flex-col h-full bg-white text-[#0F172A]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Image
            src="/yapdraw_logo.png"
            alt="YapDraw"
            width={24}
            height={24}
            className="rounded-sm"
          />
          <h1 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            YapDraw
          </h1>
        </div>
        <p className="text-[#64748B] text-xs mt-0.5">
          Start decribing a flow. Watch it appear before your eyes.
        </p>
      </div>

      {/* Version timeline — above the chat */}
      <VersionTimeline
        diagramId={diagramId}
        canvasRef={canvasRef}
        onRestoreAnimation={onRestoreAnimation}
        pauseSave={pauseSave}
        resumeSave={resumeSave}
      />

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-4">
        <MicButton isListening={isListening} onClick={handleToggle} />
        <span className="text-[#64748B] text-xs">
          {isListening
            ? "Listening — pause to generate"
            : isLoading
              ? "Drawing..."
              : "Click to start"}
        </span>
        <div className="flex items-center gap-1 text-xs">
          {(["fast", "normal", "slow"] as SpeechSpeed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-0.5 rounded transition-colors ${
                speed === s
                  ? "bg-[#5B57D1] text-white"
                  : "text-[#94A3B8] hover:text-[#475569]"
              }`}
            >
              {s === "fast" ? "fast" : s === "slow" ? "slow" : "normal"}
            </button>
          ))}
        </div>
      </div>

      {/* Example prompt chips */}
      {messages.length === 0 && !finalTranscript && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <p className="text-[#94A3B8] text-xs px-1">Try an example:</p>
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
              className="text-left text-xs px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-[#475569] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable area: transcript */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4 space-y-2 px-4">
          {messages.length === 0 && !finalTranscript && (
            <p className="text-[#94A3B8] text-sm px-4">
              Your transcript will appear here...
            </p>
          )}
          {messages.map((msg, i) => (
            <p
              key={i}
              className="text-[#0F172A] text-sm px-4 leading-relaxed whitespace-pre-wrap"
            >
              {msg}
            </p>
          ))}
          {finalTranscript && (
            <p className="text-[#0F172A] text-sm px-4 leading-relaxed whitespace-pre-wrap">
              {finalTranscript}
            </p>
          )}
          <InterimIndicator text={interimTranscript} />
        </div>
      </div>

      {/* Mock text input */}
      {onMockSubmit && (
        <div className="px-4 py-2 border-t border-[#E5E7EB] flex gap-2">
          <input
            className="flex-1 text-sm bg-[#F1F5F9] border border-[#D1D5DB] rounded-lg px-3 py-2 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#5B57D1]"
            placeholder="Type to test without mic..."
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitMock();
            }}
          />
          <button
            onClick={submitMock}
            className="text-sm px-3 py-2 bg-[#5B57D1] text-white rounded-lg hover:bg-[#4F4BC4]"
          >
            Go
          </button>
        </div>
      )}
    </div>
  );
}
