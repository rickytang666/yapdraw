export function useSpeechFallback(onSilence: (transcript: string) => void) {
  return {
    isListening: false,
    interimTranscript: '',
    finalTranscript: '',
    start: () => {},
    stop: () => {},
  }
}
