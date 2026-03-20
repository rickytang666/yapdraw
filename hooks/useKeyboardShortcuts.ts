import { useEffect, useLayoutEffect, useRef } from 'react'

export interface ShortcutMap {
  [combo: string]: () => void
}

/**
 * Registers keyboard shortcuts.
 *
 * Combo format:
 *   'mod+k'   — Ctrl or Meta + K
 *   'mod+s'   — Ctrl or Meta + S
 *   'escape'  — Escape key
 *   '/'       — slash key
 *
 * Combos are case-insensitive on the key portion.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  // Keep a ref to always hold the latest shortcuts map without re-registering the listener
  const shortcutsRef = useRef<ShortcutMap>(shortcuts)
  useLayoutEffect(() => {
    shortcutsRef.current = shortcuts
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      for (const combo of Object.keys(shortcutsRef.current)) {
        const parts = combo.toLowerCase().split('+')
        const needsMod = parts.includes('mod')
        const needsShift = parts.includes('shift')
        const comboKey = parts[parts.length - 1]

        if (needsMod !== isMod) continue
        // distinguish mod+h from mod+shift+h — only enforce shift check for mod combos
        if (needsMod && needsShift !== e.shiftKey) continue
        if (key !== comboKey) continue

        // Don't fire shortcuts when user is typing in an input/textarea
        const target = e.target as HTMLElement
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable

        // Allow mod+key shortcuts even in inputs (e.g. mod+s, mod+k)
        if (isTyping && !needsMod) continue

        e.preventDefault()
        shortcutsRef.current[combo]()
        break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // register once, use ref for latest shortcuts
}
