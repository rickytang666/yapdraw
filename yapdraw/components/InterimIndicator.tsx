'use client'

interface InterimIndicatorProps {
  text: string
}

export default function InterimIndicator({ text }: InterimIndicatorProps) {
  if (!text) return null
  return (
    <p className="text-sm italic text-zinc-400 px-4">{text}</p>
  )
}
