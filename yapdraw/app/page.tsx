'use client'

import { useRef, useState } from 'react'
import ExcalidrawCanvas, { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import { ExcalidrawElement } from '@/types/diagram'

export default function Home() {
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[35%] h-full border-r border-zinc-800 shrink-0">
        <VoicePanel
          isLoading={isLoading}
          onSilence={handleSilence}
          onMockSubmit={handleSilence}
        />
      </div>
      <div className="flex-1 min-w-0 min-h-0 relative">
        <ExcalidrawCanvas ref={canvasRef} />
        <LoadingIndicator isLoading={isLoading} />
      </div>
    </div>
  )
}
