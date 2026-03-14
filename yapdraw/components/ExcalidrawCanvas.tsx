'use client'

import '@excalidraw/excalidraw/index.css'
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback, type ComponentProps } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements } from '@/lib/excalidraw-helpers'
import { useDiagramState } from '@/hooks/useDiagramState'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
}

const STORAGE_KEY = 'yapdraw_elements'
const BROWSER_CANVAS_LIMIT = 16384

function getSafeMaxDimension(): number {
  if (typeof window === 'undefined') return 4096
  const dpr = window.devicePixelRatio || 1
  return Math.floor(BROWSER_CANVAS_LIMIT / dpr)
}

/** Native Excalidraw elements have version/versionNonce; skeleton format does not. */
function isNativeFormat(el: Record<string, unknown>): boolean {
  return el.version != null || el.versionNonce != null
}

function loadInitialData(
  mod: typeof import('@excalidraw/excalidraw')
): { elements: ExcalidrawElement[] } | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const saved = JSON.parse(raw) as ExcalidrawElement[]
    if (!Array.isArray(saved) || saved.length === 0) return undefined
    const elements = isNativeFormat(saved[0] as Record<string, unknown>)
      ? saved
      : mod.convertToExcalidrawElements(saved as Parameters<typeof mod.convertToExcalidrawElements>[0], { regenerateIds: false })
    return { elements }
  } catch {
    return undefined
  }
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle>((_, ref) => {
  const [Excalidraw, setExcalidraw] = useState<typeof import('@excalidraw/excalidraw').Excalidraw | null>(null)
  const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
    typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
  >(null)
  const [initialData, setInitialData] = useState<{ elements: ExcalidrawElement[] } | undefined>(undefined)
  const [hasMountedWithData, setHasMountedWithData] = useState(false)
  const [safeMax, setSafeMax] = useState(4096)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const { applyUpdate } = useDiagramState()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingElementsRef = useRef<ExcalidrawElement[] | null>(null)
  const debouncedApplyUpdate = useCallback(
    (elements: ExcalidrawElement[]) => {
      pendingElementsRef.current = elements
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingElementsRef.current) applyUpdate(pendingElementsRef.current)
        pendingElementsRef.current = null
        saveTimeoutRef.current = null
      }, 300)
    },
    [applyUpdate]
  )

  useEffect(() => {
    setSafeMax(getSafeMaxDimension())
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (pendingElementsRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingElementsRef.current))
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  // Load module and saved data together — use initialData so Excalidraw gets it on first mount
  // (updateScene right after API ready gets overwritten by Excalidraw's default initialData — see excalidraw#7585)
  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidraw(() => mod.Excalidraw)
      setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
      setInitialData(loadInitialData(mod))
    })
  }, [])

  useImperativeHandle(ref, () => ({
    updateDiagram(incoming: ExcalidrawElement[]) {
      if (!apiRef.current || !convertToExcalidrawElements) return
      const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
      const merged = mergeElements(existing, incoming)
      const converted = convertToExcalidrawElements(
        merged as Parameters<typeof convertToExcalidrawElements>[0],
        { regenerateIds: false }
      )
      apiRef.current.updateScene({ elements: converted })
      apiRef.current.scrollToContent(undefined, { animate: true, duration: 400 })
      applyUpdate(merged)
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
        initialData={
          !hasMountedWithData && initialData
            ? (initialData as unknown as ComponentProps<typeof Excalidraw>['initialData'])
            : undefined
        }
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          apiRef.current = api
          setHasMountedWithData(true)
          if (initialData?.elements?.length) {
            setTimeout(() => api.scrollToContent(undefined, { animate: false }), 150)
          }
        }}
        onChange={(elements) => debouncedApplyUpdate([...elements] as ExcalidrawElement[])}
        UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
