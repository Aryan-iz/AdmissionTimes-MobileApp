import { View, Text, Pressable, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator.tsx'
import { screenStyles } from '../../utils/screenStyles'

export default function HomeScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
      <Text style={screenStyles.title}>AdmissionTimes (Mobile)</Text>
      <Text style={screenStyles.muted}>This is the public home screen.</Text>

      <View style={screenStyles.section}>
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('StudentDashboard')}>
          <Text style={screenStyles.buttonText}>Go to Student</Text>
        </Pressable>
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('UniversityDashboard')}>
          <Text style={screenStyles.buttonText}>Go to University</Text>
        </Pressable>
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminDashboard')}>
          <Text style={screenStyles.buttonText}>Go to Admin</Text>
        </Pressable>
      </View>

      <View style={screenStyles.section}>
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('Features')}>
          <Text style={screenStyles.buttonText}>Features</Text>
        </Pressable>
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('Contact')}>
          <Text style={screenStyles.buttonText}>Contact</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
