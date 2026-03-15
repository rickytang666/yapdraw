'use client'

import { IconMicrophone } from '@tabler/icons-react'

interface MicButtonProps {
  isListening: boolean
  onClick: () => void
}

export default function MicButton({ isListening, onClick }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-colors ${
        isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-[#5B57D1] hover:bg-[#4F4BC4]'
      }`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
      )}
      <IconMicrophone size={26} color="white" />
    </button>
  )
}
