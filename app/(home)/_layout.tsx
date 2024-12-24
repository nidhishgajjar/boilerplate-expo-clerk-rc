import { Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'

export default function HomeLayout() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  )
} 