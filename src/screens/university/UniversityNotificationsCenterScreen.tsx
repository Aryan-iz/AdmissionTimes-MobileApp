import { useState } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Switch } from 'react-native'
import { TitleHeader } from '../../components/ui'

type Notification = {
  id: string
  title: string
  message: string
  date: string
  read: boolean
  type: 'info' | 'warning' | 'success' | 'error'
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'Admission Verified', message: 'Your CS program admission has been verified by Admin_01', date: '2025-11-06 10:30', read: false, type: 'success' },
  { id: '2', title: 'Verification Pending', message: 'MBA program admission pending verification', date: '2025-11-05 14:20', read: false, type: 'warning' },
  { id: '3', title: 'Changes Required', message: 'Requested changes in Engineering admission', date: '2025-11-04 09:15', read: true, type: 'info' },
  { id: '4', title: 'Admission Rejected', message: 'Physics program admission rejected due to incomplete information', date: '2025-11-03 16:45', read: true, type: 'error' },
  { id: '5', title: 'New Inquiry', message: 'Student inquiry about CS program deadline', date: '2025-11-02 11:20', read: true, type: 'info' },
]

const getTypeColor = (type: Notification['type']) => {
  switch (type) {
    case 'success': return { bg: '#D1FAE5', text: '#065F46', icon: '✓' }
    case 'warning': return { bg: '#FEF3C7', text: '#92400E', icon: '⚠' }
    case 'error': return { bg: '#FEE2E2', text: '#991B1B', icon: '✕' }
    default: return { bg: '#DBEAFE', text: '#1E40AF', icon: 'ℹ' }
  }
}

export default function UniversityNotificationsCenterScreen() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(false)
  const [verificationAlerts, setVerificationAlerts] = useState(true)

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <View style={styles.container}>
      <TitleHeader title="Notifications" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerBar}>
            <View>
              <Text style={styles.subtitle}>Stay updated with verification status</Text>
              <Text style={styles.unreadCount}>{unreadCount} unread notifications</Text>
            </View>
            <Pressable style={styles.markAllButton} onPress={handleMarkAllRead}>
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </Pressable>
          </View>

          {/* Notifications List */}
          <View style={styles.notificationsContainer}>
            {notifications.map((notification) => {
              const typeColors = getTypeColor(notification.type)
              return (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread
                  ]}
                  onPress={() => handleMarkRead(notification.id)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: typeColors.bg }]}>
                    <Text style={[styles.iconText, { color: typeColors.text }]}>
                      {typeColors.icon}
                    </Text>
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationDate}>{notification.date}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {/* Notification Preferences */}
          <View style={styles.preferencesCard}>
            <Text style={styles.preferencesTitle}>Notification Preferences</Text>
            <Text style={styles.preferencesSubtitle}>Manage how you receive alerts</Text>

            <View style={styles.preferencesList}>
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Email Alerts</Text>
                  <Text style={styles.preferenceDescription}>Receive verification updates via email</Text>
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
                  <Text style={styles.preferenceLabel}>SMS Alerts</Text>
                  <Text style={styles.preferenceDescription}>Get critical updates via SMS</Text>
                </View>
                <Switch
                  value={smsAlerts}
                  onValueChange={setSmsAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={smsAlerts ? '#2563EB' : '#F3F4F6'}
                />
              </View>

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Verification Status Alerts</Text>
                  <Text style={styles.preferenceDescription}>Notify when admission status changes</Text>
                </View>
                <Switch
                  value={verificationAlerts}
                  onValueChange={setVerificationAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={verificationAlerts ? '#2563EB' : '#F3F4F6'}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  notificationsContainer: {
    marginBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationCardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  notificationDate: {
    fontSize: 11,
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
    marginBottom: 20,
  },
  preferencesList: {
    marginTop: 0,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
