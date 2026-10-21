import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AgentSessionProvider } from '../src/components/agent'
import { WorkspaceShell } from '../src/components/shell'

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AgentSessionProvider>
          <WorkspaceShell>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#f7f7f4' },
              }}
            />
          </WorkspaceShell>
          <StatusBar style="dark" />
        </AgentSessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
