/**
 * LoginScreen - Authentication screen for the Admission Times mobile app
 * 
 * Refactored to use Zustand store for state management
 * Matches web frontend SignIn.tsx exactly
 */

import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import { useAuthStore, useStudentStore } from '../../store'
import { BrandMark } from '../../components/ui'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { showAuthErrorToast, showInfoToast } from '../../services/toast'

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const signIn = useAuthStore(state => state.signIn)
  const isLoading = useAuthStore(state => state.isLoading)
  const fetchDashboardData = useStudentStore(state => state.fetchDashboardData)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async () => {
    if (isLoading) return

    if (!email.trim() || !password.trim()) {
      showInfoToast('Missing information', 'Please enter both email and password.')
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
            showAuthErrorToast('Sign in failed', errorMessage)
          },
        }
      )
    } catch (error) {
      console.error('Login error:', error)
      showAuthErrorToast('Sign in failed', 'Unable to sign in right now. Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <View style={styles.logoIconWrap}>
                  <BrandMark size={30} />
                </View>
                <Text style={styles.brandText}>AdmissionTimes</Text>
              </View>
              <Text style={styles.authTitle}>Welcome back</Text>
              <Text style={styles.authSubtitle}>Sign in to continue your admissions journey.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Text style={styles.eyeButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to AdmissionTimes? </Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoIconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: '#111827',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  authTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  authSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    paddingRight: 64,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 11,
  },
  eyeButtonText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
  },
  link: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 14,
  },
})
