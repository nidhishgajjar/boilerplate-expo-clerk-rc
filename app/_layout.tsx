import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo'
import { Stack, useRouter, useSegments } from 'expo-router'
import { tokenCache } from '../cache'
import { useEffect, useState } from 'react'
import LoadingOverlay from '../components/LoadingOverlay'
import { configureRevenueCat } from './config/revenueCat'
import Purchases from 'react-native-purchases'
import { useFonts } from 'expo-font'
import { SplashScreen } from 'expo-router'
import { StyleSheet, View, Text, TextProps } from 'react-native'

// Use type assertion to safely set default props
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: { fontFamily: 'Urbanist' }
};

function RootLayoutNav() {
  const { isSignedIn } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    
    const navigate = async () => {
      if (!isSignedIn && !inAuthGroup) {
        setIsNavigating(true)
        await router.replace('/(auth)/auth')
        setIsNavigating(false)
      } else if (isSignedIn && inAuthGroup) {
        setIsNavigating(true)
        await router.replace('/(home)')
        setIsNavigating(false)
      }
    }

    navigate()
  }, [isSignedIn, segments])

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        <Stack.Screen name="(home)" options={{ animation: 'none' }} />
      </Stack>
      {isNavigating && <LoadingOverlay />}
    </>
  )
}

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

  if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env file')
  }

  const [loaded] = useFonts({
    'Urbanist': require('../assets/fonts/Urbanist-VariableFont_wght.ttf'),
  })

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    console.log('Configuring RevenueCat...')
    configureRevenueCat();

    console.log('Getting offerings...')

    // Add error handling
    Purchases.getOfferings().then(console.log).catch(console.error)
  }, []);

  if (!loaded) {
    return null
  }

  return (
    <View style={styles.container}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <ClerkLoaded>
          <RootLayoutNav />
        </ClerkLoaded>
      </ClerkProvider>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  // ... other existing styles
});
