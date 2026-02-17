import { useState, useMemo } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { StudentNotification } from '../../data/studentData'
import { useStudentData } from '../../contexts/StudentDataContext'
import { TitleHeader } from '../../components/ui'

type StudentNotificationsNavigationProp = StackNavigationProp<RootStackParamList, 'StudentNotifications'>

export default function StudentNotificationsScreen() {
  const navigation = useNavigation<StudentNotificationsNavigationProp>()
  const { notifications, markNotificationRead, markAllNotificationsRead, refreshNotifications } = useStudentData()
  const [activeTab, setActiveTab] = useState<'All' | 'alert' | 'system' | 'admission'>('All')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [inAppAlerts, setInAppAlerts] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

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
    <View style={styles.container}>
      <TitleHeader title="Notifications" />

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
              {(['All', 'Alerts', 'System', 'Admission'] as const).map((tab) => {
                const tabValue = tab === 'All' ? 'All' : tab === 'Alerts' ? 'alert' : tab === 'System' ? 'system' : 'admission'
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
                          {notification.type === 'alert' ? '🔔' : notification.type === 'system' ? '⚙️' : '🎓'}
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

          <View style={styles.preferencesCard}>
            <Text style={styles.preferencesTitle}>Notification Preferences</Text>
            <Text style={styles.preferencesSubtitle}>Manage how you receive alerts.</Text>

            <View style={styles.preferencesList}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Email Alerts</Text>
                  <Text style={styles.preferenceDescription}>Get important updates in your inbox.</Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={setEmailAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={emailAlerts ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>In-App Alerts</Text>
                  <Text style={styles.preferenceDescription}>Push notifications on this device.</Text>
                </View>
                <Switch
                  value={inAppAlerts}
                  onValueChange={setInAppAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={inAppAlerts ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Weekly Digest</Text>
                  <Text style={styles.preferenceDescription}>A summary of your week's activity.</Text>
                </View>
                <Switch
                  value={weeklyDigest}
                  onValueChange={setWeeklyDigest}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={weeklyDigest ? '#2563EB' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
