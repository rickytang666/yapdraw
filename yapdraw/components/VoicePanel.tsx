'use client'

import { useState } from 'react'
import MicButton from './MicButton'
import TranscriptDisplay from './TranscriptDisplay'
import InterimIndicator from './InterimIndicator'
import ChangeHistoryEntry from './editor/ChangeHistoryEntry'
import { useDeepgram } from '@/hooks/useDeepgram'
import type { AIChangeEntry } from '@/hooks/useAIChangeHistory'

interface VoicePanelProps {
  isLoading: boolean
  onSilence: (transcript: string) => void
  onMockSubmit?: (text: string) => void
  changeHistory?: AIChangeEntry[]
  onRestoreChange?: (versionId: string) => void
}

export default function VoicePanel({
  isLoading,
  onSilence,
  onMockSubmit,
  changeHistory = [],
  onRestoreChange,
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

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 pt-8 pb-4">
        <MicButton isListening={isListening} onClick={handleToggle} />
        <span className="text-zinc-500 text-xs">
          {isListening ? 'Listening — pause to generate' : isLoading ? 'Drawing...' : 'Click to start'}
        </span>
      </div>

      {/* Scrollable area: change history + transcript */}
      <div className="flex-1 overflow-y-auto">
        {/* AI change history */}
        {changeHistory.length > 0 && (
          <div className="px-4 pt-2 pb-3 flex flex-col gap-2 border-b border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
              Change history — click to restore
            </p>
            {changeHistory.map(entry => (
              <ChangeHistoryEntry
                key={entry.versionId}
                prompt={entry.prompt}
                summary={entry.summary}
                savedAt={entry.savedAt}
                onRestore={() => onRestoreChange?.(entry.versionId)}
              />
            ))}
          </div>
        )}

        {/* Transcript */}
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
