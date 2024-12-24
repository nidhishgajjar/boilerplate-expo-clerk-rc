import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native'
import React, { forwardRef } from 'react'
import * as Haptics from 'expo-haptics'

interface ButtonProps {
  children: React.ReactNode
  onPress?: () => void
  loading?: boolean
  mode?: 'contained' | 'outlined'
  icon?: React.ReactNode
  style?: any
  labelStyle?: TextStyle
  disabled?: boolean
}

export const Button = forwardRef<View, ButtonProps>(({ 
  children, 
  onPress, 
  loading, 
  mode = 'contained',
  icon,
  style,
  disabled
}, ref) => {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress?.()
    } catch (error) {
      onPress?.()
    }
  }

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        mode === 'outlined' && styles.outlined,
        pressed && styles.pressed,
        style,
        disabled && styles.disabled
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={mode === 'contained' ? '#fff' : '#000'} />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[
              styles.text,
              mode === 'outlined' && styles.outlinedText,
              mode === 'outlined' && style?.buttonTextStyle,
            ]}>
              {children}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.995 }],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  outlinedText: {
    color: '#000000',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
}) 