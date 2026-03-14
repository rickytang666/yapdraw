'use client'

import '@excalidraw/excalidraw/index.css'
import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback, type ComponentProps } from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements, prepareForConversion } from '@/lib/excalidraw-helpers'
import { useDiagramState } from '@/hooks/useDiagramState'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[], opts?: { replace?: boolean }) => void
}

const STORAGE_KEY = 'yapdraw_elements'
const BROWSER_CANVAS_LIMIT = 16384

function getSafeMaxDimension(): number {
  if (typeof window === 'undefined') return 4096
  const dpr = window.devicePixelRatio || 1
  return Math.floor(BROWSER_CANVAS_LIMIT / dpr)
}

function isNativeFormat(el: Record<string, unknown>): boolean {
  return el.version != null || el.versionNonce != null
}

function loadInitialData(
  mod: typeof import('@excalidraw/excalidraw')
): { elements: ExcalidrawElement[]; appState: { theme: 'dark' } } | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const saved = JSON.parse(raw) as ExcalidrawElement[]
    if (!Array.isArray(saved) || saved.length === 0) return undefined
    const elements = isNativeFormat(saved[0] as Record<string, unknown>)
      ? saved
      : mod.convertToExcalidrawElements(
          saved as Parameters<typeof mod.convertToExcalidrawElements>[0],
          { regenerateIds: false }
        )
    return { elements, appState: { theme: 'dark' } }
  } catch {
    return undefined
  }
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle>((_, ref) => {
  const [Excalidraw, setExcalidraw] = useState<typeof import('@excalidraw/excalidraw').Excalidraw | null>(null)
  const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
    typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
  >(null)
  // Stored in a ref so the prop value never changes after first mount — prevents Excalidraw
  // from resetting the scene when hasMountedWithData flips and would have set it to undefined
  const initialDataRef = useRef<{ elements?: ExcalidrawElement[]; appState: { theme: 'dark' } } | undefined>(undefined)
  const [hasMountedWithData, setHasMountedWithData] = useState(false)
  const [safeMax, setSafeMax] = useState(4096)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const { applyUpdate } = useDiagramState()
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  // Flush pending save and cancel timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      if (pendingElementsRef.current) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingElementsRef.current))
        } catch { /* ignore */ }
      }
    }
  }, [])

  // Scroll to restored content after Excalidraw confirms it's mounted
  // (can't call scrollToContent inside excalidrawAPI — _App isn't ready yet)
  useEffect(() => {
    if (!hasMountedWithData || !initialDataRef.current?.elements?.length) return
    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null
      apiRef.current?.scrollToContent(undefined, { animate: false })
    }, 100)
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [hasMountedWithData])

  // Load module + read localStorage once — store in ref so it's stable as a prop
  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      initialDataRef.current = loadInitialData(mod) ?? { appState: { theme: 'dark' } }
      setExcalidraw(() => mod.Excalidraw)
      setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
    })
  }, [])

  useImperativeHandle(ref, () => ({
    updateDiagram(incoming: ExcalidrawElement[], { replace = false } = {}) {
      if (!apiRef.current || !convertToExcalidrawElements) return

      // prepareForConversion rewrites startBinding/endBinding → start/end so
      // convertToExcalidrawElements properly sets up boundElements on both shapes.
      const prepared = prepareForConversion(incoming)
      const converted = convertToExcalidrawElements(
        prepared as Parameters<typeof convertToExcalidrawElements>[0],
        { regenerateIds: false }
      )

      if (replace) {
        // Dagre layout: use computed positions as-is, don't merge with old scene.
        // Merging would override Dagre's optimal positions with stale coordinates.
        apiRef.current.updateScene({ elements: converted })
      } else {
        // Legacy path: preserve manually-dragged positions for existing elements.
        const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
        const merged = mergeElements(existing, converted)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        apiRef.current.updateScene({ elements: merged as any })
        applyUpdate(merged)
        apiRef.current.scrollToContent(undefined, { animate: true, duration: 400 })
        return
      }

      apiRef.current.scrollToContent(undefined, { animate: true, duration: 400 })
      applyUpdate(incoming)
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
        initialData={initialDataRef.current as ComponentProps<typeof Excalidraw>['initialData']}
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          apiRef.current = api
          setHasMountedWithData(true)
        }}
        onChange={(elements) => {
          if (!apiRef.current) return
          debouncedApplyUpdate([...elements] as ExcalidrawElement[])
        }}
        UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
