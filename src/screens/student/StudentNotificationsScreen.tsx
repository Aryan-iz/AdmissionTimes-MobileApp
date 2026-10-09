import { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore } from '../../store'
import type { NotificationKind, StudentNotification } from '../../domain/notification'
import { StudentScreen, EmptyState, Chip } from '../../components/ui'
import { showErrorToast } from '../../services/toast'
import { colors, font, radius, spacing } from '../../theme'

type Tab = 'all' | 'unread' | NotificationKind

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'deadline', label: 'Deadlines' },
  { value: 'admission', label: 'Program updates' },
  { value: 'system', label: 'Announcements' },
]

const KIND_ICON: Record<NotificationKind, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  deadline: { icon: 'clock', color: colors.warning, bg: colors.warningSoft },
  admission: { icon: 'book-open', color: colors.primary, bg: colors.primarySoft },
  system: { icon: 'volume-2', color: colors.violet, bg: colors.violetSoft },
}

export default function StudentNotificationsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const notifications = useStudentStore((state) => state.notifications)
  const refreshNotifications = useStudentStore((state) => state.refreshNotifications)
  const markRead = useStudentStore((state) => state.markNotificationRead)
  const markAllRead = useStudentStore((state) => state.markAllNotificationsRead)
  const [tab, setTab] = useState<Tab>('all')
  const [refreshing, setRefreshing] = useState(false)

  // Realtime and the app-level poll keep the list fresh; refresh again on focus.
  useFocusEffect(
    useCallback(() => {
      void refreshNotifications()
    }, [refreshNotifications])
  )

  const visible = useMemo(
    () =>
      notifications.filter((n) => (tab === 'all' ? true : tab === 'unread' ? !n.read : n.kind === tab)),
    [notifications, tab]
  )
  const unread = notifications.filter((n) => !n.read).length

  const refresh = async () => {
    setRefreshing(true)
    await refreshNotifications({ force: true })
    setRefreshing(false)
  }

  const open = async (notification: StudentNotification) => {
    if (!notification.read) {
      markRead(notification.id).catch(() => undefined)
    }
    if (notification.admissionId) navigation.navigate('ProgramDetail', { id: notification.admissionId })
  }

  const readAll = async () => {
    try {
      await markAllRead()
    } catch {
      showErrorToast('Could not mark as read', 'Check your connection and try again.')
    }
  }

  return (
    <StudentScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>Notifications</Text>
          <Text style={styles.summary}>{unread > 0 ? `${unread} unread` : 'You are all caught up'}</Text>
        </View>
        {unread > 0 ? (
          <Pressable style={styles.readAll} onPress={() => void readAll()} accessibilityRole="button" accessibilityLabel="Mark all read">
            <Feather name="check" size={14} color={colors.primary} />
            <Text style={styles.readAllText}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {TABS.map((option) => (
          <Chip key={option.value} label={option.label} active={tab === option.value} onPress={() => setTab(option.value)} />
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <EmptyState icon="bell" title={tab === 'unread' ? 'No unread notifications' : 'No notifications here'} />
      ) : (
        <View style={styles.list}>
          {visible.map((notification, index) => {
            const kind = KIND_ICON[notification.kind]
            return (
              <Pressable
                key={notification.id}
                onPress={() => void open(notification)}
                style={({ pressed }) => [
                  styles.item,
                  index > 0 && styles.itemBorder,
                  !notification.read && styles.itemUnread,
                  pressed && styles.itemPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${notification.read ? '' : 'Unread. '}${notification.title}`}
              >
                <View style={[styles.icon, { backgroundColor: kind.bg }]}>
                  <Feather name={kind.icon} size={16} color={kind.color} />
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !notification.read && styles.titleUnread]} numberOfLines={2}>
                      {notification.title}
                    </Text>
                    {!notification.read ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.message} numberOfLines={3}>
                    {notification.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.time}>{notification.timeAgo}</Text>
                    {notification.admissionId ? <Text style={styles.link}>View program</Text> : null}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      )}
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    fontSize: font.display,
    fontWeight: '700',
    color: colors.text,
  },
  summary: {
    fontSize: font.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  readAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  readAllText: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.primary,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  itemUnread: {
    backgroundColor: '#F8FAFF',
  },
  itemPressed: {
    backgroundColor: colors.bg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: font.body,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  titleUnread: {
    fontWeight: '700',
    color: colors.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  message: {
    fontSize: font.small,
    lineHeight: 18,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: font.caption,
    color: colors.textFaint,
  },
  link: {
    fontSize: font.caption,
    fontWeight: '700',
    color: colors.primary,
  },
})
