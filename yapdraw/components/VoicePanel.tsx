'use client'

import MicButton from './MicButton'
import TranscriptDisplay from './TranscriptDisplay'
import InterimIndicator from './InterimIndicator'
import { useDeepgram } from '@/hooks/useDeepgram'

interface VoicePanelProps {
  onSilence?: (transcript: string) => void
}

export default function VoicePanel({ onSilence }: VoicePanelProps) {
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

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        <TranscriptDisplay transcript={finalTranscript} />
        <InterimIndicator text={interimTranscript} />
      </div>

      {/* Status footer */}
      {onSilence === undefined && finalTranscript && (
        <div className="px-4 py-3 border-t border-zinc-800 text-zinc-500 text-xs">
          Silence detected — diagram generation not wired yet
        </div>
      )}
    </div>
  )
}
