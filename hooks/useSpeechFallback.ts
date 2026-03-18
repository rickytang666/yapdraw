// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useSpeechFallback(_onSilence: (transcript: string) => void) {
  return {
    isListening: false,
    interimTranscript: '',
    finalTranscript: '',
    start: () => {},
    stop: () => {},
  }
}
