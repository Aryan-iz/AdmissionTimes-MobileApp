import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Modal, Platform, Image, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'

interface PremiumHeaderProps {
  userName?: string
  userRole?: string
  notifications?: number
  onNotificationPress?: () => void
  onLogout?: () => void
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({
  userName = 'User',
  userRole = 'Student',
  notifications = 0,
  onNotificationPress,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  // Force status bar configuration on every screen focus
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('dark-content')
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#FFFFFF')
        StatusBar.setTranslucent(false)
      }
    }, [])
  )

  const handleLogout = () => {
    setIsProfileOpen(false)
    if (onLogout) {
      onLogout()
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SafeAreaView style={styles.headerWrapper} edges={['top']}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View style={styles.gradientContainer}>
        
        <View style={styles.headerContent}>
          {/* Left Section - Logo & Branding */}
          <Pressable 
            style={styles.logoSection}
            onPress={() => navigation.navigate('StudentDashboard')}
          >
            {/* AT Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            
            {/* App Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>AdmissionTimes</Text>
              <Text style={styles.appSubtitle}>{userRole} Portal</Text>
            </View>
          </Pressable>

          {/* Right Section - Actions & Profile */}
          <View style={styles.rightSection}>
            {/* Notification Bell */}
            <Pressable
              style={styles.iconButton}
              onPress={onNotificationPress || (() => navigation.navigate('StudentNotifications'))}
            >
              <View style={styles.bellContainer}>
                {/* Bell Icon */}
                <View style={styles.bellIconWrapper}>
                  <View style={styles.bellTop} />
                  <View style={styles.bellBody} />
                </View>
                
                {/* Glowing cyan status dot */}
                {notifications > 0 && (
                  <View style={styles.cyanDotContainer}>
                    <View style={styles.cyanDotGlow} />
                    <View style={styles.cyanDot} />
                  </View>
                )}
              </View>
            </Pressable>

            {/* User Avatar */}
            <Pressable
              style={styles.avatarButton}
              onPress={() => setIsProfileOpen(!isProfileOpen)}
            >
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <View style={styles.avatarGradient}>
                    <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Premium Profile Dropdown Modal */}
      <Modal
        visible={isProfileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProfileOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsProfileOpen(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdown}>
              {/* Profile Header */}
              <View style={styles.dropdownHeader}>
                <View style={styles.dropdownAvatarRing}>
                  <View style={styles.dropdownAvatar}>
                    <View style={styles.dropdownAvatarGradient}>
                      <Text style={styles.dropdownAvatarText}>{getInitials(userName)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.dropdownUserInfo}>
                  <Text style={styles.dropdownUserName}>{userName}</Text>
                  <View style={styles.dropdownRoleContainer}>
                    <View style={styles.dropdownRoleDot} />
                    <Text style={styles.dropdownUserRole}>{userRole}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dropdownDivider} />

              {/* Edit Profile Option */}
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => {
                  setIsProfileOpen(false)
                  navigation.navigate('ProfileEdit')
                }}
              >
                <View style={styles.dropdownItemIcon}>
                  <Text style={styles.dropdownItemIconText}>✏️</Text>
                </View>
                <Text style={styles.dropdownItemText}>Edit Profile</Text>
              </Pressable>

              <View style={styles.dropdownDivider} />

              {/* Sign Out */}
              <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                <View style={styles.dropdownItemIconDanger}>
                  <Text style={styles.dropdownItemIconTextDanger}>⎋</Text>
                </View>
                <Text style={styles.dropdownItemTextDanger}>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientContainer: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  
  // Left Section - Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  titleContainer: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
  },

  // Right Section - Icons & Avatar
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Bell Icon
  bellContainer: {
    position: 'relative',
  },
  bellIconWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  bellTop: {
    position: 'absolute',
    top: 0,
    left: 7,
    width: 6,
    height: 3,
    backgroundColor: '#6B7280',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bellBody: {
    position: 'absolute',
    top: 3,
    left: 2,
    width: 16,
    height: 14,
    backgroundColor: '#6B7280',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  cyanDotContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  cyanDotGlow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#06B6D4',
    opacity: 0.4,
  },
  cyanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Avatar
  avatarButton: {
    marginLeft: 4,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 60,
    right: 16,
    width: 280,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  dropdownAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dropdownAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  dropdownAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  dropdownAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dropdownRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownRoleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dropdownUserRole: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dropdownItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconText: {
    fontSize: 16,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#FEF2F2',
  },
  dropdownItemIconDanger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconTextDanger: {
    fontSize: 16,
    color: '#DC2626',
  },
  dropdownItemTextDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
})
