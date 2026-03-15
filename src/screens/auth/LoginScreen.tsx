/**
 * LoginScreen - Authentication screen for the Admission Times mobile app
 * 
 * Refactored to use Zustand store for state management
 * Matches web frontend SignIn.tsx exactly
 */

import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { useAuthStore, useStudentStore } from '../../store'
import { screenStyles } from '../../utils/screenStyles'
import { BrandMark } from '../../components/ui'

export default function LoginScreen() {
  const signIn = useAuthStore(state => state.signIn)
  const isLoading = useAuthStore(state => state.isLoading)
  const fetchDashboardData = useStudentStore(state => state.fetchDashboardData)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async () => {
    if (isLoading) return

    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.')
      return
    }
    
    try {
      await signIn(
        { email: email.trim(), password },
        {
          onSuccess: async (user) => {
            // Load data based on role
            if (user.role === 'student') {
              await fetchDashboardData()
            }
            // Navigation is handled by AppNavigator reacting to auth state
          },
          onError: (errorMessage) => {
            console.error('Login error:', errorMessage)
            Alert.alert('Login Failed', errorMessage)
          },
        }
      )
    } catch (error) {
      console.error('Login error:', error)
      // Error already handled in onError callback
    }
  }

  return (
    <ScrollView contentContainerStyle={screenStyles.container}>
      <Text style={screenStyles.title}>Login</Text>

      <View style={screenStyles.card}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BrandMark size={28} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>AdmissionTimes</Text>
          </View>
        </View>

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
        <View style={{ position: 'relative' }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ 
              borderWidth: 1, 
              borderColor: '#E5E7EB', 
              padding: 10, 
              paddingRight: 50,
              borderRadius: 8, 
              marginTop: 6 
            }}
          />
          <Pressable 
            onPress={() => setShowPassword(!showPassword)}
            style={{ 
              position: 'absolute', 
              right: 10, 
              top: 16
            }}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </Pressable>
        </View>

        <View style={{ height: 12 }} />

        <Pressable 
          style={[screenStyles.button, isLoading && { opacity: 0.5 }]} 
          onPress={onSubmit}
          disabled={isLoading}
        >
          <Text style={screenStyles.buttonText}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>

        <View style={{ height: 12 }} />
      </View>
    </ScrollView>
  )
}
