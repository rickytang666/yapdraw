import { useEffect, useLayoutEffect, useRef } from "react";

export interface ShortcutMap {
  [combo: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const shortcutsRef = useRef<ShortcutMap>(shortcuts);
  useLayoutEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      for (const combo of Object.keys(shortcutsRef.current)) {
        const parts = combo.toLowerCase().split("+");
        const needsMod = parts.includes("mod");
        const needsShift = parts.includes("shift");
        const comboKey = parts[parts.length - 1];

        if (needsMod !== isMod) continue;
        // shift required only when combo lists it (e.g. mod+h vs mod+shift+h)
        if (needsMod && needsShift !== e.shiftKey) continue;
        if (key !== comboKey) continue;

        const target = e.target as HTMLElement;
        const isTyping =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;

        // plain keys off while typing; mod+key still works (save, palette, …)
        if (isTyping && !needsMod) continue;

        e.preventDefault();
        shortcutsRef.current[combo]();
        break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
