'use client'

import { useRef, useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import ExcalidrawCanvas, { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'
import LoadingIndicator from '@/components/LoadingIndicator'
import EditorTopBar from '@/components/editor/EditorTopBar'
import VersionHistoryPanel from '@/components/editor/VersionHistoryPanel'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useVersionHistory } from '@/hooks/useVersionHistory'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import type { ExcalidrawElement, GraphResponse } from '@/types/diagram'
import type { Diagram } from '@/types/library'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditorPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const canvasRef = useRef<ExcalidrawCanvasHandle>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [lastGraph, setLastGraph] = useState<GraphResponse | null>(null)

  const diagram = useLiveQuery(() => db.diagrams.get(id), [id])

  // Mark as opened
  useEffect(() => {
    if (diagram) {
      db.diagrams.update(id, { lastOpenedAt: Date.now() })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!diagram])

  const { triggerSave, forceSave, saveStatus } = useAutoSave(id, canvasRef)
  const { pruneVersions } = useVersionHistory(id)

  // Prune old versions on mount
  useEffect(() => {
    pruneVersions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Redirect if diagram not found
  useEffect(() => {
    if (diagram === null) router.replace('/')
  }, [diagram, router])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+s': () => {
      const elements = canvasRef.current?.getElements() || []
      forceSave(elements)
    },
  })

  async function handleSilence(text: string) {
    if (!text.trim() || !diagram || diagram.locked) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          currentGraph: (canvasRef.current?.getElements() ?? []).length > 0 ? lastGraph : null,
        }),
      })
      const data = await res.json()
      if (data.skipped) return
      if (!res.ok || !data.elements) {
        console.error('generate-diagram failed:', data.error ?? data)
        return
      }
      const { elements, graph }: { elements: ExcalidrawElement[]; graph: GraphResponse } = data
      setLastGraph(graph)
      canvasRef.current?.updateDiagram(elements, { replace: true })

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

  async function handleDuplicate() {
    if (!diagram) return
    const newId = nanoid()
    const now = Date.now()
    const duplicate: Diagram = {
      ...diagram,
      id: newId,
      name: `${diagram.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      version: 1,
      trashedAt: null,
      starred: false,
    }
    await db.diagrams.add(duplicate)
    router.push(`/d/${newId}`)
  }

  async function handleToggleLock() {
    if (!diagram) return
    await db.diagrams.update(id, { locked: !diagram.locked })
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
  onBack={() => router.push('/library')}
        onRename={name => db.diagrams.update(id, { name, updatedAt: Date.now() })}
        onStar={starred => db.diagrams.update(id, { starred })}
        onShowHistory={() => setShowVersionHistory(true)}
        onDuplicate={handleDuplicate}
        onToggleLock={handleToggleLock}
        canvasRef={canvasRef}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[35%] h-full border-r border-zinc-800 shrink-0">
          <VoicePanel
            isLoading={isLoading}
            onSilence={handleSilence}
            onMockSubmit={handleSilence}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0 p-3 bg-zinc-900">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <ExcalidrawCanvas
              ref={canvasRef}
              initialElements={diagram!.elements}
              onChange={elements => triggerSave(elements)}
            />
            <LoadingIndicator isLoading={isLoading} />

            {/* Locked overlay */}
            {diagram?.locked && (
              <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-6 z-10">
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg backdrop-blur-sm">
                  <span className="text-yellow-400 text-sm font-medium">
                    This diagram is locked. Voice input is disabled.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version History Panel */}
      <VersionHistoryPanel
        diagramId={id}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        canvasRef={canvasRef}
      />
    </div>
  )
}
