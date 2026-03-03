import { useState, useMemo } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Header } from '../../components/ui'
import { adminNotifications, type NotificationType } from '../../data/adminData'
import { useAuthStore } from '../../store'

export default function AdminNotificationsCenterScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)

  const [activeTab, setActiveTab] = useState<NotificationType | 'All'>('All')
  const [unreadOnly, setUnreadOnly] = useState(false)

  const filteredNotifications = useMemo(() => {
    let filtered = [...adminNotifications]

    if (activeTab !== 'All') {
      filtered = filtered.filter((notif) => notif.type === activeTab)
    }

    if (unreadOnly) {
      filtered = filtered.filter((notif) => notif.unread)
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return filtered
  }, [activeTab, unreadOnly])

  const unreadCount = useMemo(() => {
    return adminNotifications.filter((n) => n.unread).length
  }, [])

  const handleMarkAllAsRead = () => {
    Alert.alert('Success', 'All notifications marked as read')
  }

  const handleMarkAsRead = (id: number) => {
    Alert.alert('Success', 'Notification marked as read')
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'verification_update':
        return '✅'
      case 'university_upload':
        return '📄'
      case 'system_alert':
        return '⚠️'
      case 'scraper_alert':
        return '🌐'
      default:
        return '🔔'
    }
  }

  const getNotificationIconColor = (type: NotificationType) => {
    switch (type) {
      case 'verification_update':
        return { bg: '#D1FAE5', text: '#10B981' }
      case 'university_upload':
        return { bg: '#DBEAFE', text: '#2563EB' }
      case 'system_alert':
        return { bg: '#FEF3C7', text: '#F59E0B' }
      case 'scraper_alert':
        return { bg: '#EDE9FE', text: '#8B5CF6' }
      default:
        return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  const getTypeLabel = (type: NotificationType) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name || 'Admin User'}
        userRole="Admin"
        notifications={unreadCount}
        onLogout={signOut}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications Center</Text>
            <Text style={styles.subtitle}>System alerts and verification updates</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {(['All', 'verification_update', 'university_upload', 'system_alert', 'scraper_alert'] as const).map((tab) => {
            const isActive = activeTab === tab
            const count = tab === 'All' 
              ? adminNotifications.length 
              : adminNotifications.filter(n => n.type === tab).length
            
            return (
              <Pressable
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab === 'All' ? 'All' : getTypeLabel(tab as NotificationType)} ({count})
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Unread Filter */}
        <Pressable 
          style={styles.unreadToggle} 
          onPress={() => setUnreadOnly(!unreadOnly)}
        >
          <View style={[styles.checkbox, unreadOnly && styles.checkboxChecked]}>
            {unreadOnly && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.unreadToggleText}>Show unread only ({unreadCount})</Text>
        </Pressable>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <Text style={styles.resultsCount}>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </Text>
          
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => {
              const iconColors = getNotificationIconColor(notification.type)
              return (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    notification.unread && styles.notificationCardUnread
                  ]}
                  onPress={() => !notification.unread && handleMarkAsRead(notification.id)}
                >
                  <View style={styles.notificationHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColors.bg }]}>
                      <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.notificationTop}>
                        <View style={[styles.typeBadge, { backgroundColor: iconColors.bg }]}>
                          <Text style={[styles.typeBadgeText, { color: iconColors.text }]}>
                            {getTypeLabel(notification.type)}
                          </Text>
                        </View>
                        {notification.unread && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.timestamp}>{notification.timestamp}</Text>
                    </View>
                  </View>
                </Pressable>
              )
            })
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2563EB',
  },
  markAllButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabsScroll: {
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#004AAD',
    borderColor: '#004AAD',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  unreadToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unreadToggleText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  notificationsSection: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  notificationHeader: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  notificationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
})
