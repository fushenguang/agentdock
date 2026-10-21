import { Link, Stack } from 'expo-router'
import { Text, View } from 'react-native'

export interface SecondaryScreenProps {
  title: string
  body: string
}

export function SecondaryScreen({ title, body }: SecondaryScreenProps) {
  return (
    <>
      <Stack.Screen options={{ title }} />
      <View className="gap-4 px-5 pb-32 pt-4">
        <Link href="/user" className="text-sm text-accent">
          User
        </Link>
        <Text className="text-3xl font-semibold text-ink">{title}</Text>
        <Text className="text-base text-ink">{body}</Text>
      </View>
    </>
  )
}
