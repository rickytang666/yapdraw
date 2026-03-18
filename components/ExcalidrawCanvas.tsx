'use client'

import '@excalidraw/excalidraw/index.css'
import {
  useEffect, useRef, forwardRef, useImperativeHandle,
  useState, useCallback, type ComponentProps,
} from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement, BinaryFileData } from '@/types/diagram'
import { mergeElements, prepareForConversion, enrichArrows } from '@/lib/excalidraw-helpers'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[], opts?: { replace?: boolean; files?: BinaryFileData[] }) => void
  getElements: () => ExcalidrawElement[]
  getFiles: () => Record<string, BinaryFileData>
  exportThumbnail?: () => Promise<string>
}

const BROWSER_CANVAS_LIMIT = 16384

function getSafeMaxDimension(): number {
  if (typeof window === 'undefined') return 4096
  const dpr = window.devicePixelRatio || 1
  return Math.floor(BROWSER_CANVAS_LIMIT / dpr)
}

function isNativeFormat(el: Record<string, unknown>): boolean {
  return el.version != null || el.versionNonce != null
}

interface Props {
  initialElements?: ExcalidrawElement[]
  initialFiles?: Record<string, BinaryFileData>
  onChange?: (elements: ExcalidrawElement[]) => void
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, Props>(
  ({ initialElements, initialFiles, onChange }, ref) => {
    const [Excalidraw, setExcalidraw] = useState<
      typeof import('@excalidraw/excalidraw').Excalidraw | null
    >(null)
    const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
      typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
    >(null)
    const [exportToBlob, setExportToBlob] = useState<
      typeof import('@excalidraw/excalidraw').exportToBlob | null
    >(null)

    const initialDataRef = useRef<{ elements: ExcalidrawElement[]; files?: Record<string, BinaryFileData> } | undefined>(undefined)
    const [hasMountedWithData, setHasMountedWithData] = useState(false)
    const [safeMax, setSafeMax] = useState(4096)
    const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      setSafeMax(getSafeMaxDimension())
    }, [])

    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      }
    }, [])

    // Scroll to content after mount
    useEffect(() => {
      if (!hasMountedWithData || !initialDataRef.current?.elements?.length) return
      scrollTimeoutRef.current = setTimeout(() => {
        scrollTimeoutRef.current = null
        apiRef.current?.scrollToContent(undefined, { fitToContent: true, animate: false })
      }, 100)
      return () => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      }
    }, [hasMountedWithData])

    // Load Excalidraw module
    useEffect(() => {
      import('@excalidraw/excalidraw').then((mod) => {
        // Build initial data from the prop (if provided)
        if (initialElements && initialElements.length > 0) {
          const elements = isNativeFormat(initialElements[0] as Record<string, unknown>)
            ? initialElements
            : mod.convertToExcalidrawElements(
                initialElements as Parameters<typeof mod.convertToExcalidrawElements>[0],
                { regenerateIds: false }
              )
          initialDataRef.current = { elements, files: initialFiles }
        }
        setExcalidraw(() => mod.Excalidraw)
        setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
        setExportToBlob(() => mod.exportToBlob)
      })
    }, []) // intentionally only run once on mount

    useImperativeHandle(ref, () => ({
      updateDiagram(incoming: ExcalidrawElement[], { replace = false, files = [] }: { replace?: boolean; files?: BinaryFileData[] } = {}) {
        if (!apiRef.current || !convertToExcalidrawElements) return

        // Register icon SVG files before updating the scene so image elements render immediately
        if (files.length > 0) {
          const fileMap: Record<string, unknown> = {}
          for (const f of files) fileMap[f.id] = f
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          apiRef.current.addFiles(fileMap as any)
        }

        // Elements saved from getSceneElements() are already in native Excalidraw format
        // (they carry `version`/`versionNonce`). Running them through prepareForConversion
        // and convertToExcalidrawElements mangles arrow bindings, repositions bound text,
        // and stripIndex destroys the already-correct fractional z-order indices.
        // Detect native format and pass them straight to updateScene.
        if (incoming.length === 0 || isNativeFormat(incoming[0] as Record<string, unknown>)) {
          if (replace) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apiRef.current.updateScene({ elements: incoming as any })
          } else {
            const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
            const merged = mergeElements(existing, incoming)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apiRef.current.updateScene({ elements: merged as any })
          }
          apiRef.current.scrollToContent(undefined, { fitToContent: true, animate: true, duration: 400 })
          return
        }

        const prepared = prepareForConversion(incoming)

        // Arrows from layoutGraph are already native-format (explicit x/y/points).
        // Running them through convertToExcalidrawElements produces half-converted
        // binding state → "Linear element is not normalized" on drag.
        // Shapes still need conversion for label → boundElements wiring.
        const isLinear = (el: ExcalidrawElement) => el.type === 'arrow' || el.type === 'line'
        const shapes = prepared.filter(el => !isLinear(el))
        const arrows = prepared.filter(el => isLinear(el))

        const convertedShapes = convertToExcalidrawElements(
          shapes as Parameters<typeof convertToExcalidrawElements>[0],
          { regenerateIds: false }
        ).map(el =>
          // convertToExcalidrawElements generates bound text elements with verticalAlign: 'top'
          // by default. Patch them to center so labels sit in the middle of their box.
          el.type === 'text' && (el as Record<string, unknown>).containerId
            ? { ...el, textAlign: 'center', verticalAlign: 'middle' }
            : el
        )
        const enrichedArrows = enrichArrows(arrows)
        const allElements = [...convertedShapes, ...enrichedArrows] as ExcalidrawElement[]

        // Strip fractional indices so Excalidraw re-assigns them based on array order.
        // Without this, merging existing elements (which carry stale indices) with new
        // bound text/arrow pairs can violate the invariant that a bound element's index
        // must be greater than its container's index.
        const stripIndex = (els: ExcalidrawElement[]) =>
          els.map(({ index: _i, ...rest }) => rest as ExcalidrawElement)

        if (replace) {
          // Excalidraw API expects its own element types; our ExcalidrawElement is a
          // lightweight/shared type used across the app.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          apiRef.current.updateScene({ elements: stripIndex(allElements) as any })
        } else {
          const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
          const merged = mergeElements(existing, allElements)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          apiRef.current.updateScene({ elements: stripIndex(merged) as any })
        }

        apiRef.current.scrollToContent(undefined, { fitToContent: true, animate: true, duration: 400 })
      },

      getElements() {
        if (!apiRef.current) return []
        return [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
      },

      getFiles() {
        if (!apiRef.current) return {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return apiRef.current.getFiles() as any as Record<string, BinaryFileData>
      },

      async exportThumbnail() {
        if (!apiRef.current || !exportToBlob) return ''
        try {
          const elements = apiRef.current.getSceneElements()
          if (elements.length === 0) return ''
          const blob = await exportToBlob({
            elements: elements as Parameters<typeof exportToBlob>[0]['elements'],
            appState: {
              exportBackground: true,
              exportWithDarkMode: false,
            } as Parameters<typeof exportToBlob>[0]['appState'],
            files: apiRef.current.getFiles(),
            getDimensions: (width: number, height: number) => {
              const scale = Math.min(400 / width, 300 / height, 1)
              return { width: Math.round(width * scale), height: Math.round(height * scale), scale }
            },
          })
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
        } catch {
          return ''
        }
      },
    }))

    const handleChange = useCallback(
      (elements: readonly { id: string }[]) => {
        if (!apiRef.current) return
        onChange?.([...elements] as ExcalidrawElement[])
      },
      [onChange]
    )

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
        <div
          className="flex items-center justify-center bg-white w-full h-full self-stretch"
          style={wrapperStyle}
        >
          <span className="text-[#94A3B8]">Loading canvas…</span>
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
          onChange={handleChange}
          theme="light"
          UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
        />
      </div>
    )
  }
)

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
