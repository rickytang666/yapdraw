'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export function useDeepgram(onSilence: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finalTranscriptRef = useRef('')
  const onSilenceRef = useRef(onSilence)
  onSilenceRef.current = onSilence

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      if (finalTranscriptRef.current.trim()) {
        onSilenceRef.current(finalTranscriptRef.current)
        finalTranscriptRef.current = ''
        setFinalTranscript('')
      }
    }, 1500)
  }, [])

  const start = useCallback(async () => {
    try {
      const res = await fetch('/api/deepgram-token')
      const { key, error } = await res.json()
      if (error) throw new Error(error)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const params = new URLSearchParams({
        model: 'nova-2',
        interim_results: 'true',
        smart_format: 'true',
        utterance_end_ms: '1000',
        endpointing: '300',
      })

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params}`,
        ['token', key]
      )
      wsRef.current = ws

      ws.onopen = () => {
        setIsListening(true)

        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.ondataavailable = (e) => {
          if (ws.readyState === WebSocket.OPEN && e.data.size > 0) {
            ws.send(e.data)
          }
        }
        mediaRecorder.start(250)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        // utterance_end_ms fires when Deepgram detects end of speech — flush immediately
        if (data.type === 'UtteranceEnd') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          if (finalTranscriptRef.current.trim()) {
            onSilenceRef.current(finalTranscriptRef.current)
            finalTranscriptRef.current = ''
            setFinalTranscript('')
          }
          return
        }

        const transcript = data.channel?.alternatives?.[0]?.transcript
        if (!transcript) return

        if (data.is_final) {
          finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + transcript).trim()
          setFinalTranscript(finalTranscriptRef.current)
          setInterimTranscript('')
          resetSilenceTimer()
        } else {
          setInterimTranscript(transcript)
        }
      }

      ws.onerror = (e) => {
        console.error('Deepgram WS error', e)
        setIsListening(false)
        mediaRecorderRef.current?.stop()
        streamRef.current?.getTracks().forEach(t => t.stop())
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      }
      ws.onclose = () => setIsListening(false)
    } catch (err) {
      console.error('Failed to start Deepgram', err)
    }
  }, [resetSilenceTimer])

  const stop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    // Flush any accumulated transcript that hasn't been sent yet
    if (finalTranscriptRef.current.trim()) {
      onSilenceRef.current(finalTranscriptRef.current)
      finalTranscriptRef.current = ''
      setFinalTranscript('')
    }
    mediaRecorderRef.current?.stop()
    wsRef.current?.close()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const reset = useCallback(() => {
    finalTranscriptRef.current = ''
    setFinalTranscript('')
    setInterimTranscript('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      mediaRecorderRef.current?.stop()
      wsRef.current?.close()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { isListening, interimTranscript, finalTranscript, start, stop, reset }
}
