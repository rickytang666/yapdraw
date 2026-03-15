'use client'

import { useState } from 'react'
import MicButton from './MicButton'
import TranscriptDisplay from './TranscriptDisplay'
import InterimIndicator from './InterimIndicator'
import VersionTimeline from './editor/VersionTimeline'
import { useDeepgram } from '@/hooks/useDeepgram'
import type { ExcalidrawCanvasHandle } from '@/components/ExcalidrawCanvas'

interface VoicePanelProps {
  diagramId: string
  isLoading: boolean
  onSilence: (transcript: string) => void
  onMockSubmit?: (text: string) => void
  canvasRef: React.RefObject<ExcalidrawCanvasHandle | null>
  onRestoreAnimation: () => void
}

export default function VoicePanel({
  diagramId,
  isLoading,
  onSilence,
  onMockSubmit,
  canvasRef,
  onRestoreAnimation,
}: VoicePanelProps) {
  const [mockInput, setMockInput] = useState('')
  const { isListening, interimTranscript, finalTranscript, start, stop, reset } =
    useDeepgram(onSilence)

  const handleToggle = () => {
    if (isListening) {
      stop()
    } else {
      reset()
      start()
    }
  }

  const submitMock = () => {
    if (!mockInput.trim()) return
    onMockSubmit?.(mockInput.trim())
    setMockInput('')
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight">YapDraw</h1>
        <p className="text-zinc-400 text-xs mt-0.5">Describe any diagram. It draws itself.</p>
      </div>

      {/* Version timeline — above the chat */}
      <VersionTimeline
        diagramId={diagramId}
        canvasRef={canvasRef}
        onRestoreAnimation={onRestoreAnimation}
      />

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-4">
        <MicButton isListening={isListening} onClick={handleToggle} />
        <span className="text-zinc-500 text-xs">
          {isListening ? 'Listening — pause to generate' : isLoading ? 'Drawing...' : 'Click to start'}
        </span>
      </div>

      {/* Scrollable area: transcript */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4 space-y-2 px-4">
          <TranscriptDisplay transcript={finalTranscript} />
          <InterimIndicator text={interimTranscript} />
        </div>
      </div>

      {/* Mock text input */}
      {onMockSubmit && (
        <div className="px-4 py-2 border-t border-zinc-800 flex gap-2">
          <input
            className="flex-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            placeholder="Type to test without mic..."
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitMock() }}
          />
          <button
            onClick={submitMock}
            className="text-sm px-3 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
          >
            Go
          </button>
        </div>
      )}
    </div>
  )
}
