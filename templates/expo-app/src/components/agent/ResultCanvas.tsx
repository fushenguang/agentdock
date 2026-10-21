import { Renderer } from '@openuidev/react-lang'
import { Text, View } from 'react-native'
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
      {metrics.map((metric) => (
        <View key={`${metric.label}-${metric.value}`} className="rounded-3xl bg-surface p-5">
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
    <View className="rounded-3xl bg-surface p-4">
      <View className="flex-row border-b border-line pb-2">
        {table.columns.map((column) => (
          <Text key={column.key} className="flex-1 text-xs font-medium text-muted">
            {column.label}
          </Text>
        ))}
      </View>
      {table.rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row border-b border-line py-3">
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

export function ResultCanvas({ result }: { result: AgentResultEnvelope }) {
  return (
    <View testID="result-canvas" className="gap-3">
      <View className="gap-1">
        <Text className="text-xl font-semibold text-ink">{result.title}</Text>
        <Text className="text-xs text-muted">
          {result.status} · schema {result.schema_version}
        </Text>
      </View>
      {result.result.kind === 'summary' ? <SummaryResult metrics={result.result.metrics} /> : null}
      {result.result.kind === 'table' ? <TableResult table={result.result.table} /> : null}
      {result.result.kind === 'openui' ? (
        <Renderer response={result.result.source} library={mobileAgentResultLibrary} />
      ) : null}
      {result.result.kind === 'action-request' ? (
        <View className="rounded-3xl bg-attention/10 p-5">
          <Text className="text-base text-ink">{result.result.message}</Text>
        </View>
      ) : null}
      {result.follow_ups.length > 0 ? (
        <View className="gap-2 pt-2">
          {result.follow_ups.map((followUp) => (
            <Text key={followUp} className="text-sm text-muted">
              • {followUp}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}
