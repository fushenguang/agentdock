import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Renderer } from '@openuidev/react-lang'
import { Pressable, Text, View } from 'react-native'
import type { AgentMetric, AgentResultEnvelope, AgentTable } from '../../core/agent'
import { mobileAgentResultLibrary } from './openuiLibrary'

const METRIC_STATES = {
  neutral: 'text-ink',
  positive: 'text-success',
  warning: 'text-warning',
  negative: 'text-danger',
} as const

function SummaryResult({ metrics }: { metrics: readonly AgentMetric[] }) {
  return (
    <View className="gap-3">
      {metrics.map((metric, index) => (
        <View
          key={`metric-${index}`}
          className="rounded-[28px] border border-white/70 bg-white/80 p-5"
        >
          <Text className="text-xs text-muted">{metric.label}</Text>
          <Text className="mt-1 text-2xl font-semibold text-ink">{metric.value}</Text>
          {metric.delta ? (
            <Text className={metric.state ? METRIC_STATES[metric.state] : METRIC_STATES.neutral}>
              {metric.delta}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}

function TableResult({ table }: { table: AgentTable }) {
  return (
    <View className="overflow-hidden rounded-[28px] border border-white/70 bg-white/82 p-4">
      <View className="flex-row border-b border-line pb-2">
        {table.columns.map((column) => (
          <Text key={column.key} className="flex-1 text-xs font-medium text-muted">
            {column.label}
          </Text>
        ))}
      </View>
      {table.rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} className="flex-row border-b border-line py-3">
          {table.columns.map((column) => (
            <Text key={column.key} className="flex-1 text-sm text-ink">
              {String(row[column.key] ?? '')}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function TextResult({ text }: { text: string }) {
  return (
    <View className="rounded-[28px] border border-white/70 bg-white/84 p-5">
      <Text className="text-lg leading-7 text-ink">{text}</Text>
    </View>
  )
}

interface OpenUIResultState {
  readonly failed: boolean
}

class OpenUIResult extends Component<{ readonly source: string }, OpenUIResultState> {
  state: OpenUIResultState = { failed: false }

  static getDerivedStateFromError(): OpenUIResultState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('OpenUI result rendering failed', error, info.componentStack)
  }

  componentDidUpdate(previousProps: { readonly source: string }): void {
    if (previousProps.source !== this.props.source && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <View className="rounded-3xl bg-warning/10 p-4">
          <Text className="text-sm text-ink">This structured result could not be rendered.</Text>
        </View>
      )
    }

    return <Renderer response={this.props.source} library={mobileAgentResultLibrary} />
  }
}

export function ResultCanvas({
  result,
  onConfirm,
  onCancel,
}: {
  result: AgentResultEnvelope
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <View testID="result-canvas" className="gap-3">
      {result.result.kind === 'text' ? null : (
        <Text className="text-xl font-semibold text-ink">{result.title}</Text>
      )}
      {result.result.kind === 'text' ? <TextResult text={result.result.text} /> : null}
      {result.result.kind === 'summary' ? <SummaryResult metrics={result.result.metrics} /> : null}
      {result.result.kind === 'table' ? <TableResult table={result.result.table} /> : null}
      {result.result.kind === 'openui' ? <OpenUIResult source={result.result.source} /> : null}
      {result.result.kind === 'action-request' ? (
        <View className="gap-4 rounded-[30px] border border-white/70 bg-attention/12 p-5">
          <Text className="text-base text-ink">{result.result.message}</Text>
          <View className="flex-row justify-end gap-2">
            <Pressable
              testID="result-action-cancel"
              accessibilityRole="button"
              accessibilityLabel={result.result.cancelLabel}
              className="rounded-full bg-white/85 px-4 py-2"
              onPress={onCancel}
            >
              <Text className="text-sm font-medium text-ink">{result.result.cancelLabel}</Text>
            </Pressable>
            <Pressable
              testID="result-action-confirm"
              accessibilityRole="button"
              accessibilityLabel={result.result.confirmLabel}
              className="rounded-full bg-accent px-5 py-2"
              onPress={onConfirm}
            >
              <Text className="text-sm font-medium text-white">{result.result.confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {result.follow_ups.length > 0 ? (
        <View className="gap-2 pt-2">
          {result.follow_ups.map((followUp, index) => (
            <Text key={`follow-up-${index}`} className="text-sm text-muted">
              • {followUp}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}
