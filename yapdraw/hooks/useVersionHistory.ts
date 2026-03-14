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

  const pruneVersions = useCallback(async () => {
    const allVersions = await db.versions
      .where('diagramId')
      .equals(diagramId)
      .sortBy('savedAt')

    const now = Date.now()
    const msPerDay = 24 * 60 * 60 * 1000
    const msPerWeek = 7 * msPerDay
    const msPerMonth = 30 * msPerDay

    const toDelete: string[] = []

    // Group versions by time bucket
    const last24h: DiagramVersion[] = []
    const last7d: DiagramVersion[] = []
    const last4w: DiagramVersion[] = []
    const older: DiagramVersion[] = []

    for (const v of allVersions) {
      const age = now - v.savedAt
      if (age < msPerDay) {
        last24h.push(v)
      } else if (age < 7 * msPerDay) {
        last7d.push(v)
      } else if (age < 4 * msPerWeek) {
        last4w.push(v)
      } else {
        older.push(v)
      }
    }

    // Keep all <24h — no pruning needed for that group

    // For last7d: keep 1 per day
    const keepFromLast7d = keepOnePerBucket(last7d, v => {
      const d = new Date(v.savedAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
    for (const v of last7d) {
      if (!keepFromLast7d.has(v.id) && !v.label) toDelete.push(v.id)
    }

    // For last4w: keep 1 per week
    const keepFromLast4w = keepOnePerBucket(last4w, v => {
      const weekNum = Math.floor(v.savedAt / msPerWeek)
      return String(weekNum)
    })
    for (const v of last4w) {
      if (!keepFromLast4w.has(v.id) && !v.label) toDelete.push(v.id)
    }

    // For older: keep 1 per month
    const keepFromOlder = keepOnePerBucket(older, v => {
      const d = new Date(v.savedAt)
      return `${d.getFullYear()}-${d.getMonth()}`
    })
    for (const v of older) {
      if (!keepFromOlder.has(v.id) && !v.label) toDelete.push(v.id)
    }

    if (toDelete.length > 0) {
      await db.versions.bulkDelete(toDelete)
    }
  }, [diagramId])

  return { versions, restoreVersion, labelVersion, deleteVersion, pruneVersions }
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
