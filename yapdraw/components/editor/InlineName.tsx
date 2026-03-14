import { useState, useEffect } from 'react'
import { db } from '@/lib/db'

interface InlineNameProps {
  id: string
  initialName: string
}

export function InlineName({ id, initialName }: InlineNameProps) {
  const [value, setValue] = useState(initialName)

  useEffect(() => {
    setValue(initialName)
  }, [initialName])

  async function handleBlur() {
    const name = value.trim() || 'Untitled Diagram'
    setValue(name)
    await db.diagrams.update(id, { name, updatedAt: Date.now() })
  }

  return (
    <input
      className="bg-transparent border-none text-sm font-medium text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 rounded px-1"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
    />
  )
}

