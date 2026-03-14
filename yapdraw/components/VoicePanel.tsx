'use client'

import { useState } from 'react'
import MicButton from './MicButton'
import TranscriptDisplay from './TranscriptDisplay'
import InterimIndicator from './InterimIndicator'
import { useDeepgram } from '@/hooks/useDeepgram'

interface VoicePanelProps {
  onSilence?: (transcript: string) => void
  isLoading?: boolean
}

export default function VoicePanel({ onSilence, isLoading }: VoicePanelProps) {
  const [textInput, setTextInput] = useState('')

  const { isListening, interimTranscript, finalTranscript, start, stop, reset } =
    useDeepgram((transcript) => {
      onSilence?.(transcript)
    })

  const handleToggle = () => {
    if (isListening) {
      stop()
    } else {
      reset()
      start()
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim() && !isLoading) {
      onSilence?.(textInput.trim())
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight">YapDraw</h1>
        <p className="text-zinc-400 text-xs mt-0.5">
          Describe your architecture out loud
        </p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-4">
        <MicButton isListening={isListening} onClick={handleToggle} />
        <span className="text-zinc-500 text-xs">
          {isListening ? 'Listening — pause to generate' : 'Click to start'}
        </span>
      </div>

      {/* Text input for testing */}
      <form onSubmit={handleTextSubmit} className="px-4 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type here to test..."
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
          >
            {isLoading ? '...' : 'Go'}
          </button>
        </div>
      </form>

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2 px-4">
        <TranscriptDisplay transcript={finalTranscript} />
        <InterimIndicator text={interimTranscript} />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-3 border-t border-zinc-800 text-blue-400 text-xs">
          Generating diagram...
        </div>
      )}
    </div>
  )
}
