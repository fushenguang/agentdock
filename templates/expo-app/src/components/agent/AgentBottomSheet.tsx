import { BottomSheet } from '@expo/ui/community/bottom-sheet'
import { ArrowUp, Mic, Square } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { isExecutingTurn } from '../../core/agent'
import { useVoiceInput } from '../../core/voice/useVoiceInput'
import { useLanguage } from '../settings/LanguageProvider'
import { AGENT_SHEET_HEIGHT_PERCENT, useAgentSession } from './AgentProvider'
import { ProcessDrawer } from './ProcessDrawer'
import { ResultCanvas } from './ResultCanvas'

export function AgentBottomSheet() {
  const {
    turn,
    sheetOpen,
    result,
    structuredOutputError,
    structuredOutputIssues,
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
        <View className="px-5 pt-2">
          {running ? (
            <Pressable
              testID="agent-cancel"
              accessibilityRole="button"
              accessibilityLabel={t('agent.cancelTurn')}
              className="self-end rounded-full bg-danger/10 px-3 py-2"
              onPress={cancelTurn}
            >
              <Text className="text-xs font-medium text-danger">{t('agent.cancel')}</Text>
            </Pressable>
          ) : null}
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
          <ProcessDrawer steps={turn.steps} turn={turn} />
        </ScrollView>

        <View className="gap-2 border-t border-line bg-surface px-5 pb-8 pt-3">
          <View className="relative flex-1">
            <Pressable
              testID="agent-voice-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                voice.status === 'listening' ? t('agent.stopVoice') : t('agent.startVoice')
              }
              className="absolute left-2 top-3 h-10 w-10 items-center justify-center rounded-full"
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
                <Mic size={17} color="#4f7c5b" />
              )}
            </Pressable>
            <Pressable
              testID="agent-send"
              accessibilityRole="button"
              accessibilityLabel={t('agent.send')}
              accessibilityState={{ disabled: running }}
              disabled={running}
              className={`absolute bottom-2 right-2 h-11 w-11 items-center justify-center rounded-full ${
                running ? 'bg-line' : 'bg-accent'
              }`}
              onPress={runTurn}
            >
              <ArrowUp size={20} color={running ? '#69746f' : '#ffffff'} />
            </Pressable>
            <TextInput
              testID="agent-input"
              className="rounded-3xl border border-line bg-canvas py-3 pl-14 pr-16 text-base text-ink"
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
          </View>
          {voice.error ? <Text className="text-xs text-danger">{voice.error}</Text> : null}
          {inputError ? <Text className="text-xs text-danger">{inputError}</Text> : null}
        </View>
      </View>
    </BottomSheet>
  )
}
