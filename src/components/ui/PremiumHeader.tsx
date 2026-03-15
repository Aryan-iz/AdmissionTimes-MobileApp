import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal, Platform, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Feather } from '@expo/vector-icons'
import { theme } from '../../theme'
import BrandMark from './BrandMark'

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
        StatusBar.setBackgroundColor(theme.colors.surface)
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
        backgroundColor={theme.colors.surface}
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
              <BrandMark size={32} />
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
                <Feather name="bell" size={18} color={theme.colors.textMuted} />
                
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

              {/* Dashboard Option */}
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => {
                  setIsProfileOpen(false)
                  navigation.navigate('StudentDashboard')
                }}
              >
                <View style={styles.dropdownItemIcon}>
                  <Feather name="home" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.dropdownItemText}>Dashboard</Text>
              </Pressable>

              <View style={styles.dropdownDivider} />

              {/* Sign Out */}
              <Pressable style={styles.dropdownItemDanger} onPress={handleLogout}>
                <View style={styles.dropdownItemIconDanger}>
                  <Feather name="log-out" size={16} color={theme.colors.danger} />
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  
  // Left Section - Logo
  logoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  logoContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
    flexShrink: 1,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    flexShrink: 1,
  },

  // Right Section - Icons & Avatar
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
    flexShrink: 0,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // Bell Icon
  bellContainer: {
    position: 'relative',
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
    backgroundColor: theme.colors.info,
    opacity: 0.4,
  },
  cyanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.info,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,
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
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.bg,
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
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.text,
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
    backgroundColor: theme.colors.success,
  },
  dropdownUserRole: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
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
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dropdownItemDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.dangerBg,
  },
  dropdownItemIconDanger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemTextDanger: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.danger,
  },
})
