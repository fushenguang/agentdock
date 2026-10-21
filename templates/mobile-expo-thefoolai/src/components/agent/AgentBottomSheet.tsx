import { BottomSheet } from '@expo/ui/community/bottom-sheet'
import { Mic, Square } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { isActiveTurn } from '../../core/agent'
import { useAgentSession } from './AgentProvider'
import { AgentStatusStrip } from './AgentStatusStrip'
import { ProcessDrawer } from './ProcessDrawer'
import { ResultCanvas } from './ResultCanvas'
import { useVoiceInput } from '../../core/voice/useVoiceInput'

const SNAP_CYCLE = [25, 50, 90] as const
type SheetSnapPoint = (typeof SNAP_CYCLE)[number]

function nextSnapPoint(current: number): SheetSnapPoint {
  const currentPoint = current as SheetSnapPoint
  const index = SNAP_CYCLE.indexOf(currentPoint)
  const safeIndex = index === -1 ? 0 : index
  const next = SNAP_CYCLE[(safeIndex + 1) % SNAP_CYCLE.length]
  return next ?? 25
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
  } = useAgentSession()
  const [input, setInput] = useState('')
  const voice = useVoiceInput()
  const effectiveInput = input || voice.transcript
  if (!sheetOpen) return null

  return (
    <BottomSheet
      snapPoints={[`${snapPoint}%`]}
      enablePanDownToClose
      onClose={closeAgent}
      backgroundStyle={{ backgroundColor: '#ffffff' }}
    >
      <View testID="agent-bottom-sheet" className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-10 pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">Voice agent</Text>
            <View className="flex-row gap-2">
              {isActiveTurn(turn) ? (
                <Pressable
                  testID="agent-cancel"
                  className="rounded-full bg-danger/10 px-3 py-2"
                  onPress={cancelTurn}
                >
                  <Text className="text-xs font-medium text-danger">Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
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
              value={effectiveInput}
              onChangeText={setInput}
              placeholder={voice.status === 'listening' ? 'Listening…' : 'Speak or type a request'}
              placeholderTextColor="#69746f"
              multiline
            />
            {voice.error ? <Text className="text-xs text-danger">{voice.error}</Text> : null}
            <Pressable
              testID="agent-voice-toggle"
              accessibilityLabel={
                voice.status === 'listening' ? 'Stop voice input' : 'Start voice input'
              }
              className="absolute left-4 top-4 h-8 w-8 items-center justify-center rounded-full bg-surface"
              onPress={() => {
                if (voice.status === 'listening') {
                  voice.stop()
                  return
                }
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
              className="self-end rounded-full bg-accent px-5 py-3"
              onPress={() => {
                const text = effectiveInput.trim() || 'Summarize the current domain'
                void submit(text)
              }}
            >
              <Text className="text-sm font-medium text-white">Run</Text>
            </Pressable>
          </View>

          {structuredOutputError ? (
            <View className="rounded-3xl bg-danger/10 p-4">
              <Text className="text-sm font-medium text-danger">Structured output failed</Text>
              <Text className="mt-1 text-xs text-ink">{structuredOutputError}</Text>
            </View>
          ) : null}

          {result ? <ResultCanvas result={result} /> : null}
          <ProcessDrawer steps={turn.steps} />
        </ScrollView>
      </View>
    </BottomSheet>
  )
}
