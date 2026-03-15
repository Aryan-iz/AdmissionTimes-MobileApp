import { ActivityIndicator, Text, View } from 'react-native'
import { BrandMark } from '../../components/ui'

export default function AuthLoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BrandMark size={30} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>AdmissionTimes</Text>
      </View>
      <ActivityIndicator size="large" />
    </View>
  )
}
