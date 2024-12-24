import { View } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

export const EmailIcon = ({ size = 20 }) => {
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <MaterialIcons name="email" size={size} color="#fff" />
    </View>
  )
} 