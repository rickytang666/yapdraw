'use client'

import { useEffect, useRef, useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import type { Folder } from '@/types/library'

interface Props {
  folder: Pick<Folder, 'id' | 'name'>
  onConfirm: (name: string) => void | Promise<void>
  onCancel: () => void
}

export default function RenameFolderModal({ folder, onConfirm, onCancel }: Props) {
  const [name, setName] = useState(folder.name)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = name.trim()
    if (!next || next === folder.name) {
      onCancel()
      return
    }

    setIsSaving(true)
    try {
      await onConfirm(next)
    } finally {
      setIsSaving(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

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
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Rename Folder</h2>
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

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              {isSaving ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
