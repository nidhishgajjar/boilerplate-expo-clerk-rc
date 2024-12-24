import { SignedIn, SignedOut, useAuth, useUser, useSignIn } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { 
  Text, 
  View, 
  StyleSheet, 
  Image, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  TouchableOpacity
} from 'react-native'
import React from 'react'
import { OAuth } from '@/components/OAuth'
import * as WebBrowser from 'expo-web-browser'
import { handleError } from '@/utils/error'
import { Alert } from 'react-native'
import { Button } from '@/components/Button'
import { usePaywall } from '../hooks/usePaywall'

export default function Home() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const { presentPaywall } = usePaywall()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleUpgrade = async () => {
    const purchased = await presentPaywall();
    if (purchased) {
      console.log('Purchase successful!');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SignedIn>
        <View style={styles.signedInContainer}>
          <Image 
            source={{ uri: user?.imageUrl }} 
            style={styles.avatar}
          />
          <Text style={styles.welcomeText}>
            Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress}
          </Text>
          
          <TouchableOpacity 
            onPress={handleUpgrade}
            style={styles.upgradeButton}
          >
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>

          <Button onPress={() => signOut()} mode="outlined" style={styles.signOutButton}>
            Sign Out
          </Button>
        </View>
      </SignedIn>
      
      {/* Keep existing SignedOut component... */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  signedInContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  upgradeText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Urbanist',
  },
  signOutButton: {
    marginTop: 8,
  }
})

