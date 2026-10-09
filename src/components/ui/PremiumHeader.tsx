import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'
import type { RootStackParamList } from '../../navigation/types'
import { useAuthStore } from '../../store/authStore'
import { colors, font, radius, spacing } from '../../theme'
import BrandMark from './BrandMark'

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

/** App header for the main student screens: brand, and an account menu with sign-out. */
export function PremiumHeader() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [menuOpen, setMenuOpen] = useState(false)

  const name = user?.display_name?.trim() || user?.email?.split('@')[0] || 'Student'

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.brand}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'StudentDashboard' }] })}
          accessibilityRole="button"
          accessibilityLabel="AdmissionTimes home"
        >
          <BrandMark size={30} />
          <View>
            <Text style={styles.title}>AdmissionTimes</Text>
            <Text style={styles.subtitle}>Student Portal</Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.avatar}
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Account menu"
        >
          <Text style={styles.avatarText}>{initials(name)}</Text>
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={[styles.avatar, styles.avatarLarge]}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
              <View style={styles.menuUser}>
                <Text style={styles.menuName} numberOfLines={1}>
                  {name}
                </Text>
                {user?.email ? (
                  <Text style={styles.menuEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false)
                void signOut()
              }}
              accessibilityRole="button"
            >
              <Feather name="log-out" size={16} color={colors.danger} />
              <Text style={styles.menuItemDanger}>Sign out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: font.body,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.25)',
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingHorizontal: spacing.lg,
  },
  menu: {
    width: 260,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuUser: {
    flex: 1,
    minWidth: 0,
  },
  menuName: {
    fontSize: font.title,
    fontWeight: '600',
    color: colors.text,
  },
  menuEmail: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  menuItemDanger: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.danger,
  },
})
