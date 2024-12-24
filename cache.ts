import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { TokenCache } from '@clerk/clerk-expo/dist/cache'

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const token = await SecureStore.getItemAsync(key)
        return token
      } catch (err) {
        console.error('Failed to get token from secure store:', err)
        return null
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        await SecureStore.setItemAsync(key, token)
      } catch (err) {
        console.error('Failed to save token to secure store:', err)
      }
    },
  }
}

export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined