import { ScrollView, Text } from 'react-native'
import { screenStyles } from '../../utils/screenStyles'

export default function ContactScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
      <Text style={screenStyles.title}>Contact</Text>
      <Text style={screenStyles.muted}>Placeholder screen. No backend submission.</Text>
    </ScrollView>
  )
}
