import { useMemo, useState, useEffect } from 'react'
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator.tsx'
import { useAuthStore, useStudentStore } from '../../store'
import { calculateDaysRemaining, getStatusColor, isAdmissionActive, type StudentAdmission } from '../../data/studentData'
import { PremiumHeader, CustomLoader } from '../../components/ui'
import { AiAssistantButton, ChatModal } from '../../components/ai'
import { NewAdmissionSlider } from '../../components/student'
import { useAi } from '../../contexts/AiContext'

export default function StudentDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const admissions = useStudentStore(state => state.admissions)
  const savedAdmissionsIds = useStudentStore(state => state.savedAdmissions)
  const notifications = useStudentStore(state => state.notifications)
  const loading = useStudentStore(state => state.loading)
  const fetchDashboardData = useStudentStore(state => state.fetchDashboardData)
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const signOut = useAuthStore(state => state.signOut)
  const { setContext } = useAi()
  
  // Compute saved admissions from IDs
  const savedAdmissions = useMemo(
    () => admissions.filter(a => savedAdmissionsIds.includes(a.id)),
    [admissions, savedAdmissionsIds]
  )
  const [isLoading, setIsLoading] = useState(true)

  // Fetch dashboard data when user is authenticated
  useEffect(() => {
    console.log('📊 [StudentDashboard] useEffect triggered')
    console.log('   - User:', user?.name)
    console.log('   - Authenticated:', isAuthenticated)
    console.log('   - Loading:', loading)
    
    if (isAuthenticated && user) {
      console.log('✅ [StudentDashboard] User authenticated, fetching dashboard data...')
      fetchDashboardData().then(() => {
        console.log('✅ [StudentDashboard] Dashboard data fetch completed')
        setIsLoading(false)
      }).catch((err) => {
        console.error('❌ [StudentDashboard] Dashboard data fetch failed:', err)
        setIsLoading(false)
      })
    } else {
      console.log('⚠️ [StudentDashboard] User not authenticated, skipping fetch')
      setIsLoading(false)
    }
  }, [isAuthenticated, user, fetchDashboardData])

  // Set AI context
  useMemo(() => {
    setContext('Student Dashboard')
  }, [])

  const stats = useMemo(() => {
    // Active admissions: current date is between start and end date
    const activeAdmissions = admissions.filter(isAdmissionActive)
    
    const upcoming = activeAdmissions.filter((a) => {
      const daysRemaining = calculateDaysRemaining(a.deadline)
      return daysRemaining >= 0 && daysRemaining <= 7
    }).length

    const urgent = activeAdmissions.filter((a) => {
      const daysRemaining = calculateDaysRemaining(a.deadline)
      return daysRemaining >= 0 && daysRemaining <= 7
    }).length

    return {
      active: activeAdmissions.length,
      saved: savedAdmissions.length,
      upcoming,
      urgent,
    }
  }, [admissions, savedAdmissions])

  const upcomingDeadlines = useMemo(() => {
    return admissions
      .filter((a) => {
        const daysRemaining = calculateDaysRemaining(a.deadline)
        // Only show deadlines for active admissions that are upcoming (not past)
        return isAdmissionActive(a) && daysRemaining >= 0 && daysRemaining <= 30
      })
      .map((a) => ({ ...a, daysRemaining: calculateDaysRemaining(a.deadline) }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3)
  }, [admissions])

  const recentActivities = useMemo(() => {
    const activities: Array<{ action: string; time: string }> = []

    // notifications already appear sorted newest-first in the context clone
    notifications.slice(0, 2).forEach((n) => {
      activities.push({ action: n.title, time: n.timeAgo })
    })

    if (savedAdmissions.length > 0) {
      activities.push({
        action: `${savedAdmissions.length} program${savedAdmissions.length > 1 ? 's' : ''} saved to watchlist`,
        time: 'Recently',
      })
    }

    const activeAlerts = admissions.filter((a) => a.alertEnabled).length
    if (activeAlerts > 0) {
      activities.push({
        action: `${activeAlerts} deadline reminder${activeAlerts > 1 ? 's' : ''} active`,
        time: 'Recently',
      })
    }

    return activities.slice(0, 3)
  }, [notifications, savedAdmissions, admissions])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
      <PremiumHeader
        userName={user?.name || 'Aryan'}
        userRole="Student"
        notifications={notifications.filter(n => !n.read).length}
        onNotificationPress={() => navigation.navigate('StudentNotifications')}
        onLogout={signOut}
      />
      
      {/* New Admission Slider - Fetches data from store automatically */}
      {!isLoading && <NewAdmissionSlider />}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomLoader size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Welcome back, {user?.name || 'Aryan'}!</Text>
          <Text style={styles.heroSubtitle}>
            Track your admission progress and discover new opportunities.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable
              style={styles.heroPrimaryButton}
              onPress={() => navigation.navigate('StudentSearch')}
            >
              <Text style={styles.heroPrimaryButtonText}>🔍 Search Admissions</Text>
            </Pressable>
            <Pressable
              style={styles.heroSecondaryButton}
              onPress={() => navigation.navigate('StudentDeadlines')}
            >
              <Text style={styles.heroSecondaryButtonText}>View Deadlines</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Active Admissions */}
          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentSearch')}
          >
            <View style={[styles.statsIcon, { backgroundColor: '#E0E7FF' }]}>
              <Text style={{ fontSize: 20 }}>🎓</Text>
            </View>
            <Text style={styles.statsLabel}>Active Admissions</Text>
            <Text style={styles.statsValue}>{stats.active}</Text>
            <Text style={styles.statsSubtext}>Open & Closing Soon</Text>
          </Pressable>

          {/* Saved Programs */}
          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentWatchlist')}
          >
            <View style={[styles.statsIcon, { backgroundColor: '#E0E7FF' }]}>
              <Text style={{ fontSize: 20 }}>📑</Text>
            </View>
            <Text style={styles.statsLabel}>Saved Programs</Text>
            <Text style={styles.statsValue}>{stats.saved}</Text>
            <Text style={styles.statsSubtext}>View watchlist</Text>
          </Pressable>

          {/* Upcoming Deadlines */}
          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentDeadlines')}
          >
            <View style={[styles.statsIcon, { backgroundColor: stats.urgent > 0 ? '#FEE2E2' : '#FEF3C7' }]}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
            <Text style={styles.statsLabel}>Upcoming Deadlines</Text>
            <Text style={styles.statsValue}>{stats.upcoming}</Text>
            <Text style={[styles.statsSubtext, { color: stats.urgent > 0 ? '#EF4444' : '#6B7280' }]}>
              {stats.urgent > 0 ? `${stats.urgent} urgent` : 'In next 7 days'}
            </Text>
          </Pressable>
        </View>

        {/* Main Content - Quick Access Sections */}
        <View style={styles.mainGrid}>
          {/* Quick Access Sections */}
          <View style={styles.sidebarColumn}>
            {/* Upcoming Deadlines Card */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarCardHeader}>
                <Text style={styles.sidebarCardTitle}>Upcoming Deadlines</Text>
                <Pressable onPress={() => navigation.navigate('StudentDeadlines')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>
              <View style={styles.deadlinesList}>
                {upcomingDeadlines.length === 0 ? (
                  <Text style={styles.mutedText}>No upcoming deadlines</Text>
                ) : (
                  upcomingDeadlines.map((admission) => {
                    const color = admission.daysRemaining <= 3 ? '#EF4444' : admission.daysRemaining <= 7 ? '#FACC15' : '#10B981'
                    return (
                      <View key={admission.id} style={styles.deadlineItem}>
                        <View style={[styles.deadlineDot, { backgroundColor: color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.deadlineUniversity}>{admission.university}</Text>
                          <Text style={styles.deadlineProgram}>{admission.program}</Text>
                          <Text style={[styles.deadlineDays, { color }]}>
                            {admission.daysRemaining < 0 ? 'Deadline passed' : `Deadline in ${admission.daysRemaining} days`}
                          </Text>
                        </View>
                      </View>
                    )
                  })
                )}
              </View>
            </View>

            {/* Recent Activity Card */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarCardHeader}>
                <Text style={styles.sidebarCardTitle}>Recent Activity</Text>
                <Pressable onPress={() => navigation.navigate('StudentNotifications')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>
              <View style={styles.activityList}>
                {recentActivities.length === 0 ? (
                  <Text style={styles.mutedText}>No recent activity</Text>
                ) : (
                  recentActivities.map((activity, idx) => (
                    <View key={idx} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Text style={{ fontSize: 16 }}>📌</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityText}>{activity.action}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      )}
      
      {/* AI Chat Assistant */}
      <AiAssistantButton />
      <ChatModal />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  container: {
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  mainGrid: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  heroPrimaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  heroPrimaryButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  heroSecondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  heroSecondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 6,
    marginBottom: 12
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statsSubtext: {
    fontSize: 12,
    color: '#10B981',
  },
  mainColumn: {
    flex: 1,
    marginBottom: 24,
  },
  sidebarColumn: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  programsGrid: {
    marginHorizontal: -6,
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    minWidth: '100%',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  programCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  programUniversity: {
    fontSize: 14,
    color: '#6B7280',
  },
  matchBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  programCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deadlineText: {
    fontSize: 12,
    color: '#6B7280',
  },
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sidebarCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sidebarCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  deadlinesList: {
  },
  deadlineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  deadlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  deadlineUniversity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  deadlineProgram: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  deadlineDays: {
    fontSize: 12,
  },
  activityList: {
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mutedText: {
    fontSize: 14,
    color: '#6B7280',
  },
})