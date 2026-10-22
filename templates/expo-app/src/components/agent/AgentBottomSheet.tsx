import { BottomSheet } from '@expo/ui/community/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isExecutingTurn } from '../../core/agent'
import { useVoiceInput } from '../../core/voice/useVoiceInput'
import { tapFeedback } from '../../lib/haptics'
import { AppIcon } from '../ui'
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
  const insets = useSafeAreaInsets()
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

        <View
          className="shrink-0 gap-2 border-t border-line bg-surface px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row w-full items-end rounded-[30px] border border-lineWarm bg-surfaceWarm p-1.5">
            <Pressable
              testID="agent-voice-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                voice.status === 'listening' ? t('agent.stopVoice') : t('agent.startVoice')
              }
              className="mb-1 ml-1 h-12 w-12 items-center justify-center rounded-full bg-accentSoft"
              onPress={() => {
                tapFeedback()
                if (voice.status === 'listening') {
                  voice.stop()
                  return
                }
                typedPrefixRef.current = input.trim()
                void voice.start()
              }}
            >
              {voice.status === 'listening' ? (
                <AppIcon name="stop" size={16} color="#bd4535" />
              ) : (
                <AppIcon name="mic" size={18} color="#b8731f" />
              )}
            </Pressable>
            <TextInput
              testID="agent-input"
              className="min-h-[78px] flex-1 bg-transparent px-2 py-3 text-base text-ink"
              style={{
                paddingTop: 14,
                paddingBottom: 14,
                textAlignVertical: 'top',
              }}
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
              testID="agent-send"
              accessibilityRole="button"
              accessibilityLabel={running ? t('agent.cancelTurn') : t('agent.send')}
              accessibilityState={{ busy: running }}
              className={`mb-1 mr-1 h-12 w-12 items-center justify-center rounded-full ${
                running ? 'bg-danger' : 'bg-accent'
              }`}
              onPress={() => {
                tapFeedback()
                if (running) cancelTurn()
                else runTurn()
              }}
            >
              {running ? (
                <AppIcon name="pause" size={21} color="#ffffff" />
              ) : (
                <AppIcon name="send" size={21} color="#ffffff" />
              )}
            </Pressable>
          </View>
          {voice.error ? <Text className="text-xs text-danger">{voice.error}</Text> : null}
          {inputError ? <Text className="text-xs text-danger">{inputError}</Text> : null}
        </View>
      </View>
    </BottomSheet>
  )
}
