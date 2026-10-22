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

const ERROR_MESSAGES: Record<'en-US' | 'zh-CN', Record<string, string>> = {
  'en-US': {
    'not-allowed': 'Microphone or speech recognition permission was not granted.',
    'service-not-allowed': 'Speech recognition is not allowed on this device.',
    'no-speech': 'No speech was detected. Please try again.',
    network: 'Speech recognition is unavailable because the network failed.',
    'audio-capture': 'No microphone is available on this device.',
    unknown: 'Voice input failed. Please try again.',
    nomatch: 'No matching speech was recognized. Please try again.',
    developmentBuild:
      'Voice input requires an app development build. Text input remains available.',
    startFailed: 'Voice input failed to start.',
  },
  'zh-CN': {
    'not-allowed': '未获得麦克风或语音识别权限。',
    'service-not-allowed': '此设备不允许使用语音识别。',
    'no-speech': '没有检测到语音，请重试。',
    network: '网络不可用，暂时无法进行语音识别。',
    'audio-capture': '此设备没有可用麦克风。',
    unknown: '语音输入失败，请重试。',
    nomatch: '没有识别到匹配语音，请重试。',
    developmentBuild: '语音输入需要 app development build；仍可使用文本输入。',
    startFailed: '语音输入启动失败。',
  },
}

function voiceMessages(lang: string): Record<string, string> {
  return ERROR_MESSAGES[lang === 'en-US' ? 'en-US' : 'zh-CN']
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
  return results[0]?.transcript.trim() ?? ''
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
  const startAttemptRef = useRef(0)
  const mountedRef = useRef(true)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    if (!speechModule?.addListener) return undefined
    const messages = voiceMessages(lang)

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

        const message = messages[errorCode] ?? messages.unknown
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
          error: messages.nomatch,
        }))
      }),
    ]

    return () => subscriptions.forEach((subscription) => subscription.remove())
  }, [lang])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      startingRef.current = false
      startAttemptRef.current += 1
      speechModule?.abort()
    }
  }, [])

  const start = useCallback(async () => {
    if (startingRef.current || state.status === VOICE_INPUT_STATUSES.listening) return
    startingRef.current = true
    const startAttempt = ++startAttemptRef.current
    const messages = voiceMessages(lang)

    try {
      if (!speechModule?.addListener) {
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.failed,
          error: messages.developmentBuild,
        }))
        return
      }

      const permission = await speechModule.requestPermissionsAsync()
      if (!mountedRef.current || startAttemptRef.current !== startAttempt) return
      if (!permission.granted) {
        setState((current) => ({
          ...current,
          status: VOICE_INPUT_STATUSES.denied,
          error: messages['not-allowed'],
        }))
        return
      }

      speechModule.start({
        lang,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      })
      if (!mountedRef.current || startAttemptRef.current !== startAttempt) return
      setState((current) => ({
        ...current,
        status: VOICE_INPUT_STATUSES.listening,
        transcript: '',
        error: undefined,
      }))
    } catch (error) {
      if (!mountedRef.current || startAttemptRef.current !== startAttempt) return
      setState((current) => ({
        ...current,
        status: VOICE_INPUT_STATUSES.failed,
        error: error instanceof Error ? error.message : messages.startFailed,
      }))
    } finally {
      if (startAttemptRef.current === startAttempt) startingRef.current = false
    }
  }, [lang, state.status])

  const stop = useCallback(() => {
    startAttemptRef.current += 1
    startingRef.current = false
    speechModule?.stop()
    setState((current) => ({ ...current, status: VOICE_INPUT_STATUSES.idle }))
  }, [])

  return { ...state, start, stop }
}
