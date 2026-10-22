import { BottomSheet } from '@expo/ui/community/bottom-sheet'
import { Mic, Square } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { isExecutingTurn } from '../../core/agent'
import { useVoiceInput } from '../../core/voice/useVoiceInput'
import { useLanguage } from '../settings/LanguageProvider'
import { AGENT_SHEET_HEIGHT_PERCENT, useAgentSession } from './AgentProvider'
import { AgentStatusStrip } from './AgentStatusStrip'
import { ProcessDrawer } from './ProcessDrawer'
import { ResultCanvas } from './ResultCanvas'

export function AgentBottomSheet() {
  const {
    turn,
    sheetOpen,
    result,
    structuredOutputError,
    structuredOutputIssues,
    driverId,
    closeAgent,
    submit,
    cancelTurn,
    dismissResult,
    genericError,
  } = useAgentSession()
  const { t, language } = useLanguage()
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
  const voice = useVoiceInput({
    lang: language,
    onTranscript: handleTranscript,
  })
  const running = isExecutingTurn(turn)

  useEffect(() => {
    if (!sheetOpen && voice.status === 'listening') voice.stop()
  }, [sheetOpen, voice.status, voice.stop])

  if (!sheetOpen) return null

  function runTurn() {
    const text = input.trim()
    setInputError(text.length > 0 ? undefined : t('agent.inputRequired'))
    if (text.length === 0 || running) return

    voice.stop()
    void submit(text)
      .then((accepted) => {
        if (accepted) setInput('')
      })
      .catch((error: unknown) => {
        setInputError(error instanceof Error ? error.message : t('agent.turnFailed'))
      })
  }

  return (
    <BottomSheet
      snapPoints={[`${AGENT_SHEET_HEIGHT_PERCENT}%`]}
      enablePanDownToClose
      onClose={closeAgent}
      backgroundStyle={{ backgroundColor: '#ffffff' }}
    >
      <View testID="agent-bottom-sheet" className="flex-1">
        <View className="gap-3 px-5 pt-3">
          <View className="flex-row items-center justify-center gap-2">
            <View className="h-1.5 w-10 rounded-full bg-line" />
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-lg font-semibold text-ink">{t('agent.title')}</Text>
              <Text testID="agent-provider" className="text-xs text-muted" numberOfLines={1}>
                {driverId}
              </Text>
            </View>
            {running ? (
              <Pressable
                testID="agent-cancel"
                accessibilityRole="button"
                accessibilityLabel={t('agent.cancelTurn')}
                className="rounded-full bg-danger/10 px-3 py-2"
                onPress={cancelTurn}
              >
                <Text className="text-xs font-medium text-danger">{t('agent.cancel')}</Text>
              </Pressable>
            ) : null}
          </View>
          <AgentStatusStrip turn={turn} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-4 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {genericError ? <Text className="text-xs text-danger">{genericError}</Text> : null}

          {structuredOutputError ? (
            <View className="rounded-3xl bg-danger/10 p-4">
              <Text className="text-sm font-medium text-danger">{t('agent.structuredFailed')}</Text>
              <Text className="mt-1 text-xs text-ink">{structuredOutputError}</Text>
              {structuredOutputIssues.length > 0 ? (
                <View className="mt-2 gap-1">
                  {structuredOutputIssues.map((issue) => (
                    <Text key={`${issue.path}-${issue.message}`} className="text-xs text-ink">
                      {issue.path}: {issue.message}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {result ? (
            <ResultCanvas
              result={result}
              onConfirm={() =>
                void submit(
                  result.result.kind === 'action-request'
                    ? result.result.confirmLabel
                    : t('agent.confirm'),
                ).catch((error: unknown) => {
                  setInputError(
                    error instanceof Error ? error.message : t('agent.confirmationFailed'),
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

        <View className="gap-2 border-t border-line bg-surface px-5 pb-8 pt-3">
          <View className="flex-row items-end gap-2">
            <Pressable
              testID="agent-voice-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                voice.status === 'listening' ? t('agent.stopVoice') : t('agent.startVoice')
              }
              className="mb-1 h-11 w-11 items-center justify-center rounded-full bg-canvas"
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
                <Square size={16} color="#bd4535" />
              ) : (
                <Mic size={18} color="#4f7c5b" />
              )}
            </Pressable>
            <TextInput
              testID="agent-input"
              className="flex-1 rounded-2xl border border-line bg-canvas px-4 py-3 text-base text-ink"
              style={{ minHeight: 72, textAlignVertical: 'top' }}
              value={input}
              onChangeText={setInput}
              placeholder={
                voice.status === 'listening' ? t('agent.listening') : t('agent.placeholder')
              }
              placeholderTextColor="#69746f"
              multiline
              editable={!running}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('agent.runTurn')}
              accessibilityState={{ disabled: running }}
              disabled={running}
              className={`mb-1 rounded-full px-4 py-3 ${running ? 'bg-line' : 'bg-accent'}`}
              onPress={runTurn}
            >
              <Text className={`text-sm font-medium ${running ? 'text-muted' : 'text-white'}`}>
                {running ? t('agent.running') : t('agent.run')}
              </Text>
            </Pressable>
          </View>
          {voice.error ? <Text className="text-xs text-danger">{voice.error}</Text> : null}
          {inputError ? <Text className="text-xs text-danger">{inputError}</Text> : null}
        </View>
      </View>
    </BottomSheet>
  )
}
