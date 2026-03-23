'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/db'
import { buildDebrief } from '@/lib/ai/debrief'
import { useAIChangeHistory } from '@/hooks/editor/useAIChangeHistory'
import type { LoadingPhase } from '@/components/editor/LoadingIndicator'
import type { ExcalidrawCanvasHandle } from '@/components/editor/ExcalidrawCanvas'
import type { ExcalidrawElement, GraphResponse, BinaryFileData } from '@/types/diagram'
import type { Diagram } from '@/types/library'
import type { UserSettings } from '@/hooks/useUserSettings'

interface Options {
  id: string
  diagram: Diagram | null | undefined
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  settings: UserSettings
}

export function useAIGeneration({ id, diagram, canvasRef, settings }: Options) {
  const aiHistory = useAIChangeHistory(id)
  const abortRef = useRef<AbortController | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lastGraph, setLastGraph] = useState<GraphResponse | null>(null)
  const lastGraphInitRef = useRef(false)
  const lastAIVersionIdRef = useRef<string | null>(null)
  const micSessionRef = useRef<{
    versionId: string
    startElements: ExcalidrawElement[]
    hasChanges: boolean
  } | null>(null)

  // hydrate lastGraph from persisted value on first load
  useEffect(() => {
    if (diagram && !lastGraphInitRef.current && diagram.graph) {
      setLastGraph(diagram.graph)
      lastGraphInitRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram?.id])

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    setErrorMessage(msg)
    errorTimerRef.current = setTimeout(() => setErrorMessage(null), 4000)
  }

  // one snapshot per mic session
  async function handleMicStart() {
    if (!diagram) return
    const startElements = canvasRef.current?.getElements() ?? diagram.elements
    const versionId = await aiHistory.snapshotBeforeChange(
      startElements as ExcalidrawElement[], '', diagram.transcript, diagram.version,
    )
    micSessionRef.current = { versionId, startElements: startElements as ExcalidrawElement[], hasChanges: false }
    lastAIVersionIdRef.current = versionId
  }

  // delete orphan snapshot if mic closed without a successful generation
  async function handleMicStop() {
    const session = micSessionRef.current
    micSessionRef.current = null
    if (session && !session.hasChanges) {
      await db.versions.delete(session.versionId)
      lastAIVersionIdRef.current = null
    }
  }

  async function handleSilence(text: string) {
    if (!text.trim() || !diagram || diagram.locked) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoadingPhase('generating')

    // reuse mic session snapshot (one version per session), or take a fresh one
    const session = micSessionRef.current
    const snapshotElements = session
      ? session.startElements
      : (canvasRef.current?.getElements() ?? diagram.elements) as ExcalidrawElement[]
    let versionId = session?.versionId ?? null
    if (!versionId) {
      versionId = await aiHistory.snapshotBeforeChange(
        snapshotElements, text, diagram.transcript, diagram.version,
      )
      lastAIVersionIdRef.current = versionId
    }

    try {
      const liveElements = canvasRef.current?.getElements() ?? []
      const hasCanvas = liveElements.length > 0
      const debrief = hasCanvas && lastGraph ? buildDebrief(liveElements, lastGraph) : null

      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          currentGraph: hasCanvas ? lastGraph : null,
          manualEditDebrief: debrief,
          providerConfig: { provider: settings.provider, apiKey: settings.apiKey },
        }),
        signal: AbortSignal.any([abortRef.current.signal, AbortSignal.timeout(30000)]),
      })
      const data = await res.json()
      if (data.skipped) return
      if (data.usedFallback) showError('api key invalid — used free tier instead')
      if (!res.ok || !data.elements) {
        console.error('generate-diagram failed:', data.error ?? data)
        if (!session) { await db.versions.delete(versionId!); lastAIVersionIdRef.current = null }
        return
      }

      const { elements, graph, files = [] }: {
        elements: ExcalidrawElement[]
        graph: GraphResponse
        files: BinaryFileData[]
      } = data
      setLastGraph(graph)
      setLoadingPhase('rendering')
      canvasRef.current?.updateDiagram(elements, { replace: true, files })

      if (session) session.hasChanges = true
      await aiHistory.recordChange(versionId!, text, liveElements as ExcalidrawElement[], elements)
      await db.diagrams.update(id, {
        transcript: (diagram.transcript + '\n' + text).trim(),
        metadata: { ...diagram.metadata, generatedVia: 'voice' },
        graph,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (!session) { await db.versions.delete(versionId!); lastAIVersionIdRef.current = null }
      if (err instanceof Error && err.name === 'TimeoutError') {
        showError('took too long — try again')
      } else {
        console.error('Failed to generate diagram:', err)
        showError('something went wrong — try again')
      }
    } finally {
      setLoadingPhase('idle')
    }
  }

  return {
    loadingPhase,
    isLoading: loadingPhase !== 'idle',
    errorMessage,
    showError,
    handleMicStart,
    handleMicStop,
    handleSilence,
  }
}
