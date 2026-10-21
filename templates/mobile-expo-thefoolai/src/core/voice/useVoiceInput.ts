import { useCallback, useState } from 'react'
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

function transcriptFromResults(results: readonly { transcript: string }[]): string {
  return results
    .map((result) => result.transcript.trim())
    .filter(Boolean)
    .join(' ')
}

export function useVoiceInput(): VoiceInputState & {
  start(): Promise<void>
  stop(): void
} {
  const [state, setState] = useState<VoiceInputState>({
    status: VOICE_INPUT_STATUSES.idle,
    transcript: '',
    error: undefined,
  })

  useSpeechRecognitionEvent('result', (event) => {
    setState((current) => ({
      ...current,
      status: event.isFinal ? VOICE_INPUT_STATUSES.idle : VOICE_INPUT_STATUSES.listening,
      transcript: transcriptFromResults(event.results),
    }))
  })

  useSpeechRecognitionEvent('error', (event) => {
    setState((current) => ({
      ...current,
      status:
        event.error === 'not-allowed' ? VOICE_INPUT_STATUSES.denied : VOICE_INPUT_STATUSES.failed,
      error: event.error,
    }))
  })

  useSpeechRecognitionEvent('start', () => {
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.listening }))
  })

  useSpeechRecognitionEvent('nomatch', () => {
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  })

  const start = useCallback(async () => {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!permission.granted) {
      setState((current) => ({
        ...current,
        status: VOICE_INPUT_STATUSES.denied,
        error: 'Speech recognition permission was not granted.',
      }))
      return
    }

    setState((current) => ({
      ...current,
      status: VOICE_INPUT_STATUSES.listening,
      transcript: '',
      ...(current.error ? { error: undefined } : {}),
    }))
    ExpoSpeechRecognitionModule.start({
      lang: 'zh-CN',
      interimResults: true,
      continuous: false,
      addsPunctuation: true,
    })
  }, [])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  }, [])

  return { ...state, start, stop }
}
