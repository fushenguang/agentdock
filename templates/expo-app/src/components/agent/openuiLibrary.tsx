import { createLibrary, defineComponent } from '@openuidev/react-lang'
import { Text as NativeText, View } from 'react-native'
import { z } from 'zod'

const TextComponent = defineComponent({
  name: 'Text',
  description: 'Renders one compact text line.',
  props: z.object({
    content: z.string(),
    variant: z.enum(['title', 'body', 'caption']).optional(),
  }),
  component: ({ props }) => {
    const style =
      props.variant === 'title'
        ? 'text-lg font-semibold text-ink'
        : props.variant === 'caption'
          ? 'text-xs text-muted'
          : 'text-sm text-ink'
    return <NativeText className={style}>{props.content}</NativeText>
  },
})

const MetricComponent = defineComponent({
  name: 'Metric',
  description: 'Renders a compact label/value metric.',
  props: z.object({
    label: z.string(),
    value: z.string(),
  }),
  component: ({ props }) => (
    <View className="gap-1 rounded-2xl bg-canvas p-4">
      <NativeText className="text-xs text-muted">{props.label}</NativeText>
      <NativeText className="text-lg font-semibold text-ink">{props.value}</NativeText>
    </View>
  ),
})

const CardComponent = defineComponent({
  name: 'Card',
  description: 'High-density result root.',
  props: z.object({
    children: z.array(z.union([TextComponent.ref, MetricComponent.ref])).optional(),
  }),
  component: ({ props, renderNode }) => (
    <View className="gap-3 rounded-3xl bg-surface p-5">
      {(props.children ?? []).map((child, index) => (
        <View key={index}>{renderNode(child)}</View>
      ))}
    </View>
  ),
})

export const mobileAgentResultLibrary = createLibrary({
  components: [TextComponent, MetricComponent, CardComponent],
  root: 'Card',
})
