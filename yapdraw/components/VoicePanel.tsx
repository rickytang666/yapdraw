'use client'

import { useState } from 'react'
import MicButton from './MicButton'
import TranscriptDisplay from './TranscriptDisplay'
import InterimIndicator from './InterimIndicator'

interface VoicePanelProps {
  isListening: boolean
  isLoading: boolean
  transcript: string
  interimTranscript: string
  onStart: () => void
  onStop: () => void
  // Mock input — wired up until P3's speech hook is ready
  onMockSubmit?: (text: string) => void
}

export default function VoicePanel({
  isListening,
  isLoading,
  transcript,
  interimTranscript,
  onStart,
  onStop,
  onMockSubmit,
}: VoicePanelProps) {
  const [mockInput, setMockInput] = useState('')

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-100">
        <h1 className="text-lg font-semibold text-zinc-900">YapDraw</h1>
        <p className="text-xs text-zinc-400">Describe any diagram. It draws itself.</p>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        <TranscriptDisplay transcript={transcript} />
        <InterimIndicator text={interimTranscript} />
      </div>

      {/* Mock text input — remove once P3's speech is wired */}
      {onMockSubmit && (
        <div className="px-4 py-2 border-t border-zinc-100 flex gap-2">
          <input
            className="flex-1 text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="Type a description to test..."
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mockInput.trim()) {
                onMockSubmit(mockInput.trim())
                setMockInput('')
              }
            }}
          />
          <button
            onClick={() => { if (mockInput.trim()) { onMockSubmit(mockInput.trim()); setMockInput('') } }}
            className="text-sm px-3 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700"
          >
            Go
          </button>
        </div>
      )}

      {/* Mic button */}
      <div className="px-4 py-5 border-t border-zinc-100 flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          {isListening ? 'Listening...' : isLoading ? 'Drawing...' : 'Click mic to start'}
        </div>
        <MicButton isListening={isListening} onStart={onStart} onStop={onStop} />
      </div>
    </div>
  )
}
