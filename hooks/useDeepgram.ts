"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const SPEED_PRESETS = { fast: 400, normal: 800, slow: 1200 } as const;
export type SpeechSpeed = keyof typeof SPEED_PRESETS;
export { SPEED_PRESETS };

// terms that are out-of-vocabulary enough for keyword boost to help
const SYSARCH_KEYWORDS = [
  "kubernetes",
  "nginx",
  "postgresql",
  "elasticsearch",
  "rabbitmq",
  "dynamodb",
  "cloudfront",
  "fargate",
  "terraform",
  "ansible",
  "prometheus",
  "grafana",
  "datadog",
  "sendgrid",
  "supabase",
  "netlify",
  "cloudflare",
  "traefik",
  "istio",
  "envoy",
  "zookeeper",
  "clickhouse",
  "snowflake",
  "bigquery",
  "airflow",
  "llm",
  "drizzle",
];

// phonetic near-misses
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
  [/\btraffic\b/gi, "Traefik"], // traefik is almost always heard as traffic
  [/\bpost\s*gres\s*(sql)?\b/gi, "PostgreSQL"],
  [/\bpostgresql\s+sql\b/gi, "PostgreSQL"], // dedupe doubled suffix
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
  const activeSessionRef = useRef(0); // incremented on each start; stale callbacks self-cancel
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
      if (session !== activeSessionRef.current) return; // stale session
      if (finalTranscriptRef.current.trim()) {
        onSilenceRef.current(finalTranscriptRef.current);
        finalTranscriptRef.current = "";
        setFinalTranscript("");
      }
    }, SPEED_PRESETS[speedRef.current]);
  }, []);

  const start = useCallback(async () => {
    // Tear down any existing session first
    teardown();

    const session = ++activeSessionRef.current;

    try {
      const res = await fetch("/api/deepgram-token");
      const { key, error } = await res.json();
      if (error) throw new Error(error);
      if (session !== activeSessionRef.current) return; // superseded

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== activeSessionRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      setIsListening(true); // mic confirmed — show red immediately while ws connects

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
        if (session !== activeSessionRef.current) return; // stale
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
        // browser hides ws error details — actual reason is in onclose code/reason
        if (session === activeSessionRef.current) teardown();
      };
      ws.onclose = (e) => {
        // 1005 = no status received — expected when teardown() closes the ws
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
    // Invalidate the active session so all in-flight callbacks are ignored
    activeSessionRef.current++;
    teardown();
    // Don't flush here — any pending transcript was already sent by UtteranceEnd/silence timer,
    // and flushing here races with the WS draining its last messages.
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
