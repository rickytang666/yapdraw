'use client'

import { useEffect, useRef, useState } from 'react'
import { IconFolder, IconX } from '@tabler/icons-react'
import { FOLDER_COLORS, type FolderColor } from '@/types/library'

const COLOR_MAP: Record<FolderColor, { bg: string; ring: string; swatch: string }> = {
  slate:  { bg: 'bg-slate-500/20',  ring: 'ring-slate-500',  swatch: 'bg-slate-500' },
  red:    { bg: 'bg-red-500/20',    ring: 'ring-red-500',    swatch: 'bg-red-500' },
  orange: { bg: 'bg-orange-500/20', ring: 'ring-orange-500', swatch: 'bg-orange-500' },
  amber:  { bg: 'bg-amber-500/20',  ring: 'ring-amber-500',  swatch: 'bg-amber-500' },
  green:  { bg: 'bg-green-500/20',  ring: 'ring-green-500',  swatch: 'bg-green-500' },
  teal:   { bg: 'bg-teal-500/20',   ring: 'ring-teal-500',   swatch: 'bg-teal-500' },
  blue:   { bg: 'bg-blue-500/20',   ring: 'ring-blue-500',   swatch: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/20', ring: 'ring-purple-500', swatch: 'bg-purple-500' },
}

interface Props {
  /** When set, the modal title says "New Subfolder in …" */
  parentName?: string
  onConfirm: (name: string, color: FolderColor | null) => void
  onCancel: () => void
}

export default function NewFolderModal({ parentName, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState<FolderColor | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onConfirm(name.trim(), color)
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  const title = parentName ? `New Subfolder in "${parentName}"` : 'New Folder'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-base">{title}</h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Folder preview + name */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color ? COLOR_MAP[color].bg : 'bg-zinc-800'}`}>
              <IconFolder
                size={20}
                className={color ? `text-${color}-400` : 'text-zinc-400'}
              />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 bg-zinc-800 border border-zinc-700 focus:border-blue-500 outline-none rounded-md px-3 py-2 text-white text-sm placeholder-zinc-500 transition-colors"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-sm">Color</label>
            <div className="flex gap-2 flex-wrap">
              {/* No color option */}
              <button
                type="button"
                onClick={() => setColor(null)}
                className={`w-6 h-6 rounded-full border-2 bg-zinc-700 transition-all ${
                  color === null ? 'border-white scale-110' : 'border-transparent hover:border-zinc-500'
                }`}
                title="No color"
              />
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${COLOR_MAP[c].swatch} ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-zinc-900 scale-110 ' + COLOR_MAP[c].ring
                      : 'hover:scale-105'
                  }`}
                  title={c.charAt(0).toUpperCase() + c.slice(1)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
