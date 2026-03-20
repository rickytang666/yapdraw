"use client";

import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from "react";

export interface EditorMenuHandle {
  toggle: () => void
}
import {
  IconDotsVertical,
  IconFileExport,
  IconFileCode,
  IconCopy,
  IconLock,
  IconLockOpen,
  IconPhoto,
  IconFileTypeSvg,
  IconBraces,
  IconCheck,
} from "@tabler/icons-react";
import { exportAsExcalidraw, exportAsJSON } from "@/lib/export";
import { graphToMermaid } from "@/lib/mermaid";
import type { Diagram } from "@/types/library";
import type { ExcalidrawCanvasHandle } from "@/components/ExcalidrawCanvas";

interface Props {
  diagram: Diagram;
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>;
  onDuplicate: () => void;
  onToggleLock: () => void;
}

const EditorMenu = forwardRef<EditorMenuHandle, Props>(function EditorMenu({
  diagram,
  canvasRef,
  onDuplicate,
  onToggleLock,
}, ref) {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({ toggle: () => setIsOpen(v => !v) }));
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function handleExportExcalidraw() {
    setIsOpen(false);
    exportAsExcalidraw(diagram);
  }

  function handleExportJSON() {
    setIsOpen(false);
    exportAsJSON(diagram);
  }

  function handleExportPng() {
    setIsOpen(false);
    canvasRef.current?.exportPng(diagram.name);
  }

  function handleExportSvg() {
    setIsOpen(false);
    canvasRef.current?.exportSvg(diagram.name);
  }

  function handleCopyMermaid() {
    if (!diagram.graph) return;
    navigator.clipboard.writeText(graphToMermaid(diagram.graph));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDuplicate() {
    setIsOpen(false);
    onDuplicate();
  }

  function handleToggleLock() {
    setIsOpen(false);
    onToggleLock();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        className="p-1.5 text-subtle hover:text-foreground hover:bg-surface rounded transition-colors"
        aria-label="More options"
        aria-expanded={isOpen}
      >
        <IconDotsVertical size={16} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-52 bg-white border border-border-subtle rounded-lg shadow-xl overflow-hidden py-1 z-50"
        >
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleExportExcalidraw}
          >
            <IconFileExport size={14} className="shrink-0" />
            Export as .excalidraw
          </button>

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleExportJSON}
          >
            <IconFileCode size={14} className="shrink-0" />
            Export as JSON
          </button>

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleExportPng}
          >
            <IconPhoto size={14} className="shrink-0" />
            Export as PNG
          </button>

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleExportSvg}
          >
            <IconFileTypeSvg size={14} className="shrink-0" />
            Export as SVG
          </button>

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCopyMermaid}
            disabled={!diagram.graph}
          >
            {copied ? (
              <IconCheck size={14} className="shrink-0 text-success" />
            ) : (
              <IconBraces size={14} className="shrink-0" />
            )}
            {copied ? "Copied!" : "Copy as Mermaid"}
          </button>

          <div className="my-1 border-t border-border-subtle" />

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleDuplicate}
          >
            <IconCopy size={14} className="shrink-0" />
            Duplicate
          </button>

          <div className="my-1 border-t border-border-subtle" />

          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors text-left"
            onClick={handleToggleLock}
          >
            {diagram.locked ? (
              <>
                <IconLockOpen size={14} className="shrink-0 text-warning" />
                <span>Unlock Diagram</span>
              </>
            ) : (
              <>
                <IconLock size={14} className="shrink-0" />
                <span>Lock Diagram</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
})

export default EditorMenu
