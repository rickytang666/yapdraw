'use client'

import '@excalidraw/excalidraw/index.css'
import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentProps,
} from 'react'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { ExcalidrawElement } from '@/types/diagram'
import { mergeElements } from '@/lib/excalidraw-helpers'

export interface ExcalidrawCanvasHandle {
  updateDiagram: (elements: ExcalidrawElement[]) => void
  exportThumbnail: () => Promise<string | null>
  getElements: () => ExcalidrawElement[]
}

interface ExcalidrawCanvasProps {
  initialElements?: ExcalidrawElement[]
  onChange?: (elements: ExcalidrawElement[]) => void
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

const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasHandle, ExcalidrawCanvasProps>(
  ({ initialElements, onChange }, ref),
) => {
  const [Excalidraw, setExcalidraw] = useState<typeof import('@excalidraw/excalidraw').Excalidraw | null>(null)
  const [convertToExcalidrawElements, setConvertToExcalidrawElements] = useState<
    typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null
  >(null)
  const [initialData, setInitialData] = useState<{ elements: ExcalidrawElement[] } | undefined>(undefined)
  const [hasMountedWithData, setHasMountedWithData] = useState(false)
  const [safeMax, setSafeMax] = useState(4096)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const convertRef = useRef<typeof import('@excalidraw/excalidraw').convertToExcalidrawElements | null>(null)

  useEffect(() => {
    setSafeMax(getSafeMaxDimension())
  }, [])

  useEffect(() => {
    import('@excalidraw/excalidraw').then((mod) => {
      setExcalidraw(() => mod.Excalidraw)
      setConvertToExcalidrawElements(() => {
        convertRef.current = mod.convertToExcalidrawElements
        return mod.convertToExcalidrawElements
      })

      if (initialElements && initialElements.length) {
        const first = initialElements[0] as Record<string, unknown>
        const elements = isNativeFormat(first)
          ? initialElements
          : mod.convertToExcalidrawElements(
              initialElements as Parameters<typeof mod.convertToExcalidrawElements>[0],
              { regenerateIds: false },
            )
        setInitialData({ elements })
      }
    })
  }, [initialElements])

  useImperativeHandle(ref, () => ({
    updateDiagram(incoming: ExcalidrawElement[]) {
      if (!apiRef.current || !convertRef.current) return
      const existing = [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
      const merged = mergeElements(existing, incoming)
      const converted = convertRef.current(
        merged as Parameters<NonNullable<typeof convertRef.current>>[0],
        { regenerateIds: false },
      )
      apiRef.current.updateScene({ elements: converted })
      apiRef.current.scrollToContent(undefined, { animate: true, duration: 400 })
    },
    async exportThumbnail(): Promise<string | null> {
      if (!apiRef.current) return null
      try {
        const blob = await apiRef.current.exportToBlob({
          mimeType: 'image/png',
          quality: 0.5,
          maxWidthOrHeight: 400,
        })
        return await new Promise<string | null>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string | null)
          reader.readAsDataURL(blob)
        })
      } catch {
        return null
      }
    },
    getElements(): ExcalidrawElement[] {
      if (!apiRef.current) return []
      return [...apiRef.current.getSceneElements()] as ExcalidrawElement[]
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
        onChange={(elements) => {
          if (onChange) {
            onChange([...elements] as ExcalidrawElement[])
          }
        }}
        UIOptions={{ canvasActions: { export: false, saveAsImage: false } }}
      />
    </div>
  )
})

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'
export default ExcalidrawCanvas
