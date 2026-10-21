import { BottomSheet } from '@expo/ui/community/bottom-sheet'
import { Mic, Square } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { isExecutingTurn } from '../../core/agent'
import { useVoiceInput } from '../../core/voice/useVoiceInput'
import { AGENT_SHEET_SNAP_POINTS, useAgentSession } from './AgentProvider'
import { AgentStatusStrip } from './AgentStatusStrip'
import { ProcessDrawer } from './ProcessDrawer'
import { ResultCanvas } from './ResultCanvas'

const SNAP_CYCLE = [
  AGENT_SHEET_SNAP_POINTS.voice,
  AGENT_SHEET_SNAP_POINTS.task,
  AGENT_SHEET_SNAP_POINTS.full,
] as const

function nextSnapPoint(current: (typeof SNAP_CYCLE)[number]): (typeof SNAP_CYCLE)[number] {
  const index = SNAP_CYCLE.indexOf(current)
  const safeIndex = index === -1 ? 0 : index
  return SNAP_CYCLE[(safeIndex + 1) % SNAP_CYCLE.length] ?? AGENT_SHEET_SNAP_POINTS.voice
}

export function AgentBottomSheet() {
  const {
    turn,
    sheetOpen,
    snapPoint,
    result,
    structuredOutputError,
    closeAgent,
    setSnapPoint,
    submit,
    cancelTurn,
    dismissResult,
    genericError,
  } = useAgentSession()
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState<string | undefined>(undefined)
  const typedPrefixRef = useRef('')
  const handleTranscript = useCallback(
    (transcript: string) =>
      setInput(
        typedPrefixRef.current.length > 0
          ? `${typedPrefixRef.current} ${transcript}`.trim()
          : transcript,
      ),
    [],
  )
  const voice = useVoiceInput({ onTranscript: handleTranscript })
  const running = isExecutingTurn(turn)

  useEffect(() => {
    if (!sheetOpen && voice.status === 'listening') voice.stop()
  }, [sheetOpen, voice.status, voice.stop])

  if (!sheetOpen) return null

  function runTurn() {
    const text = input.trim()
    setInputError(text.length > 0 ? undefined : 'Say or type a request first.')
    if (text.length === 0 || running) return

    voice.stop()
    void submit(text)
      .then((accepted) => {
        if (accepted) setInput('')
      })
      .catch((error: unknown) => {
        setInputError(error instanceof Error ? error.message : 'Agent turn failed.')
      })
  }

  return (
    <BottomSheet
      snapPoints={[`${snapPoint}%`]}
      enablePanDownToClose
      onClose={closeAgent}
      backgroundStyle={{ backgroundColor: '#ffffff' }}
    >
      <View testID="agent-bottom-sheet" className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-3"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">Voice agent</Text>
            <View className="flex-row gap-2">
              {running ? (
                <Pressable
                  testID="agent-cancel"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel agent turn"
                  className="rounded-full bg-danger/10 px-3 py-2"
                  onPress={cancelTurn}
                >
                  <Text className="text-xs font-medium text-danger">Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change agent panel height to ${nextSnapPoint(snapPoint)} percent`}
                className="rounded-full bg-line px-3 py-2"
                onPress={() => setSnapPoint(nextSnapPoint(snapPoint))}
              >
                <Text className="text-xs font-medium text-ink">{snapPoint}%</Text>
              </Pressable>
            </View>
          </View>

          <AgentStatusStrip turn={turn} />

          <View className="gap-2">
            <TextInput
              className="min-h-12 rounded-2xl border border-line bg-canvas py-3 pl-12 pr-4 text-base text-ink"
              value={input}
              onChangeText={setInput}
              placeholder={voice.status === 'listening' ? 'Listening…' : 'Speak or type a request'}
              placeholderTextColor="#69746f"
              multiline
              editable={!running}
            />
            {voice.error ? <Text className="text-xs text-danger">{voice.error}</Text> : null}
            {inputError ? <Text className="text-xs text-danger">{inputError}</Text> : null}
            {genericError ? <Text className="text-xs text-danger">{genericError}</Text> : null}
            <Pressable
              testID="agent-voice-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                voice.status === 'listening' ? 'Stop voice input' : 'Start voice input'
              }
              className="absolute left-4 top-4 h-8 w-8 items-center justify-center rounded-full bg-surface"
              onPress={() => {
                if (voice.status === 'listening') {
                  voice.stop()
                  return
                }
                typedPrefixRef.current = input.trim()
                void voice.start()
              }}
            >
              {voice.status === 'listening' ? (
                <Square size={15} color="#bd4535" />
              ) : (
                <Mic size={16} color="#4f7c5b" />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Run agent turn"
              accessibilityState={{ disabled: running }}
              disabled={running}
              className={`self-end rounded-full px-5 py-3 ${running ? 'bg-line' : 'bg-accent'}`}
              onPress={runTurn}
            >
              <Text className={`text-sm font-medium ${running ? 'text-muted' : 'text-white'}`}>
                {running ? 'Running…' : 'Run'}
              </Text>
            </Pressable>
          </View>

          {structuredOutputError ? (
            <View className="rounded-3xl bg-danger/10 p-4">
              <Text className="text-sm font-medium text-danger">Structured output failed</Text>
              <Text className="mt-1 text-xs text-ink">{structuredOutputError}</Text>
            </View>
          ) : null}

          {result ? (
            <ResultCanvas
              result={result}
              onConfirm={() =>
                void submit(
                  result.result.kind === 'action-request' ? result.result.confirmLabel : 'Confirm',
                ).catch((error: unknown) => {
                  setInputError(
                    error instanceof Error ? error.message : 'Agent confirmation failed.',
                  )
                })
              }
              onCancel={() => {
                dismissResult()
                closeAgent()
              }}
            />
          ) : null}
          <ProcessDrawer steps={turn.steps} />
        </ScrollView>
      </View>
    </BottomSheet>
  )
}
