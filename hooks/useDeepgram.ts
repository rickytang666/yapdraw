"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export function useDeepgram(onSilence: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef("");
  const onSilenceRef = useRef(onSilence);
  const activeSessionRef = useRef(0); // incremented on each start; stale callbacks self-cancel
  onSilenceRef.current = onSilence;

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

  const resetSilenceTimer = useCallback((session: number) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (session !== activeSessionRef.current) return; // stale session
      if (finalTranscriptRef.current.trim()) {
        onSilenceRef.current(finalTranscriptRef.current);
        finalTranscriptRef.current = "";
        setFinalTranscript("");
      }
    }, 600);
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

      const params = new URLSearchParams({
        model: "nova-2",
        interim_results: "true",
        smart_format: "true",
        utterance_end_ms: "1000",
        endpointing: "300",
      });

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
        setIsListening(true);
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
          finalTranscriptRef.current = (
            finalTranscriptRef.current +
            " " +
            transcript
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
        if (e.code !== 1000 && e.code !== 1005 && session === activeSessionRef.current) {
          console.error(`deepgram ws closed unexpectedly: code=${e.code} reason="${e.reason}"`)
        }
        if (session === activeSessionRef.current) setIsListening(false);
      };
    } catch (err) {
      console.error("Failed to start Deepgram", err);
      if (session === activeSessionRef.current) teardown();
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
