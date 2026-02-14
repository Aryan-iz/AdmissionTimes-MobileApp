import { useState } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert, Switch, Modal } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuth } from '../../contexts/AuthContext'
import { TitleHeader } from '../../components/ui'

type UniversitySettingsNavigationProp = StackNavigationProp<RootStackParamList, 'UniversitySettings'>

export default function UniversitySettingsScreen() {
  const navigation = useNavigation<UniversitySettingsNavigationProp>()
  const { logout } = useAuth()
  const [universityName, setUniversityName] = useState('National University of Sciences & Technology')
  const [contactEmail, setContactEmail] = useState('admissions@nust.edu.pk')
  const [contactPhone, setContactPhone] = useState('+92-51-9085-5555')
  const [website, setWebsite] = useState('https://www.nust.edu.pk')
  const [address, setAddress] = useState('H-12, Islamabad, Pakistan')
  const [autoPublish, setAutoPublish] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!')
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handlePasswordSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match')
      return
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long')
      return
    }

    // Simulate password change
    Alert.alert('Success', 'Password changed successfully!', [
      { 
        text: 'OK', 
        onPress: () => {
          setShowPasswordModal(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        }
      }
    ])
  }

  const handleCancelPasswordChange = () => {
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    )
  }

  return (
    <View style={styles.container}>
      <TitleHeader title="Settings" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Manage your university profile and preferences</Text>

          {/* University Profile */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>University Profile</Text>
            
            <Text style={styles.label}>University Name</Text>
            <TextInput
              style={styles.input}
              value={universityName}
              onChangeText={setUniversityName}
              placeholder="Enter university name"
            />

            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="Enter contact email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="Enter contact phone"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter university address"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </Pressable>
          </View>

          {/* Admission Settings */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Admission Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Publish Admissions</Text>
                <Text style={styles.settingDescription}>Automatically publish new admissions without manual approval</Text>
              </View>
              <Switch
                value={autoPublish}
                onValueChange={setAutoPublish}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={autoPublish ? '#2563EB' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>Receive email alerts for verification status</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={emailNotifications ? '#2563EB' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Account Security */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Security</Text>
            
            <Pressable style={styles.secondaryButton} onPress={handleChangePassword}>
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </Pressable>
          </View>

          {/* Danger Zone */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Danger Zone</Text>
            
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelPasswordChange}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelPasswordChange}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={handleCancelPasswordChange} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelButton} onPress={handleCancelPasswordChange}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSubmitButton} onPress={handlePasswordSubmit}>
                <Text style={styles.modalSubmitButtonText}>Change Password</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalSubmitButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
})
