import { useOAuth } from '@clerk/clerk-expo'
import { Button } from '@/components/Button'
import { useCallback } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { useWarmUpBrowser } from '../hooks/useWarmUpBrowser'
import { GoogleIcon } from './GoogleIcon'
import { StyleSheet, View } from 'react-native'
import { handleError } from '@/utils/error'
import { router } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

export const OAuth = () => {
  useWarmUpBrowser()

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow()
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        router.replace('/(home)')
      }
    } catch (err) {
      handleError(err)
    }
  }, [startOAuthFlow])

  const googleIcon = (
    <View style={styles.googleIconContainer}>
      <GoogleIcon size={20} />
    </View>
  )

  return (
    <Button
      onPress={onPress}
      mode="contained"
      style={styles.button}
      icon={googleIcon}
    >
      Continue with Google
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  googleIconContainer: {
    backgroundColor: 'transparent',
  }
}) 