import { useState, useMemo, useEffect } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { StudentNotification } from '../../data/studentData'
import { useStudentStore } from '../../store'
import { TitleHeader, CustomLoader } from '../../components/ui'

type StudentNotificationsNavigationProp = StackNavigationProp<RootStackParamList, 'StudentNotifications'>

export default function StudentNotificationsScreen() {
  const navigation = useNavigation<StudentNotificationsNavigationProp>()
  const notifications = useStudentStore(state => state.notifications)
  const markNotificationRead = useStudentStore(state => state.markNotificationRead)
  const markAllNotificationsRead = useStudentStore(state => state.markAllNotificationsRead)
  const refreshNotifications = useStudentStore(state => state.refreshNotifications)
  const [activeTab, setActiveTab] = useState<'All' | 'alert' | 'admission'>('All')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'All') {
      return notifications
    }
    return notifications.filter(n => n.type === activeTab)
  }, [notifications, activeTab])

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
  }

  const handleMarkRead = (id: string) => {
    markNotificationRead(id)
  }

  const handleNotificationClick = (notification: StudentNotification) => {
    handleMarkRead(notification.id)
    if (notification.admissionId) {
      navigation.navigate('ProgramDetail', { id: notification.admissionId })
    }
  }

  const handleRefresh = () => {
    refreshNotifications()
  }

  const getIconPath = (iconPath: string): string => {
    // Return the icon path as-is (SVG path data)
    return iconPath
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TitleHeader title="Notifications" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomLoader size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
          <Text style={styles.subtitle}>
            Stay updated with admission changes, deadlines, and system alerts.
          </Text>

          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleMarkAllRead}>
              <Text style={styles.actionButtonIcon}>✓</Text>
              <Text style={styles.actionButtonText}>Mark All as Read</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleRefresh}>
              <Text style={styles.actionButtonIcon}>↻</Text>
              <Text style={styles.actionButtonText}>Refresh</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.tabContainer}>
              {(['All', 'Alerts', 'Admission'] as const).map((tab) => {
                const tabValue = tab === 'All' ? 'All' : tab === 'Alerts' ? 'alert' : 'admission'
                const isActive = activeTab === tabValue
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tabValue)}
                    style={[styles.tab, isActive && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.notificationsList}>
              {filteredNotifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No notifications found.</Text>
                </View>
              ) : (
                filteredNotifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationClick(notification)}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.notificationItemUnread
                    ]}
                  >
                    <View style={styles.notificationContent}>
                      <View style={[styles.iconContainer, { backgroundColor: `${notification.iconColor}20` }]}>
                        <Text style={[styles.iconEmoji, { color: notification.iconColor }]}>
                          {notification.type === 'alert' ? '🔔' : '🎓'}
                        </Text>
                      </View>
                      <View style={styles.notificationText}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle} numberOfLines={2}>
                            {notification.title}
                          </Text>
                          {!notification.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notificationDescription} numberOfLines={2}>
                          {notification.description}
                        </Text>
                        <Text style={styles.notificationTime}>{notification.timeAgo}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
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
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
  },
  notificationsList: {
    marginTop: 0,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  notificationItemUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconEmoji: {
    fontSize: 20,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  preferencesList: {
    marginTop: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
})
