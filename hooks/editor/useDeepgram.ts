"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const SPEED_PRESETS = { fast: 800, normal: 1200, slow: 1800 } as const;
export type SpeechSpeed = keyof typeof SPEED_PRESETS;
export { SPEED_PRESETS };

// Deepgram keyword boost for OOV tech terms
const SYSARCH_KEYWORDS = [
  "async",
  "nginx",
  "postgresql",
  "elasticsearch",
  "rabbitmq",
  "graphql",
  "datadog",
  "supabase",
  "netlify",
  "cloudflare",
  "astro",
  "bigquery",
  "llm",
  "vue",
];

const SYSARCH_REGEX_REPLACEMENTS: [RegExp, string][] = [
  [/\b(lang|line|lam|lambda|land|lon)\s*(chain|Shane|chains)\b/gi, "LangChain"],
  [/\b(lang|line|lam|lambda|land|lon)\s*graph\b/gi, "LangGraph"],
  [/\bfast\s*(api|app\s*I|happy|app)\b/gi, "FastAPI"],
  [/\bspring\s*boot\b/gi, "SpringBoot"],
  [/\bnext\s*\.?\s*js\b/gi, "NextJS"],
  [/\bgraph\s*ql\b/gi, "GraphQL"],
  [/\bg\s*rpc\b/gi, "gRPC"],
  [/\bmongo\s*db\b/gi, "MongoDB"],
  [/\bdynamo\s*db\b/gi, "DynamoDB"],
  [/\bfire\s*base\b/gi, "Firebase"],
  [/\bver\s*cel\b/gi, "Vercel"],
  [/\btraffic\b/gi, "Traefik"], // ASR: "Traefik" → "traffic"
  [/\bpost\s*gres\s*(sql)?\b/gi, "PostgreSQL"],
  [/\bpostgresql\s+sql\b/gi, "PostgreSQL"],
  [/\bL\.?R\.?M\b/g, "LLM"],
];

function applyReplacements(text: string): string {
  let result = text;
  for (const [pattern, to] of SYSARCH_REGEX_REPLACEMENTS) {
    result = result.replace(pattern, to);
  }
  return result;
}

export function useDeepgram(
  onSilence: (transcript: string) => void,
  speed: SpeechSpeed = "normal",
  boostTechTerms = false,
  onError?: (msg: string) => void,
) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const onSilenceRef = useRef(onSilence);
  const onErrorRef = useRef(onError);
  const activeSessionRef = useRef(0); // bump on start; stale handlers no-op
  onSilenceRef.current = onSilence;
  onErrorRef.current = onError;

  const teardown = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const resetSilenceTimer = useCallback((session: number) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (session !== activeSessionRef.current) return;
      if (finalTranscriptRef.current.trim()) {
        onSilenceRef.current(finalTranscriptRef.current);
        finalTranscriptRef.current = "";
        setFinalTranscript("");
      }
    }, SPEED_PRESETS[speedRef.current]);
  }, []);

  const start = useCallback(async () => {
    teardown();

    const session = ++activeSessionRef.current;

    try {
      const res = await fetch("/api/deepgram-token");
      const { key, error } = await res.json();
      if (error) throw new Error(error);
      if (session !== activeSessionRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== activeSessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setIsListening(true); // UI: mic live before WS open

      const params = new URLSearchParams({
        model: "nova-2",
        interim_results: "true",
        smart_format: "true",
        utterance_end_ms: "1000",
        endpointing: "300",
      });
      if (boostTechTerms) {
        SYSARCH_KEYWORDS.forEach((kw) => params.append("keywords", `${kw}:5`));
      }

      const ws = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, [
        "token",
        key,
      ]);
      wsRef.current = ws;

      ws.onopen = () => {
        if (session !== activeSessionRef.current) {
          ws.close();
          return;
        }
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (
            session === activeSessionRef.current &&
            ws.readyState === WebSocket.OPEN &&
            e.data.size > 0
          ) {
            ws.send(e.data);
          }
        };
        mediaRecorder.start(250);
      };

      ws.onmessage = (event) => {
        if (session !== activeSessionRef.current) return;
        const data = JSON.parse(event.data);

        if (data.type === "UtteranceEnd") {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (finalTranscriptRef.current.trim()) {
            onSilenceRef.current(finalTranscriptRef.current);
            finalTranscriptRef.current = "";
            setFinalTranscript("");
          }
          return;
        }

        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (!transcript) return;

        if (data.is_final) {
          const fixed = boostTechTerms
            ? applyReplacements(transcript)
            : transcript;
          finalTranscriptRef.current = (
            finalTranscriptRef.current +
            " " +
            fixed
          ).trim();
          setFinalTranscript(finalTranscriptRef.current);
          setInterimTranscript("");
          resetSilenceTimer(session);
        } else {
          setInterimTranscript(transcript);
        }
      };

      ws.onerror = () => {
        if (session === activeSessionRef.current) teardown();
      };
      ws.onclose = (e) => {
        // 1005: no status — normal when we close the socket
        if (
          e.code !== 1000 &&
          e.code !== 1005 &&
          session === activeSessionRef.current
        ) {
          console.error(
            `deepgram ws closed unexpectedly: code=${e.code} reason="${e.reason}"`,
          );
          onErrorRef.current?.("mic error — check browser permissions");
        }
        if (session === activeSessionRef.current) setIsListening(false);
      };
    } catch (err) {
      console.error("Failed to start Deepgram", err);
      if (session === activeSessionRef.current) {
        teardown();
        onErrorRef.current?.("mic error — check browser permissions");
      }
    }
  }, [teardown, resetSilenceTimer]);

  const stop = useCallback(() => {
    activeSessionRef.current++;
    teardown();
    // no final flush: UtteranceEnd/silence already emitted; stop races last WS frames
    finalTranscriptRef.current = "";
    setFinalTranscript("");
  }, [teardown]);

  const reset = useCallback(() => {
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      activeSessionRef.current++;
      teardown();
    };
  }, [teardown]);

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    reset,
  };
}
