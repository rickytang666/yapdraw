'use client'

import '@excalidraw/excalidraw/index.css'
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements } from '@/lib/excalidraw-helpers'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
}

// Browser canvas limit (~16k px). Max CSS dim = limit / devicePixelRatio.
const BROWSER_CANVAS_LIMIT = 16384

function getSafeMaxDimension(): number {
  if (typeof window === 'undefined') return 4096
  const dpr = window.devicePixelRatio || 1
  return Math.floor(BROWSER_CANVAS_LIMIT / dpr)
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle>((_, ref) => {
  const [Excalidraw, setExcalidraw] = useState<typeof import('@excalidraw/excalidraw').Excalidraw | null>(null)
  const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
    typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
  >(null)
  const [safeMax, setSafeMax] = useState(4096)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)

  useEffect(() => {
    setSafeMax(getSafeMaxDimension())
  }, [])

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

  const wrapperStyle = {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    maxWidth: safeMax,
    maxHeight: safeMax,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }

  if (!Excalidraw) {
    return (
      <div className="flex items-center justify-center bg-zinc-100 w-full h-full self-stretch" style={wrapperStyle}>
        <span className="text-zinc-500">Loading canvas…</span>
      </div>
    )
  }

  return (
    <div className="excalidraw-wrapper w-full h-full self-stretch" style={wrapperStyle}>
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => { apiRef.current = api }}
        UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
