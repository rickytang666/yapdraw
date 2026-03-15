'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { FOLDER_COLORS, type FolderColor } from '@/types/library'

const COLOR_HEX: Record<FolderColor, string> = {
  slate:  '#94a3b8',
  red:    '#f87171',
  orange: '#fb923c',
  amber:  '#fbbf24',
  green:  '#4ade80',
  teal:   '#2dd4bf',
  blue:   '#60a5fa',
  purple: '#a78bfa',
}

interface Props {
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

  const title = parentName ? `Subfolder in "${parentName}"` : 'New Folder'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Folder name"
            className="text-sm rounded-xl px-4 py-3 outline-none transition-colors w-full"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />

          {/* Color picker — circles */}
          <div className="flex gap-2.5 items-center">
            <button
              type="button"
              onClick={() => setColor(null)}
              className="w-6 h-6 rounded-full transition-all"
              style={{
                background: 'var(--text-tertiary)',
                outline: color === null ? '2px solid var(--text-primary)' : 'none',
                outlineOffset: '2px',
                transform: color === null ? 'scale(1.15)' : 'scale(1)',
              }}
            />
            {FOLDER_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-all"
                style={{
                  background: COLOR_HEX[c],
                  outline: color === c ? `2px solid ${COLOR_HEX[c]}` : 'none',
                  outlineOffset: '2px',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
