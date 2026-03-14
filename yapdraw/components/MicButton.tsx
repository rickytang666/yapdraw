'use client'

interface MicButtonProps {
  isListening: boolean
  onClick: () => void
}

export default function MicButton({ isListening, onClick }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-colors ${
        isListening
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {/* Pulsing ring while active */}
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
      )}

      {/* Mic icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7 text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 8a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V22h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.062A8 8 0 0 1 4 12a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z" />
      </svg>
    </button>
  )
}
