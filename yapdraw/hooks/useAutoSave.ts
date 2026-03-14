import { useRef, useCallback, useEffect, useState, type RefObject } from 'react'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'
import type { ExcalidrawElement } from '@/types/diagram'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 2000
const VERSION_SNAPSHOT_INTERVAL = 5 * 60 * 1000  // 5 minutes
const VERSION_SNAPSHOT_EVERY_N = 10               // or every 10 saves

export function useAutoSave(
  diagramId: string,
  canvasRef: RefObject<ExcalidrawCanvasHandle | null>
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastVersionTimeRef = useRef<number>(Date.now())
  const saveCountRef = useRef(0)

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

      await db.diagrams.update(diagramId, {
        elements,
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

  const triggerSave = useCallback((elements: ExcalidrawElement[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => save(elements), SAVE_DEBOUNCE_MS)
  }, [save])

  const forceSave = useCallback(async (elements: ExcalidrawElement[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveCountRef.current = VERSION_SNAPSHOT_EVERY_N - 1
    await save(elements)
  }, [save])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return { triggerSave, forceSave, saveStatus }
}
