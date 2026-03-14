'use client'

import { useRef, useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import ExcalidrawCanvas, { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import EditorTopBar from '@/components/editor/EditorTopBar'
import { useAutoSave } from '@/hooks/useAutoSave'
import type { ExcalidrawElement } from '@/types/diagram'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null)
  const [isLoading, setIsLoading] = useState(false)

  const diagram = useLiveQuery(() => db.diagrams.get(id), [id])

  // Mark as opened
  useEffect(() => {
    if (diagram) {
      db.diagrams.update(id, { lastOpenedAt: Date.now() })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!diagram])

  const { triggerSave, saveStatus } = useAutoSave(id, canvasRef)

  // Redirect if diagram not found
  useEffect(() => {
    if (diagram === null) router.replace('/')
  }, [diagram, router])

  // Ctrl+S force-save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const elements = canvasRef.current?.getElements() || []
        triggerSave(elements)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [triggerSave])

  async function handleSilence(text: string) {
    if (!text.trim() || !diagram || diagram.locked) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          currentElements: diagram.elements,
        }),
      })
      const { elements }: { elements: ExcalidrawElement[] } = await res.json()
      canvasRef.current?.updateDiagram(elements)

      await db.diagrams.update(id, {
        transcript: (diagram.transcript + '\n' + text).trim(),
        metadata: { ...diagram.metadata, generatedVia: 'voice' },
      })
    } catch (err) {
      console.error('Failed to generate diagram:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (diagram === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900 text-zinc-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <EditorTopBar
        diagram={diagram!}
        saveStatus={saveStatus}
        onBack={() => router.push('/')}
        onRename={name => db.diagrams.update(id, { name, updatedAt: Date.now() })}
        onStar={starred => db.diagrams.update(id, { starred })}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[35%] h-full border-r border-zinc-800 shrink-0">
          <VoicePanel
            isLoading={isLoading}
            onSilence={handleSilence}
            onMockSubmit={handleSilence}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 relative">
          <ExcalidrawCanvas
            ref={canvasRef}
            initialElements={diagram!.elements}
            onChange={elements => triggerSave(elements)}
          />
          <LoadingIndicator isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
