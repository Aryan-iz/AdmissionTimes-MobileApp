import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Header } from '../../components/ui'
import {
  analyticsEvents,
  getUniqueAnalyticsUsers,
  getUniqueEventTypes,
  type AnalyticsEventType,
  type AnalyticsEvent,
} from '../../data/adminData'
import { useAuthStore } from '../../store'

export default function AdminAnalyticsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  
  const [userFilter, setUserFilter] = useState<string>('All')
  const [eventTypeFilter, setEventTypeFilter] = useState<AnalyticsEventType | 'All'>('All')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Student' | 'UniversityRep' | 'Admin'>('All')

  const users = getUniqueAnalyticsUsers()
  const eventTypes = getUniqueEventTypes()

  const filteredEvents = useMemo(() => {
    let filtered = [...analyticsEvents]

    if (userFilter !== 'All') {
      filtered = filtered.filter((event) => event.userName === userFilter)
    }

    if (eventTypeFilter !== 'All') {
      filtered = filtered.filter((event) => event.eventType === eventTypeFilter)
    }

    if (roleFilter !== 'All') {
      filtered = filtered.filter((event) => event.userRole === roleFilter)
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return filtered
  }, [userFilter, eventTypeFilter, roleFilter])

  const handleResetFilters = () => {
    setUserFilter('All')
    setEventTypeFilter('All')
    setRoleFilter('All')
  }

  const getEventTypeColor = (type: AnalyticsEventType) => {
    switch (type) {
      case 'Login':
        return { bg: '#DBEAFE', text: '#2563EB' }
      case 'Logout':
        return { bg: '#F3F4F6', text: '#6B7280' }
      case 'View Admission':
        return { bg: '#FEF3C7', text: '#F59E0B' }
      case 'Save Admission':
        return { bg: '#D1FAE5', text: '#10B981' }
      case 'Compare':
        return { bg: '#FCE7F3', text: '#EC4899' }
      case 'Export Data':
        return { bg: '#E9D5FF', text: '#9333EA' }
      case 'Upload Admission':
        return { bg: '#DBEAFE', text: '#2563EB' }
      case 'Edit Admission':
        return { bg: '#FEF3C7', text: '#F59E0B' }
      case 'Admin Action':
        return { bg: '#FEE2E2', text: '#EF4444' }
      default:
        return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return { bg: '#DBEAFE', text: '#2563EB' }
      case 'UniversityRep':
        return { bg: '#FEF3C7', text: '#F59E0B' }
      case 'Student':
        return { bg: '#D1FAE5', text: '#10B981' }
      default:
        return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name || 'Admin User'}
        userRole="Admin"
        notifications={0}
        onLogout={signOut}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track user activity and system usage patterns</Text>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterLabel}>Event Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', ...eventTypes].map((type) => {
              const isActive = eventTypeFilter === type
              return (
                <Pressable
                  key={type}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setEventTypeFilter(type as AnalyticsEventType | 'All')}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {type.replace('_', ' ')}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 16 }]}>User Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {(['All', 'Student', 'UniversityRep', 'Admin'] as const).map((role) => {
              const isActive = roleFilter === role
              return (
                <Pressable
                  key={role}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setRoleFilter(role)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {role === 'UniversityRep' ? 'University' : role}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 16 }]}>User</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', ...users].map((userName) => {
              const isActive = userFilter === userName
              return (
                <Pressable
                  key={userName}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setUserFilter(userName)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]} numberOfLines={1}>
                    {userName}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{filteredEvents.length}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{new Set(filteredEvents.map(e => e.userName)).size}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{new Set(filteredEvents.map(e => e.eventType)).size}</Text>
            <Text style={styles.statLabel}>Event Types</Text>
          </View>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <Text style={styles.resultsCount}>{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}</Text>
          
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No analytics events found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredEvents.map((event) => {
              const typeColors = getEventTypeColor(event.eventType)
              const roleColors = getRoleColor(event.userRole)
              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={[styles.eventTypeBadge, { backgroundColor: typeColors.bg }]}>
                      <Text style={[styles.eventTypeBadgeText, { color: typeColors.text }]}>
                        {event.eventType.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{event.timestamp}</Text>
                  </View>
                  <Text style={styles.eventUser}>{event.userName}</Text>
                  <View style={styles.eventMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: roleColors.text }]}>
                        {event.userRole === 'UniversityRep' ? 'University' : event.userRole}
                      </Text>
                    </View>
                    <Text style={styles.eventId}>ID: {event.id}</Text>
                  </View>
                  <Text style={styles.metadataText}>{event.details}</Text>
                </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    maxWidth: 140,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  eventsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  eventUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventId: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  metadata: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 6,
    marginTop: 4,
  },
  metadataTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 10,
    color: '#374151',
    fontFamily: 'monospace',
  },
})
