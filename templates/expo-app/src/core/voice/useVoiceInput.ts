import { useCallback, useEffect, useRef, useState } from 'react'
import { requireOptionalNativeModule } from 'expo'

interface SpeechSubscription {
  remove(): void
}

interface SpeechRecognitionModule {
  readonly requestPermissionsAsync: () => Promise<{ readonly granted: boolean }>
  readonly start: (options: {
    readonly lang: string
    readonly interimResults: boolean
    readonly continuous: boolean
    readonly addsPunctuation: boolean
  }) => void
  readonly stop: () => void
  readonly abort: () => void
  readonly addListener: (
    eventName: string,
    listener: (event: Record<string, unknown>) => void,
  ) => SpeechSubscription
}

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

function loadSpeechModule(): SpeechRecognitionModule | undefined {
  try {
    return (
      requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition') ?? undefined
    )
  } catch (error) {
    if (__DEV__) console.warn('Failed to load ExpoSpeechRecognition module', error)
    return undefined
  }
}

const speechModule = loadSpeechModule()

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
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (!speechModule?.addListener) return undefined

    const subscriptions = [
      speechModule.addListener('result', (event) => {
        if (!mountedRef.current) return
        const results = Array.isArray(event.results)
          ? (event.results as { transcript?: unknown }[])
              .map((result) =>
                typeof result.transcript === 'string' ? { transcript: result.transcript } : null,
              )
              .filter((result): result is { transcript: string } => result !== null)
          : []
        const transcript = transcriptFromResults(results)
        setState((current) => ({
          ...current,
          status:
            event.isFinal === true ? VOICE_INPUT_STATUSES.idle : VOICE_INPUT_STATUSES.listening,
          transcript,
          error: undefined,
        }))
        if (transcript.length > 0) onTranscriptRef.current?.(transcript)
      }),
      speechModule.addListener('error', (event) => {
        if (!mountedRef.current) return
        const errorCode = typeof event.error === 'string' ? event.error : 'unknown'
        if (errorCode === 'aborted') {
          setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
          return
        }

        const message = ERROR_MESSAGES[errorCode] ?? 'Voice input failed. Please try again.'
        setState((current) => ({
          ...current,
          status:
            errorCode === 'not-allowed' || errorCode === 'service-not-allowed'
              ? VOICE_INPUT_STATUSES.denied
              : VOICE_INPUT_STATUSES.failed,
          transcript: '',
          error: message,
        }))
      }),
      speechModule.addListener('start', () => {
        if (!mountedRef.current) return
        setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.listening }))
      }),
      speechModule.addListener('end', () => {
        if (!mountedRef.current) return
        setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
      }),
      speechModule.addListener('nomatch', () => {
        if (!mountedRef.current) return
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.idle,
          transcript: '',
          error: 'No matching speech was recognized. Please try again.',
        }))
      }),
    ]

    return () => subscriptions.forEach((subscription) => subscription.remove())
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      startingRef.current = false
      speechModule?.abort()
    }
  }, [])

  const start = useCallback(async () => {
    if (startingRef.current || state.status === VOICE_INPUT_STATUSES.listening) return
    startingRef.current = true

    try {
      if (!speechModule?.addListener) {
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.failed,
          error: 'Voice input requires an app development build. Text input remains available.',
        }))
        return
      }

      const permission = await speechModule.requestPermissionsAsync()
      if (!mountedRef.current) return
      if (!permission.granted) {
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.denied,
          error: 'Microphone or speech recognition permission was not granted.',
        }))
        return
      }

      speechModule.start({
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
    speechModule?.stop()
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  }, [])

  return { ...state, start, stop }
}
