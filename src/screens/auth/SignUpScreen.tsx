/**
 * SignUpScreen - User Registration Screen
 * 
 * Allows new users to create an account with the following roles:
 * - Student
 * - University Representative
 * - Admin
 * 
 * Matches web frontend SignUp.tsx exactly
 */

import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuthStore } from '../../store'
import { CustomLoader } from '../../components/ui'

export default function SignUpScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const signUp = useAuthStore(state => state.signUp)
  const isLoading = useAuthStore(state => state.isLoading)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'student' as 'student' | 'university' | 'admin',
    display_name: '',
    university_id: '',
  })

  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
    user_type?: string
    display_name?: string
    university_id?: string
  }>({})

  const [apiError, setApiError] = useState<string>('')

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    const emailValue = formData.email.trim()

    if (!emailValue) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.user_type) {
      newErrors.user_type = 'Please select an account type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')

    if (!validate()) {
      return
    }

    try {
      console.log('[SignUp] Starting signup with:', { 
        email: formData.email.trim(), 
        user_type: formData.user_type 
      })

      await signUp(
        {
          email: formData.email.trim(),
          password: formData.password,
          user_type: formData.user_type,
          display_name: formData.display_name || formData.email.split('@')[0],
          university_id: formData.university_id || undefined,
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Account Created!',
              'Your account has been created successfully. Please sign in to continue.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Login'),
                },
              ]
            )
          },
          onError: (errorMessage: string) => {
            console.error('[SignUp] Error:', errorMessage)
            setApiError(errorMessage)
          },
        }
      )

      console.log('[SignUp] Signup successful!')
    } catch (error: any) {
      console.error('[SignUp] Error occurred:', error)

      const errorMessage = 
        error?.message || 
        'Failed to create account. Please try again.'

      console.error('[SignUp] Error message:', errorMessage)
      setApiError(errorMessage)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>AdmissionTimes</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started with AdmissionTimes.</Text>
            </View>

            {/* API Error Display */}
            {apiError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>Error: {apiError}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              {/* Account Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Type *</Text>
                <View style={[styles.pickerContainer, errors.user_type && styles.inputError]}>
                  <Pressable 
                    style={styles.picker}
                    onPress={() => {
                      // In a real app, use a proper picker modal
                      Alert.alert(
                        'Account Type',
                        'Select your account type',
                        [
                          { text: 'Student', onPress: () => handleChange('user_type', 'student') },
                          { text: 'University Representative', onPress: () => handleChange('user_type', 'university') },
                          { text: 'Admin', onPress: () => handleChange('user_type', 'admin') },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      )
                    }}
                    disabled={isLoading}
                  >
                    <Text style={styles.pickerText}>
                      {formData.user_type === 'student'
                        ? 'Student'
                        : formData.user_type === 'university'
                        ? 'University Representative'
                        : 'Admin'}
                    </Text>
                  </Pressable>
                </View>
                {errors.user_type && <Text style={styles.errorLabel}>{errors.user_type}</Text>}
              </View>

              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.display_name}
                  onChangeText={(value) => handleChange('display_name', value)}
                  placeholder="Your name (optional)"
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(value) => handleChange('email', value)}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.email && <Text style={styles.errorLabel}>{errors.email}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.password && <Text style={styles.errorLabel}>{errors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange('confirmPassword', value)}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  editable={!isLoading}
                />
                {errors.confirmPassword && <Text style={styles.errorLabel}>{errors.confirmPassword}</Text>}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <CustomLoader size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </Pressable>
            </View>

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
  pickerContainer: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
})
