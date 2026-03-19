import { useRef, useCallback, useEffect, useState, type RefObject } from 'react'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 2000
const VERSION_SNAPSHOT_INTERVAL = 15 * 60 * 1000  // 15 minutes — safety net only
const VERSION_SNAPSHOT_EVERY_N = 50               // or every 50 saves

export function useAutoSave(
  diagramId: string,
  canvasRef: RefObject<ExcalidrawCanvasHandle | null>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastVersionTimeRef = useRef<number>(Date.now())
  const saveCountRef = useRef(0)
  const saveRef = useRef<(elements: ExcalidrawElement[]) => Promise<void>>(() => Promise.resolve())
  const pausedRef = useRef(false)
  const liveElementsRef = useRef<ExcalidrawElement[] | null>(null)

  const save = useCallback(async (elements: ExcalidrawElement[]) => {
    setSaveStatus('saving')
    try {
      const diagram = await db.diagrams.get(diagramId)
      if (!diagram) return

      const now = Date.now()
      const newVersion = diagram.version + 1
      saveCountRef.current++

      const metadata = {
        ...diagram.metadata,
        elementCount: elements.length,
        arrowCount: elements.filter(e => (e as { type?: string }).type === 'arrow').length,
        colorPalette: [...new Set(
          elements
            .map(e => (e as { backgroundColor?: string }).backgroundColor)
            .filter(Boolean) as string[]
        )].slice(0, 6),
      }

      // Generate thumbnail (skip for very large diagrams)
      let thumbnail = diagram.thumbnail
      if (elements.length <= 2000 && canvasRef.current) {
        try {
          thumbnail = await canvasRef.current.exportThumbnail?.() || thumbnail
        } catch { /* keep old thumbnail */ }
      }

      const files = canvasRef.current?.getFiles?.() ?? {}

      await db.diagrams.update(diagramId, {
        elements,
        files,
        updatedAt: now,
        version: newVersion,
        metadata,
        thumbnail,
      })

      // Version snapshot decision
      const timeSinceLastVersion = now - lastVersionTimeRef.current
      const shouldSnapshot =
        saveCountRef.current % VERSION_SNAPSHOT_EVERY_N === 0 ||
        timeSinceLastVersion > VERSION_SNAPSHOT_INTERVAL

      if (shouldSnapshot) {
        await db.versions.add({
          id: nanoid(),
          diagramId,
          version: newVersion,
          elements,
          transcript: diagram.transcript,
          savedAt: now,
          label: null,
        })
        lastVersionTimeRef.current = now
      }

      setSaveStatus('saved')
    } catch (err) {
      console.error('Auto-save failed:', err)
      setSaveStatus('error')
    }
  }, [diagramId, canvasRef])

  // Keep saveRef in sync so event listeners always call the latest save
  saveRef.current = save

  const pauseSave = useCallback((liveElements: ExcalidrawElement[]) => {
    pausedRef.current = true
    liveElementsRef.current = liveElements
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }, [])

  const resumeSave = useCallback(() => {
    pausedRef.current = false
    liveElementsRef.current = null
  }, [])

  const triggerSave = useCallback((elements: ExcalidrawElement[]) => {
    if (pausedRef.current) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(elements), SAVE_DEBOUNCE_MS)
  }, [save])

  const forceSave = useCallback(async (elements: ExcalidrawElement[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveCountRef.current = VERSION_SNAPSHOT_EVERY_N - 1
    await save(elements)
  }, [save])

  const saveVersion = useCallback(async () => {
    const elements = canvasRef.current?.getElements() ?? []
    const diagram = await db.diagrams.get(diagramId)
    if (!diagram) return
    const now = Date.now()
    await db.versions.add({
      id: nanoid(),
      diagramId,
      version: diagram.version,
      elements,
      transcript: diagram.transcript,
      savedAt: now,
      label: 'checkpoint',
    })
    lastVersionTimeRef.current = now
  }, [diagramId, canvasRef])

  useEffect(() => {
    function handleBeforeUnload() {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      if (pausedRef.current) return
      const elements = canvasRef.current?.getElements() ?? []
      if (elements.length > 0) saveRef.current(elements)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current)
          saveTimerRef.current = null
        }
        if (pausedRef.current) return
        const elements = canvasRef.current?.getElements() ?? []
        if (elements.length > 0) saveRef.current(elements)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  // canvasRef and saveRef are refs — they don't change, so empty dep array is correct
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { triggerSave, forceSave, saveVersion, saveStatus, pauseSave, resumeSave }
}
