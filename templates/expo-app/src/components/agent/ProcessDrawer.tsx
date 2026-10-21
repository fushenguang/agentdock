import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import type { AgentTurnStep } from '../../core/agent'

const STATUS_COLORS = {
  running: 'text-accent',
  succeeded: 'text-success',
  failed: 'text-danger',
  skipped: 'text-muted',
} as const

function StepRow({ step }: { step: AgentTurnStep }) {
  return (
    <View className="flex-row gap-3 border-b border-line py-3">
      <Text className="w-20 text-xs uppercase text-muted">{step.kind}</Text>
      <Text className="flex-1 text-sm text-ink">{step.label}</Text>
      <Text className={`text-xs ${STATUS_COLORS[step.status]}`}>{step.status}</Text>
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

  return (
    <View className="gap-2">
      <Pressable
        testID="agent-process-toggle"
        accessibilityLabel={expanded ? 'Collapse execution process' : 'Expand execution process'}
        className="flex-row items-center justify-between"
        onPress={() => setExpanded((current) => !current)}
      >
        <Text className="text-sm font-medium text-ink">Execution process</Text>
        {expanded ? (
          <ChevronUp size={18} color="#17211d" />
        ) : (
          <ChevronDown size={18} color="#17211d" />
        )}
      </Pressable>
      {expanded ? (
        <View>
          {steps.length === 0 ? (
            <Text className="py-3 text-sm text-muted">No execution event yet.</Text>
          ) : (
            latestSteps(steps).map((step) => (
              <StepRow key={`${step.id}-${step.startedAt}`} step={step} />
            ))
          )}
        </View>
      ) : null}
    </View>
  )
}
