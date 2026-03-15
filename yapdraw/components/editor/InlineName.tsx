'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onCommit: (value: string) => void
}

export default function InlineName({ value, onCommit }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    const trimmed = draft.trim() || 'Untitled Diagram'
    setDraft(trimmed)
    if (trimmed !== value) onCommit(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="bg-[#FAFAFA] text-[#0F172A] text-sm font-medium px-2 py-0.5 rounded border border-[#D1D5DB] focus:outline-none focus:border-[#5B57D1] w-48"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <button
      className="text-sm font-medium text-[#0F172A] hover:text-[#64748B] truncate max-w-48"
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      {value}
    </button>
  )
}
