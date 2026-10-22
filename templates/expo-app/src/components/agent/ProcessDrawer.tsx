import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { AgentTurnStep } from '../../core/agent'
import { useLanguage } from '../settings/LanguageProvider'

const STATUS_COLORS = {
  running: 'text-accent',
  succeeded: 'text-success',
  failed: 'text-danger',
  skipped: 'text-muted',
} as const

function StepRow({
  step,
  kindLabel,
  statusLabel,
}: {
  step: AgentTurnStep
  kindLabel: string
  statusLabel: string
}) {
  return (
    <View className="flex-row gap-3 border-b border-line py-3">
      <Text className="w-20 text-xs uppercase text-muted">{kindLabel}</Text>
      <Text className="flex-1 text-sm text-ink">{step.label}</Text>
      <Text className={`text-xs ${STATUS_COLORS[step.status]}`}>{statusLabel}</Text>
    </View>
  )
}

function latestSteps(steps: readonly AgentTurnStep[]): readonly AgentTurnStep[] {
  const latestById = new Map<string, AgentTurnStep>()
  for (const step of steps) latestById.set(step.id, step)
  return [...latestById.values()]
}

export function ProcessDrawer({ steps }: { steps: readonly AgentTurnStep[] }) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useLanguage()
  const kindLabels = {
    reasoning: t('process.reasoning'),
    tool: t('process.tool'),
    script: t('process.script'),
    validation: t('process.validation'),
  } as const
  const statusLabels = {
    running: t('process.running'),
    succeeded: t('process.succeeded'),
    failed: t('process.failed'),
    skipped: t('process.skipped'),
  } as const

  return (
    <View className="gap-2">
      <Pressable
        testID="agent-process-toggle"
        accessibilityLabel={expanded ? t('process.collapse') : t('process.expand')}
        className="flex-row items-center justify-between"
        onPress={() => setExpanded((current) => !current)}
      >
        <Text className="text-sm font-medium text-ink">{t('process.title')}</Text>
        {expanded ? (
          <ChevronUp size={18} color="#17211d" />
        ) : (
          <ChevronDown size={18} color="#17211d" />
        )}
      </Pressable>
      {expanded ? (
        <View>
          {steps.length === 0 ? (
            <Text className="py-3 text-sm text-muted">{t('process.empty')}</Text>
          ) : (
            latestSteps(steps).map((step) => (
              <StepRow
                key={`${step.id}-${step.startedAt}`}
                step={step}
                kindLabel={kindLabels[step.kind]}
                statusLabel={statusLabels[step.status]}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  )
}
