'use client'

interface TranscriptDisplayProps {
  transcript: string
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  if (!transcript) return (
    <p className="text-zinc-500 text-sm px-4">Your transcript will appear here...</p>
  )
  return (
    <p className="text-zinc-100 text-sm px-4 leading-relaxed whitespace-pre-wrap">{transcript}</p>
  )
}
