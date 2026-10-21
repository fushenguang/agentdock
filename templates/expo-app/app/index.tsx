import { Pressable, ScrollView, View } from 'react-native'
import { useAgentSession } from '../src/components/agent'
import { Card, Section, Text } from '../src/components/ui'

export default function DomainDesktop() {
  const { startSession } = useAgentSession()

  return (
    <ScrollView
      testID="domain-desktop"
      className="flex-1"
      contentContainerClassName="gap-8 px-5 pb-32"
    >
      <View className="gap-3 pt-4">
        <Text variant="display">TheFoolAI</Text>
        <Text variant="muted">
          A local-first agent workspace for this domain. Voice is the fastest way to begin.
        </Text>
      </View>

      <Section title="Domain surface">
        <View className="gap-4">
          <Card>
            <Text variant="title">Domain package</Text>
            <Text className="mt-2">
              This desktop is reserved for the selected domain package Web and its agent-safe
              actions.
            </Text>
          </Card>
          <Card>
            <Text variant="title">Agent capabilities</Text>
            <Text className="mt-2">
              Turn context, memory projection, tool policy, permissions, and audit remain in Agent
              Core Lite.
            </Text>
          </Card>
        </View>
      </Section>

      <Section title="Primary action">
        <Card className="items-start bg-accent/10">
          <Text variant="title">Start a voice session</Text>
          <Text className="mt-2">Create a draft turn and speak to the agent.</Text>
          <Pressable className="mt-4" onPress={startSession}>
            <Text className="text-sm font-medium text-accent">New session</Text>
          </Pressable>
        </Card>
      </Section>
    </ScrollView>
  )
}
