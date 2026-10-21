import { ScrollView, View } from 'react-native'
import { Card, Section, Text } from '../src/components/ui'

const RECENT_SESSIONS = [
  { title: 'Prepare domain summary', detail: 'Completed · structured summary' },
  { title: 'Review storage usage', detail: 'Draft · waiting for confirmation' },
]

export default function HistoryDesktop() {
  return (
    <ScrollView
      testID="history-desktop"
      className="flex-1"
      contentContainerClassName="gap-8 px-5 pb-32"
    >
      <View className="gap-3 pt-4">
        <Text variant="display">History & Tasks</Text>
        <Text variant="muted">Continue local sessions even when the network is unavailable.</Text>
      </View>
      <Section title="Recent">
        <View className="gap-4">
          {RECENT_SESSIONS.map((session) => (
            <Card key={session.title}>
              <Text variant="title">{session.title}</Text>
              <Text className="mt-2">{session.detail}</Text>
            </Card>
          ))}
        </View>
      </Section>
    </ScrollView>
  )
}
