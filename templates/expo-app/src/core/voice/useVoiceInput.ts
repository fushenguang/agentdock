import { useCallback, useEffect, useRef, useState } from 'react'
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition'

export const VOICE_INPUT_STATUSES = {
  idle: 'idle',
  listening: 'listening',
  denied: 'denied',
  failed: 'failed',
} as const

export type VoiceInputStatus = (typeof VOICE_INPUT_STATUSES)[keyof typeof VOICE_INPUT_STATUSES]

export interface VoiceInputState {
  readonly status: VoiceInputStatus
  readonly transcript: string
  readonly error: string | undefined
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone or speech recognition permission was not granted.',
  'service-not-allowed': 'Speech recognition is not allowed on this device.',
  'no-speech': 'No speech was detected. Please try again.',
  network: 'Speech recognition is unavailable because the network failed.',
  'audio-capture': 'No microphone is available on this device.',
}

function transcriptFromResults(results: readonly { transcript: string }[]): string {
  return results
    .map((result) => result.transcript.trim())
    .filter(Boolean)
    .join(' ')
}

export function useVoiceInput({
  lang = 'zh-CN',
  onTranscript,
}: {
  readonly lang?: string
  readonly onTranscript?: (transcript: string) => void
} = {}): VoiceInputState & {
  start(): Promise<void>
  stop(): void
} {
  const [state, setState] = useState<VoiceInputState>({
    status: VOICE_INPUT_STATUSES.idle,
    transcript: '',
    error: undefined,
  })
  const startingRef = useRef(false)
  const mountedRef = useRef(true)

  useSpeechRecognitionEvent('result', (event) => {
    if (!mountedRef.current) return
    const transcript = transcriptFromResults(event.results)
    setState((current) => ({
      ...current,
      status: event.isFinal ? VOICE_INPUT_STATUSES.idle : VOICE_INPUT_STATUSES.listening,
      transcript,
    }))
    if (transcript.length > 0) onTranscript?.(transcript)
  })

  useSpeechRecognitionEvent('error', (event) => {
    if (!mountedRef.current) return
    if (event.error === 'aborted') {
      setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
      return
    }

    const message = ERROR_MESSAGES[event.error] ?? 'Voice input failed. Please try again.'
    setState((current) => ({
      ...current,
      status:
        event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? VOICE_INPUT_STATUSES.denied
          : VOICE_INPUT_STATUSES.failed,
      transcript: '',
      error: message,
    }))
  })

  useSpeechRecognitionEvent('start', () => {
    if (!mountedRef.current) return
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.listening }))
  })

  useSpeechRecognitionEvent('end', () => {
    if (!mountedRef.current) return
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  })

  useSpeechRecognitionEvent('nomatch', () => {
    if (!mountedRef.current) return
    setState((current) => ({
      ...current,
      status: VOICE_INPUT_STATUSES.idle,
      error: 'No matching speech was recognized. Please try again.',
    }))
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      startingRef.current = false
      ExpoSpeechRecognitionModule.abort()
    }
  }, [])

  const start = useCallback(async () => {
    if (startingRef.current || state.status === VOICE_INPUT_STATUSES.listening) return
    startingRef.current = true

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!mountedRef.current) return
      if (!permission.granted) {
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.denied,
          error: 'Microphone or speech recognition permission was not granted.',
        }))
        return
      }

      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      })
      if (!mountedRef.current) return
      setState((current) => ({
        ...current,
        status: VOICE_INPUT_STATUSES.listening,
        transcript: '',
        error: undefined,
      }))
    } catch (error) {
      if (!mountedRef.current) return
      setState((current) => ({
        ...current,
        status: VOICE_INPUT_STATUSES.failed,
        error: error instanceof Error ? error.message : 'Voice input failed to start.',
      }))
    } finally {
      startingRef.current = false
    }
  }, [lang, state.status])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  }, [])

  return { ...state, start, stop }
}
