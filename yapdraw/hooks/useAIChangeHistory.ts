import { useState, useCallback } from 'react'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import { encodeAIMeta } from '@/lib/versionMeta'
import type { ExcalidrawElement } from '@/types/diagram'

export interface AIChangeEntry {
  versionId: string   // ID of the DiagramVersion row (pre-change snapshot)
  prompt: string
  summary: string
  savedAt: number
}

type AnyElement = { id: string; type?: string; label?: { text?: string } }

function diffSummary(before: AnyElement[], after: AnyElement[]): string {
  const beforeById = new Map(before.map(e => [e.id, e]))
  const afterById  = new Map(after.map(e => [e.id, e]))

  const added   = after.filter(e => !beforeById.has(e.id))
  const removed = before.filter(e => !afterById.has(e.id))
  const kept    = after.filter(e => beforeById.has(e.id))

  const countByType = (els: AnyElement[]) =>
    els.reduce<Record<string, number>>((acc, e) => {
      const t = e.type ?? 'element'
      acc[t] = (acc[t] ?? 0) + 1
      return acc
    }, {})

  const describe = (els: AnyElement[], verb: string): string | null => {
    const counts = countByType(els)
    const strs = Object.entries(counts).map(([type, n]) =>
      `${n} ${type}${n > 1 ? 's' : ''}`
    )
    return strs.length ? `${verb} ${strs.join(', ')}` : null
  }

  const parts: string[] = []
  const addedDesc   = describe(added, 'Added')
  const removedDesc = describe(removed, 'Removed')
  if (addedDesc)   parts.push(addedDesc)
  if (removedDesc) parts.push(removedDesc)

  const labelChanges = kept.filter(e => {
    const old = beforeById.get(e.id) as AnyElement | undefined
    return old?.label?.text !== e.label?.text && !!e.label?.text
  })
  if (labelChanges.length) {
    parts.push(`Updated ${labelChanges.length} label${labelChanges.length > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) {
    if (after.length !== before.length) return 'Rearranged diagram'
    return 'Refined diagram'
  }

  return parts.join(' · ')
}

export function useAIChangeHistory(diagramId: string) {
  const [entries, setEntries] = useState<AIChangeEntry[]>([])

  /**
   * Call BEFORE the LLM request. Snapshots current state into the versions
   * table with a temporary placeholder label. Returns the versionId.
   */
  const snapshotBeforeChange = useCallback(async (
    currentElements: ExcalidrawElement[],
    prompt: string,
    currentTranscript: string,
    currentVersion: number,
  ): Promise<string> => {
    const versionId = nanoid()
    await db.versions.add({
      id: versionId,
      diagramId,
      version: currentVersion,
      elements: currentElements,
      transcript: currentTranscript,
      savedAt: Date.now(),
      label: encodeAIMeta({ prompt, summary: '…', source: 'ai' }),
    })
    return versionId
  }, [diagramId])

  /**
   * Call AFTER the LLM returns. Computes the diff, updates the DB label,
   * and adds the entry to the in-memory list shown in the VoicePanel.
   */
  const recordChange = useCallback(async (
    versionId: string,
    prompt: string,
    beforeElements: ExcalidrawElement[],
    afterElements: ExcalidrawElement[],
  ): Promise<void> => {
    const summary = diffSummary(
      beforeElements as AnyElement[],
      afterElements as AnyElement[],
    )
    await db.versions.update(versionId, {
      label: encodeAIMeta({ prompt, summary, source: 'ai' }),
    })
    setEntries(prev => [
      { versionId, prompt, summary, savedAt: Date.now() },
      ...prev,
    ])
  }, [])

  /** Remove an entry after it has been restored. */
  const removeEntry = useCallback((versionId: string) => {
    setEntries(prev => prev.filter(e => e.versionId !== versionId))
  }, [])

  /** Clear all in-memory entries (e.g. after a restore). */
  const clearEntries = useCallback(() => setEntries([]), [])

  return { entries, snapshotBeforeChange, recordChange, removeEntry, clearEntries }
}
