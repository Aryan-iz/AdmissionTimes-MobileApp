import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { useAuth } from '../../contexts/AuthContext'
import { screenStyles } from '../../utils/screenStyles'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('student@demo.com')
  const [password, setPassword] = useState('student123')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await login({ email, password })
      if (!result.ok) {
        Alert.alert('Login failed', result.message)
      }
      // Success: navigation is handled by AppNavigator reacting to auth state.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
      <Text style={screenStyles.title}>Login</Text>

      <View style={screenStyles.card}>
        <Text>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginTop: 6 }}
        />

        <View style={{ height: 12 }} />

        <Text>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{ borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginTop: 6 }}
        />

        <View style={{ height: 12 }} />

        <Pressable style={screenStyles.button} onPress={onSubmit}>
          <Text style={screenStyles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>

        <View style={{ height: 12 }} />

        <Text style={screenStyles.muted}>Demo accounts:</Text>
        <Text style={screenStyles.muted}>student@demo.com / student123</Text>
        <Text style={screenStyles.muted}>university@demo.com / university123</Text>
        <Text style={screenStyles.muted}>admin@demo.com / admin123</Text>
      </View>
    </ScrollView>
  )
}
