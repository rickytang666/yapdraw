'use client'

import { useState, useCallback, useEffect } from 'react'
import { ExcalidrawElement } from '@/types/diagram'

const STORAGE_KEY = 'yapdraw_elements'

function loadFromStorage(): ExcalidrawElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(elements: ExcalidrawElement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements))
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export function useDiagramState() {
  const [elements, setElements] = useState<ExcalidrawElement[]>([])
  const [restored, setRestored] = useState(false)

  // Load saved session on mount (client-only)
  useEffect(() => {
    const saved = loadFromStorage()
    setElements(saved)
    setRestored(true)
  }, [])

  const applyUpdate = useCallback((incoming: ExcalidrawElement[]) => {
    setElements(incoming)
    saveToStorage(incoming)
  }, [])

  const clearDiagram = useCallback(() => {
    setElements([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { elements, applyUpdate, clearDiagram, restored }
}
