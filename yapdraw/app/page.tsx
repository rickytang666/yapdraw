'use client'

import { useRef, useState } from 'react'
import ExcalidrawCanvas, { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import { ExcalidrawElement } from '@/types/diagram'

export default function Home() {
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null)
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  async function handleSilence(text: string) {
    if (!text.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, currentElements: [] }),
      })
      const { elements }: { elements: ExcalidrawElement[] } = await res.json()
      canvasRef.current?.updateDiagram(elements)
    } catch (err) {
      console.error('Failed to generate diagram:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleMockSubmit(text: string) {
    setTranscript((prev) => prev ? `${prev}\n${text}` : text)
    handleSilence(text)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[35%] h-full border-r border-zinc-200 shrink-0">
        <VoicePanel
          isListening={isListening}
          isLoading={isLoading}
          transcript={transcript}
          interimTranscript={interimTranscript}
          onStart={() => setIsListening(true)}
          onStop={() => setIsListening(false)}
          onMockSubmit={handleMockSubmit}
        />
      </div>
      <div className="flex-1 min-w-0 min-h-0 relative">
        <ExcalidrawCanvas ref={canvasRef} />
        <LoadingIndicator isLoading={isLoading} />
      </div>
    </div>
  )
}
