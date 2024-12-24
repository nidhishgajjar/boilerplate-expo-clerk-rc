import { Alert } from 'react-native'

export const handleError = (error: any, customMessage?: string) => {
  console.error(error)
  
  // Get the error message from different possible error formats
  const errorMessage = error?.errors?.[0]?.message || 
    error?.message || 
    error?.toString() ||
    customMessage ||
    'Something went wrong. Please try again.'

  Alert.alert('Error', errorMessage)
} 