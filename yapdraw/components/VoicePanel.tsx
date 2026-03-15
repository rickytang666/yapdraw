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
    <div className="flex flex-col h-full bg-white text-[#0F172A]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <h1 className="text-lg font-semibold tracking-tight text-[#0F172A]">YapDraw</h1>
        <p className="text-[#64748B] text-xs mt-0.5">Describe your diagram</p>
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
        <span className="text-[#64748B] text-xs">
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
        <div className="px-4 py-2 border-t border-[#E5E7EB] flex gap-2">
          <input
            className="flex-1 text-sm bg-[#F1F5F9] border border-[#D1D5DB] rounded-lg px-3 py-2 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#5B57D1]"
            placeholder="Type to test without mic..."
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitMock() }}
          />
          <button
            onClick={submitMock}
            className="text-sm px-3 py-2 bg-[#5B57D1] text-white rounded-lg hover:bg-[#4F4BC4]"
          >
            Go
          </button>
        </div>
      )}
    </div>
  )
}
