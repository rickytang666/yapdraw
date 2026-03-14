'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { Diagram } from '@/types/library'

export default function NewDiagram() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const folderId = params.get('folder')

    async function create() {
      const id = nanoid()
      const now = Date.now()

      let elements: any[] = []
      const diagramType: Diagram['diagramType'] = 'freeform'
      const generatedVia: Diagram['metadata']['generatedVia'] = 'manual'

      const diagram: Diagram = {
        id,
        name: 'Untitled Diagram',
        folderId: folderId || null,
        elements,
        transcript: '',
        diagramType,
        thumbnail: null,
        tags: [],
        starred: false,
        locked: false,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now,
        version: 1,
        trashedAt: null,
        metadata: {
          elementCount: elements.length,
          arrowCount: elements.filter((e: any) => e.type === 'arrow').length,
          colorPalette: [],
          generatedVia,
        },
      }

      await db.diagrams.add(diagram)
      router.replace(`/d/${id}`)
    }

    create()
  }, [router, params])

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-900 text-zinc-400">
      Creating diagram…
    </div>
  )
}

