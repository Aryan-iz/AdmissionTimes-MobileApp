import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import type { RootStackParamList } from '../../navigation/types'
import { useUnreadCount } from '../../store/studentStore'
import { colors, font, spacing } from '../../theme'

export const TAB_BAR_HEIGHT = 60

type TabRoute = 'StudentDashboard' | 'StudentSearch' | 'StudentDeadlines' | 'StudentWatchlist' | 'StudentNotifications'

const TABS: Array<{ route: TabRoute; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { route: 'StudentDashboard', label: 'Home', icon: 'home' },
  { route: 'StudentSearch', label: 'Search', icon: 'search' },
  { route: 'StudentDeadlines', label: 'Deadlines', icon: 'calendar' },
  { route: 'StudentWatchlist', label: 'Saved', icon: 'bookmark' },
  { route: 'StudentNotifications', label: 'Alerts', icon: 'bell' },
]

export const isTabRoute = (name: string): name is TabRoute => TABS.some((tab) => tab.route === name)

/** Bottom navigation shown on the five main student screens. */
export default function StudentTabBar() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const unread = useUnreadCount()

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const active = route.name === tab.route
        return (
          <Pressable
            key={tab.route}
            style={styles.tab}
            // Replace instead of push so switching tabs does not grow the back stack.
            onPress={() => !active && navigation.reset({ index: 0, routes: [{ name: tab.route }] })}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.route === 'StudentNotifications' && unread > 0 ? `${tab.label}, ${unread} unread` : tab.label}
          >
            <View>
              <Feather name={tab.icon} size={20} color={active ? colors.primary : colors.textFaint} />
              {tab.route === 'StudentNotifications' && unread > 0 ? (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
  },
  label: {
    fontSize: font.caption,
    color: colors.textFaint,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
})
