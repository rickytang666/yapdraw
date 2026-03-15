'use client'

interface TranscriptDisplayProps {
  transcript: string
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  if (!transcript) return (
    <p className="text-[#94A3B8] text-sm px-4">Your transcript will appear here...</p>
  )
  return (
    <p className="text-[#0F172A] text-sm px-4 leading-relaxed whitespace-pre-wrap">{transcript}</p>
  )
}
