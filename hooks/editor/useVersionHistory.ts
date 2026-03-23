import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import type { DiagramVersion } from '@/types/library'
import type { ExcalidrawElement } from '@/types/diagram'

export function useVersionHistory(diagramId: string) {
  const versions = useLiveQuery(
    () =>
      db.versions
        .where('diagramId')
        .equals(diagramId)
        .reverse()
        .sortBy('savedAt'),
    [diagramId]
  ) ?? []

  const restoreVersion = useCallback(
    async (versionId: string) => {
      const diagram = await db.diagrams.get(diagramId)
      if (!diagram) return

      // Save current state as a new version before restoring
      const now = Date.now()
      await db.versions.add({
        id: nanoid(),
        diagramId,
        version: diagram.version,
        elements: diagram.elements,
        transcript: diagram.transcript,
        savedAt: now,
        label: 'Before restore',
      })

      const target = await db.versions.get(versionId)
      if (!target) return

      await db.diagrams.update(diagramId, {
        elements: target.elements as ExcalidrawElement[],
        transcript: target.transcript,
        updatedAt: now,
        version: diagram.version + 1,
      })
    },
    [diagramId]
  )

  const labelVersion = useCallback(async (versionId: string, label: string) => {
    await db.versions.update(versionId, { label })
  }, [])

  const deleteVersion = useCallback(async (versionId: string) => {
    await db.versions.delete(versionId)
  }, [])

  const pruneVersions = useCallback(() => pruneVersionsForDiagram(diagramId), [diagramId])

  return { versions, restoreVersion, labelVersion, deleteVersion, pruneVersions }
}

export async function pruneVersionsForDiagram(diagramId: string) {
  const allVersions = await db.versions
    .where('diagramId')
    .equals(diagramId)
    .sortBy('savedAt')

  const now = Date.now()
  const msPerDay = 24 * 60 * 60 * 1000
  const msPerWeek = 7 * msPerDay
  const toDelete: string[] = []

  const last7d: DiagramVersion[] = []
  const last4w: DiagramVersion[] = []
  const older: DiagramVersion[] = []

  for (const v of allVersions) {
    const age = now - v.savedAt
    if (age < msPerDay) continue // keep all <24h
    else if (age < 7 * msPerDay) last7d.push(v)
    else if (age < 4 * msPerWeek) last4w.push(v)
    else older.push(v)
  }

  const mark = (bucket: DiagramVersion[], getKey: (v: DiagramVersion) => string) => {
    const keep = keepOnePerBucket(bucket, getKey)
    for (const v of bucket) {
      if (!keep.has(v.id) && !v.label) toDelete.push(v.id)
    }
  }

  mark(last7d, v => { const d = new Date(v.savedAt); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` })
  mark(last4w, v => String(Math.floor(v.savedAt / msPerWeek)))
  mark(older,  v => { const d = new Date(v.savedAt); return `${d.getFullYear()}-${d.getMonth()}` })

  if (toDelete.length > 0) await db.versions.bulkDelete(toDelete)
}

function keepOnePerBucket(
  versions: DiagramVersion[],
  getBucket: (v: DiagramVersion) => string
): Set<string> {
  const bucketMap = new Map<string, DiagramVersion>()
  for (const v of versions) {
    const bucket = getBucket(v)
    const existing = bucketMap.get(bucket)
    // Prefer labeled versions, otherwise keep the most recent in bucket
    if (!existing || v.label || v.savedAt > existing.savedAt) {
      bucketMap.set(bucket, v)
    }
  }
  return new Set(Array.from(bucketMap.values()).map(v => v.id))
}
