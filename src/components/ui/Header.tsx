import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'

interface HeaderProps {
  userName?: string
  userRole?: string
  notifications?: number
  onNotificationPress?: () => void
  onLogout?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'User',
  userRole = 'Student',
  notifications = 0,
  onNotificationPress,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

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

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { bg: '#3B82F6', border: '#2563EB' }
      case 'university':
        return { bg: '#8B5CF6', border: '#7C3AED' }
      case 'student':
        return { bg: '#10B981', border: '#059669' }
      default:
        return { bg: '#EC4899', border: '#DB2777' }
    }
  }

  const roleColors = getRoleColor(userRole)

  return (
    <View style={styles.header}>
      {/* Gradient overlay effect */}
      <View style={styles.gradientOverlay} />
      
      <View style={styles.headerContent}>
        {/* App Logo/Title - Clickable to navigate home */}
        <Pressable 
          style={styles.logoSection}
          onPress={() => navigation.navigate('StudentDashboard')}
        >
          <View style={styles.logoIconContainer}>
            <Text style={styles.logoIcon}>🎓</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>AdmissionTimes</Text>
            <Text style={styles.appSubtitle}>{userRole} Portal</Text>
          </View>
        </Pressable>

        <View style={styles.rightSection}>
          {/* Notification Button - Modern Bell Icon */}
          <Pressable
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <View style={styles.notificationIconContainer}>
              <View style={styles.bellIconWrapper}>
                <View style={styles.bellTop} />
                <View style={styles.bellBody} />
                <View style={styles.bellClapper} />
              </View>
              {notifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifications > 99 ? '99+' : notifications}</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Profile Section */}
          <Pressable
            style={styles.profileButton}
            onPress={() => setIsProfileOpen(!isProfileOpen)}
          >
            <View style={[styles.avatar, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.roleContainer}>
                <View style={[styles.roleDot, { backgroundColor: roleColors.bg }]} />
                <Text style={styles.userRole}>{userRole}</Text>
              </View>
            </View>
            <View style={[styles.chevronContainer, isProfileOpen && styles.chevronContainerOpen]}>
              <Text style={styles.chevron}>▼</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Profile Dropdown Modal */}
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
          <View style={styles.dropdown}>
            <View style={styles.dropdownHeader}>
              <View style={[styles.dropdownAvatar, { backgroundColor: roleColors.bg }]}>
                <Text style={styles.dropdownAvatarText}>{getInitials(userName)}</Text>
              </View>
              <View style={styles.dropdownUserInfo}>
                <Text style={styles.dropdownUserName}>{userName}</Text>
                <Text style={styles.dropdownUserRole}>{userRole}</Text>
              </View>
            </View>
            <View style={styles.dropdownDivider} />
            <Pressable 
              style={styles.dropdownItem} 
              onPress={() => {
                setIsProfileOpen(false)
                navigation.navigate('ProfileEdit')
              }}
            >
              <View style={styles.profileEditIconContainer}>
                <Text style={styles.profileEditIcon}>✏️</Text>
              </View>
              <Text style={styles.dropdownText}>Edit Profile</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </Pressable>
            <View style={styles.dropdownDivider} />
            <Pressable style={styles.dropdownItem} onPress={handleLogout}>
              <View style={styles.logoutIconContainer}>
                <Text style={styles.logoutIcon}>🚪</Text>
              </View>
              <Text style={styles.dropdownText}>Sign Out</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  logoIcon: {
    fontSize: 16,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 12,
  },
  notificationIconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bellIconWrapper: {
    width: 20,
    height: 20,
    position: 'relative',
    alignItems: 'center',
  },
  bellTop: {
    width: 4,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginBottom: 1,
  },
  bellBody: {
    width: 16,
    height: 14,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  bellClapper: {
    width: 5,
    height: 5,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileInfo: {
    flexDirection: 'column',
    marginRight: 6,
  },
  userName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  userRole: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },
  chevronContainer: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronContainerOpen: {
    backgroundColor: '#3B82F6',
  },
  chevron: {
    fontSize: 10,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    minWidth: 240,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownUserRole: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    fontSize: 18,
  },
  profileEditIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileEditIcon: {
    fontSize: 18,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
})
