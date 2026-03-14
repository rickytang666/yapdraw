'use client'

interface TranscriptDisplayProps {
  transcript: string
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  if (!transcript) return (
    <p className="text-sm text-zinc-400 px-4">Start speaking to build your diagram...</p>
  )
  return (
    <p className="text-sm text-zinc-700 px-4 whitespace-pre-wrap">{transcript}</p>
  )
}
