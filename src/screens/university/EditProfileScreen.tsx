/**
 * EditProfileScreen - University Profile Editor
 * 
 * Allows university representatives to edit their profile information:
 * - Account information (display name, email)
 * - University details (name, city, country, website, description)
 * - Contact information
 * 
 * Matches web frontend EditProfile.tsx exactly
 */

import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuthStore } from '../../store'
import { TitleHeader, CustomLoader } from '../../components/ui'

export default function EditProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const refreshUser = useAuthStore(state => state.checkAuth)

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
  })

  const [universityData, setUniversityData] = useState({
    name: '',
    city: '',
    country: '',
    website: '',
    logoUrl: '',
    description: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  })

  const [isSaving, setIsSaving] = useState(false)

  // Load profile data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.name || '',
        email: user.email || '',
      })

      // In a real app, fetch university profile from backend
      // For now, use mock data
      setUniversityData({
        name: 'Sample University',
        city: 'Islamabad',
        country: 'Pakistan',
        website: 'https://example.edu',
        logoUrl: '',
        description: 'A leading educational institution...',
        address: 'Sample Address, Islamabad',
        contactName: 'Admin Contact',
        contactEmail: 'contact@example.edu',
        contactPhone: '+92 51 1234567',
      })
    }
  }, [user])

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleUniversityChange = (field: string, value: string) => {
    setUniversityData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    // Validate required fields
    if (!profileData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required')
      return
    }

    if (!universityData.name.trim()) {
      Alert.alert('Error', 'University name is required')
      return
    }

    setIsSaving(true)

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000))

      // In a real app, make API calls here
      // await updateUserProfile(profileData)
      // await updateUniversityProfile(universityData)

      await refreshUser()

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('UniversitySettings'),
          },
        ]
      )
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      Alert.alert('Error', error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigation.navigate('UniversitySettings')
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TitleHeader title="Edit Profile" onBack={handleCancel} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>Update your university profile information</Text>

          {/* Account Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Display Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={profileData.displayName}
                onChangeText={value => handleProfileChange('displayName', value)}
                placeholder="Enter your display name"
                placeholderTextColor="#9CA3AF"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileData.email}
                editable={false}
              />
              <Text style={styles.helpText}>
                Email cannot be changed here. Contact support if needed.
              </Text>
            </View>
          </View>

          {/* University Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>University Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                University Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={universityData.name}
                onChangeText={value => handleUniversityChange('name', value)}
                placeholder="Enter university name"
                placeholderTextColor="#9CA3AF"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={universityData.city}
                  onChangeText={value => handleUniversityChange('city', value)}
                  placeholder="Enter city"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={universityData.country}
                  onChangeText={value => handleUniversityChange('country', value)}
                  placeholder="Enter country"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={universityData.website}
                onChangeText={value => handleUniversityChange('website', value)}
                placeholder="https://example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                autoCapitalize="none"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={universityData.description}
                onChangeText={value => handleUniversityChange('description', value)}
                placeholder="Brief description about your university..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={universityData.address}
                onChangeText={value => handleUniversityChange('address', value)}
                placeholder="Full address..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                editable={!isSaving}
              />
            </View>
          </View>

          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={universityData.contactName}
                onChangeText={value => handleUniversityChange('contactName', value)}
                placeholder="Contact person name"
                placeholderTextColor="#9CA3AF"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.label}>Contact Email</Text>
                <TextInput
                  style={styles.input}
                  value={universityData.contactEmail}
                  onChangeText={value => handleUniversityChange('contactEmail', value)}
                  placeholder="contact@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputHalf}>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={universityData.contactPhone}
                  onChangeText={value => handleUniversityChange('contactPhone', value)}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                (isSaving || !universityData.name || !profileData.displayName) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving || !universityData.name || !profileData.displayName}
            >
              {isSaving ? (
                <View style={styles.saveButtonContent}>
                  <CustomLoader size={16} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
})
