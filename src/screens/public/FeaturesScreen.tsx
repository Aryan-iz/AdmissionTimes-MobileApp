import { ScrollView, Text } from 'react-native'
import { screenStyles } from '../../utils/screenStyles'

export default function FeaturesScreen() {
  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
      <Text style={screenStyles.title}>Features</Text>
      <Text style={screenStyles.muted}>Placeholder screen. Port the web UI later.</Text>
    </ScrollView>
  )
}
