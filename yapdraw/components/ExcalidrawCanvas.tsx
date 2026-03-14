'use client'

import '@excalidraw/excalidraw/index.css'
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements } from '@/lib/excalidraw-helpers'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
}

// Safe canvas size: 1024×768 keeps us under browser limit (16384) at 3× DPR
const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 768

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle>((_, ref) => {
  const [Excalidraw, setExcalidraw] = useState<typeof import('@excalidraw/excalidraw').Excalidraw | null>(null)
  const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
    typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
  >(null)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)

  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidraw(() => mod.Excalidraw)
      setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
    })
  }, [])

  useImperativeHandle(ref, () => ({
    updateDiagram(incoming: ExcalidrawElement[]) {
      if (!apiRef.current || !convertToExcalidrawElements) return
      const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
      const merged = mergeElements(existing, incoming)
      const converted = convertToExcalidrawElements(merged as Parameters<typeof convertToExcalidrawElements>[0], { regenerateIds: false })
      apiRef.current.updateScene({ elements: converted })
      apiRef.current.scrollToContent(undefined, { animate: true, duration: 400 })
    },
  }))

  if (!Excalidraw) {
    return (
      <div
        className="flex items-center justify-center bg-zinc-100"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <span className="text-zinc-500">Loading canvas…</span>
      </div>
    )
  }

  return (
    <div
      className="excalidraw-wrapper"
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => { apiRef.current = api }}
        UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
