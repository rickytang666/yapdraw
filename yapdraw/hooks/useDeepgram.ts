export function useDeepgram(onSilence: (transcript: string) => void) {
  return {
    isListening: false,
    interimTranscript: '',
    finalTranscript: '',
    start: () => {},
    stop: () => {},
  }
}
