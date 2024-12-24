import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="auth"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 200,
        }}
      />
    </Stack>
  )
} 