'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { IconX, IconPlus } from '@tabler/icons-react'

interface Props {
  tags: string[]
  allTags: string[]
  onSave: (tags: string[]) => void
  onClose: () => void
}

export default function TagManager({ tags, allTags, onSave, onClose }: Props) {
  const [localTags, setLocalTags] = useState<string[]>([...tags])
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const suggestions = allTags.filter(
    t =>
      t.toLowerCase().includes(inputValue.toLowerCase()) &&
      !localTags.includes(t) &&
      inputValue.trim().length > 0
  )

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || localTags.includes(trimmed)) return
    setLocalTags(prev => [...prev, trimmed])
    setInputValue('')
    setShowSuggestions(false)
  }

  function removeTag(tag: string) {
    setLocalTags(prev => prev.filter(t => t !== tag))
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && localTags.length > 0) {
      removeTag(localTags[localTags.length - 1])
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 mt-1 w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
        <div className="p-3 flex flex-col gap-3">
          {/* Current tags */}
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {localTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-200 text-xs"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <IconX size={10} />
                </button>
              </span>
            ))}
            {localTags.length === 0 && (
              <span className="text-zinc-500 text-xs italic">No tags yet</span>
            )}
          </div>

          {/* Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-600 rounded-md px-2 py-1.5 focus-within:border-zinc-400 transition-colors">
              <IconPlus size={12} className="text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none flex-1 min-w-0"
                placeholder="Add tag…"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value)
                  setShowSuggestions(true)
                }}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg overflow-hidden z-10">
                {suggestions.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onMouseDown={() => addTag(s)}
                    className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-700">
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(localTags); onClose() }}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
