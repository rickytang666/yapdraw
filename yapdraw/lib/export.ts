import { saveAs } from 'file-saver'
import type { Diagram } from '@/types/library'

export async function exportAsPNG(thumbnailBase64: string, filename: string): Promise<void> {
  if (!thumbnailBase64) return
  // Convert base64 data URL to blob
  const response = await fetch(thumbnailBase64)
  const blob = await response.blob()
  saveAs(blob, `${filename}.png`)
}

export async function exportAsSVG(_api: unknown, filename: string): Promise<void> {
  // SVG export not supported via ExcalidrawCanvasHandle — log a notice
  console.warn(`exportAsSVG: SVG export not available for "${filename}". The canvas handle does not expose exportToSvg.`)
}

export function exportAsExcalidraw(diagram: Diagram): void {
  const data = {
    type: 'excalidraw',
    version: 2,
    source: 'yapdraw',
    elements: diagram.elements,
    appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
    files: {},
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, `${diagram.name}.excalidraw`)
}

export function exportAsJSON(diagram: Diagram): void {
  const data = {
    id: diagram.id,
    name: diagram.name,
    diagramType: diagram.diagramType,
    elements: diagram.elements,
    transcript: diagram.transcript,
    metadata: diagram.metadata,
    createdAt: diagram.createdAt,
    updatedAt: diagram.updatedAt,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  saveAs(blob, `${diagram.name}.json`)
}

export async function exportBulkAsZip(
  diagrams: Diagram[],
  format: 'excalidraw' | 'json'
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  for (const diagram of diagrams) {
    const safeName = diagram.name.replace(/[/\\?%*:|"<>]/g, '-')
    if (format === 'excalidraw') {
      const data = {
        type: 'excalidraw',
        version: 2,
        source: 'yapdraw',
        elements: diagram.elements,
        appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
        files: {},
      }
      zip.file(`${safeName}.excalidraw`, JSON.stringify(data, null, 2))
    } else {
      const data = {
        id: diagram.id,
        name: diagram.name,
        diagramType: diagram.diagramType,
        elements: diagram.elements,
        transcript: diagram.transcript,
        metadata: diagram.metadata,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
      }
      zip.file(`${safeName}.json`, JSON.stringify(data, null, 2))
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `yapdraw-export-${Date.now()}.zip`)
}
