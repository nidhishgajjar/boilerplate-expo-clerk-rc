import { useSignIn, useSignUp, useAuth } from '@clerk/clerk-expo'
import { router } from 'expo-router'
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Linking,
  Image,
  Modal,
  Animated,
  TouchableOpacity,
} from 'react-native'
import React from 'react'
import { OAuth } from '@/components/OAuth'
import { handleError } from '@/utils/error'
import { Button } from '@/components/Button'
import * as Haptics from 'expo-haptics'
import { EmailIcon } from '@/components/EmailIcon'
import { BlurView } from 'expo-blur'

export default function Auth() {
  const { signIn, isLoaded: signInLoaded, setActive: setSignInActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded, setActive: setSignUpActive } = useSignUp()
  const { isSignedIn } = useAuth()
  const [emailAddress, setEmailAddress] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [isExistingUser, setIsExistingUser] = React.useState(false)
  const [showEmailForm, setShowEmailForm] = React.useState(false)
  const inputRef = React.useRef<TextInput>(null)
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const [modalStep, setModalStep] = React.useState<'form' | 'instructions'>('form')

  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/(home)')
    }
  }, [isSignedIn, signInLoaded])

  React.useEffect(() => {
    if (showEmailForm) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [showEmailForm])

  const openMailApp = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      if (Platform.OS === 'ios') {
        await Linking.openURL('message://')
      } else {
        await Linking.openURL('mailto:')
      }
    } catch (error) {
      console.log('Error opening mail app:', error)
    }
  }

  const onSubmit = async () => {
    if (!signInLoaded || !signUpLoaded) {
      console.log('Auth not loaded')
      handleError(new Error('Authentication is not ready'))
      return
    }

    if (!emailAddress) {
      console.log('No email provided')
      Alert.alert('Missing Information', 'Please enter your email address')
      return
    }

    // First show the instructions UI
    setModalStep('instructions')
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      
      try {
        // Set loading only when starting the auth process
        setLoading(true)
        console.log('Attempting sign in...')
        const signInAttempt = await signIn.create({
          identifier: emailAddress,
        })

        setIsExistingUser(true)
        
        const emailLinkFactor = signInAttempt.supportedFirstFactors?.find(
          (ff) => ff.strategy === 'email_link'
        ) as any

        if (!emailLinkFactor) {
          throw new Error('Email link authentication not available')
        }

        const { startEmailLinkFlow } = signIn.createEmailLinkFlow()
        const result = await startEmailLinkFlow({
          emailAddressId: emailLinkFactor.emailAddressId,
          redirectUrl: 'https://relaxed-fox-b61a74.netlify.app'
        })

        if (result.status === 'complete') {
          await setSignInActive({ session: result.createdSessionId })
          router.replace('/(home)')
        }

      } catch (signInError) {
        console.log('Sign in failed, attempting sign up:', signInError)
        
        try {
          const signUpAttempt = await signUp.create({
            emailAddress
          })

          await new Promise(resolve => setTimeout(resolve, 1000))

          const { startEmailLinkFlow } = signUp.createEmailLinkFlow()
          const result = await startEmailLinkFlow({
            redirectUrl: 'https://relaxed-fox-b61a74.netlify.app'
          })

          console.log('Sign up email link flow started:', result)

          if (result.status === 'complete') {
            await setSignUpActive({ session: result.createdSessionId })
            router.replace('/(home)')
          }

          setIsExistingUser(false)

        } catch (signUpError) {
          console.log('Sign up error:', signUpError)
          // If there's an error, go back to the form
          setModalStep('form')
          throw signUpError
        }
      }
    } catch (err) {
      console.log('Auth error:', JSON.stringify(err, null, 2))
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      // If there's an error, go back to the form
      setModalStep('form')
      handleError(err, 'Unable to process your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setShowEmailForm(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Image 
          source={require('@/assets/images/bg.png')} 
          style={styles.backgroundImage}
        />
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>TBD-ND</Text>
            <Text style={styles.subtitle}>
              A boilerplate app
            </Text>
          </View>
          
          <View style={styles.buttonsContainer}>
            <OAuth />
            <Button 
              onPress={() => setShowEmailForm(true)}
              mode="contained"
              style={[styles.submitButton, styles.primaryButton]}
              icon={<EmailIcon />}
            >
              Continue with Email
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Email Form Modal */}
      <Modal
        visible={showEmailForm}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <BlurView 
          intensity={40}
          style={styles.modalContainer}
          tint="dark"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [400, 0],
                    })
                  }]
                }
              ]}
            >
              {modalStep === 'form' ? (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Enter your email</Text>
                    <Text style={styles.modalSubtitle}>
                      We'll send you a secure link to continue
                    </Text>
                  </View>

                  <TextInput
                    ref={inputRef}
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="name@example.com"
                    onChangeText={setEmailAddress}
                    style={styles.input}
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    placeholderTextColor="#999"
                  />

                  <Button 
                    onPress={onSubmit}
                    loading={loading}
                    mode="contained"
                    style={styles.submitButton}
                  >
                    Continue
                  </Button>

                  <Button
                    onPress={() => setShowEmailForm(false)}
                    mode="outlined"
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonLabel}>Back</Text>
                  </Button>
                </>
              ) : (
                <View style={styles.instructionsContainer}>
                  <View style={styles.header}>
                    <Text style={styles.title}>
                      {isExistingUser ? 'Welcome back!' : 'Almost there!'}
                    </Text>
                    <Text style={styles.subtitle}>
                      {isExistingUser 
                        ? 'Check your email to sign in'
                        : 'Check your email to complete signup'
                      }
                    </Text>
                  </View>

                  <View style={styles.emailContainer}>
                    <Text style={styles.emailLabel}>We sent an email to</Text>
                    <Text style={styles.emailText}>{emailAddress}</Text>
                  </View>

                  <View style={styles.stepsContainer}>
                    <Text style={styles.stepsTitle}>Next steps:</Text>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>1</Text>
                      <Text style={styles.stepText}>Open your email app</Text>
                    </View>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>2</Text>
                      <Text style={styles.stepText}>Check for an email from </Text>
                    </View>
                    <View style={styles.step}>
                      <Text style={styles.stepNumber}>3</Text>
                      <Text style={styles.stepText}>
                        Click the magic link to {isExistingUser ? 'sign in' : 'create your account'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mailAppsContainer}>
                    <Button
                      onPress={openMailApp}
                      mode="contained"
                      style={[styles.mailAppButton, styles.primaryButton]}
                    >
                      Open Mail App
                    </Button>
                    <Button
                      onPress={handleCloseModal}
                      mode="outlined"
                      style={styles.mailAppButton}
                    >
                      Close
                    </Button>
                  </View>
                </View>
              )}
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingBottom: Platform.OS === 'ios' ? 70 : 50,
  },
  header: {
    flex: 0,
    marginTop: 0,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Urbanist',
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -1,
    color: '#000',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Urbanist',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontFamily: 'Urbanist',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontFamily: 'Urbanist',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 240,
  },
  input: {
    fontFamily: 'Urbanist',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    fontSize: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  closeButton: {
    marginTop: 16,
    borderRadius: 14,
  },
  closeButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderWidth: 0,
  },
  instructionsContainer: {
    padding: 24,
  },
  emailContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emailLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  stepsContainer: {
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  mailAppsContainer: {
    marginBottom: 16,
    gap: 12,
  },
  mailAppButton: {
    borderRadius: 16,
  },
}) 