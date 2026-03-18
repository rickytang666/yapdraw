'use client'

interface InterimIndicatorProps {
  text: string
}

export default function InterimIndicator({ text }: InterimIndicatorProps) {
  if (!text) return null
  return (
    <p className="text-[#64748B] italic text-sm px-4 py-1">
      {text}
      <span className="inline-block w-1 h-3 ml-1 bg-[#5B57D1] animate-pulse align-middle" />
    </p>
  )
}
