'use client'

import '@excalidraw/excalidraw/index.css'
import {
  useEffect, useRef, forwardRef, useImperativeHandle,
  useState, useCallback, type ComponentProps,
} from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements } from '@/lib/excalidraw-helpers'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
  getElements: () => ExcalidrawElement[]
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
  onChange?: (elements: ExcalidrawElement[]) => void
}

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, Props>(
  ({ initialElements, onChange }, ref) => {
    const [Excalidraw, setExcalidraw] = useState<
      typeof import('@excalidraw/excalidraw').Excalidraw | null
    >(null)
    const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
      typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
    >(null)
    const [exportToBlob, setExportToBlob] = useState<
      typeof import('@excalidraw/excalidraw').exportToBlob | null
    >(null)

    const initialDataRef = useRef<{ elements: ExcalidrawElement[] } | undefined>(undefined)
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
        apiRef.current?.scrollToContent(undefined, { animate: false })
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
          initialDataRef.current = { elements }
        }
        setExcalidraw(() => mod.Excalidraw)
        setConvertToExcalidrawElements(() => mod.convertToExcalidrawElements)
        setExportToBlob(() => mod.exportToBlob)
      })
    }, []) // intentionally only run once on mount

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
      },

      getElements() {
        if (!apiRef.current) return []
        return [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
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
              width: 200,
              height: 150,
            } as Parameters<typeof exportToBlob>[0]['appState'],
            files: apiRef.current.getFiles(),
            getDimensions: () => ({ width: 200, height: 150, scale: 1 }),
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
          className="flex items-center justify-center bg-zinc-100 w-full h-full self-stretch"
          style={wrapperStyle}
        >
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
          onChange={handleChange}
          UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
        />
      </div>
    )
  }
)

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
