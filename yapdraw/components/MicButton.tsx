'use client'

import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react'

interface MicButtonProps {
  isListening: boolean
  onStart: () => void
  onStop: () => void
}

export default function MicButton({ isListening, onStart, onStop }: MicButtonProps) {
  return (
    <button
      onClick={isListening ? onStop : onStart}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        isListening
          ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200'
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
    >
      {isListening
        ? <IconMicrophoneOff size={24} color="white" />
        : <IconMicrophone size={24} color="white" />
      }
    </button>
  )
}
