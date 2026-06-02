import { useMemo, useEffect, useState } from 'react'
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator.tsx'
import { useAuthStore, useStudentStore } from '../../store'
import { useStudentDashboardData } from '../../hooks/useStudentDashboardData'
import {
  RECOMMENDATION_COUNT_LIMIT,
  RECOMMENDATION_RENDER_LIMIT,
  limitRecommendations,
} from '../../utils/recommendationUtils'
import {
  resolveUpcomingDeadlineStat,
  resolveUrgentDeadlineStat,
  UPCOMING_DEADLINE_SIDEBAR_WINDOW_DAYS,
  UPCOMING_DEADLINE_STAT_WINDOW_DAYS,
} from '../../utils/studentStatsUtils'
import { countUniqueSavedAdmissions } from '../../utils/watchlistUtils'
import { isAdmissionActiveByPolicy } from '../../data/studentData'
import { PremiumHeader, CustomLoader } from '../../components/ui'
import { NewAdmissionSlider } from '../../components/student'
import { useAi } from '../../contexts/AiContext'
import { Feather } from '@expo/vector-icons'
import { getUniversityById } from '../../services/universitiesService'

export default function StudentDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const admissions = useStudentStore(state => state.admissions)
  const notifications = useStudentStore(state => state.notifications)
  const dashboardStats = useStudentStore(state => state.stats)
  const error = useStudentStore(state => state.error)
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  const { setContext } = useAi()
  const { loading, refetch } = useStudentDashboardData()

  const displayName =
    user?.name?.trim() ||
    user?.display_name?.trim() ||
    (user?.email ? user.email.split('@')[0] : 'Student')

  useEffect(() => {
    setContext('Student Dashboard')
  }, [setContext])

  const stats = useMemo(() => {
    const clientSaved = countUniqueSavedAdmissions(admissions.filter((a) => a.saved))
    const clientActive = admissions.filter(isAdmissionActiveByPolicy).length
    const clientUpcoming = resolveUpcomingDeadlineStat(admissions, dashboardStats?.upcoming_deadlines)
    const clientUrgent = resolveUrgentDeadlineStat(admissions, dashboardStats?.urgent_deadlines)
    const clientRecommendations = Math.min(RECOMMENDATION_COUNT_LIMIT, limitRecommendations(admissions).length)

    return {
      active: dashboardStats?.active_admissions ?? clientActive,
      saved: dashboardStats?.saved_count ?? clientSaved,
      upcoming: clientUpcoming,
      urgent: clientUrgent,
      recommendations: dashboardStats?.recommendations_count
        ? Math.min(RECOMMENDATION_COUNT_LIMIT, dashboardStats.recommendations_count)
        : clientRecommendations,
    }
  }, [dashboardStats, admissions])

  const upcomingDeadlines = useMemo(() => {
    return admissions
      .filter(
        (a) =>
          a.programStatus !== 'Closed' &&
          a.daysRemaining >= 0 &&
          a.daysRemaining <= UPCOMING_DEADLINE_SIDEBAR_WINDOW_DAYS
      )
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 3)
  }, [admissions])

  const recommendedAdmissions = useMemo(() => limitRecommendations(admissions), [admissions])

  const [resolvedUniversities, setResolvedUniversities] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true

    const toResolve = recommendedAdmissions.filter((a) => {
      const anyA = a as any
      return !anyA.university_name && (anyA.university_id || anyA.universityId)
    })

    if (toResolve.length === 0) return

    ;(async () => {
      const results: Record<string, string> = {}
      for (const admission of toResolve.slice(0, 10)) {
        const anyA = admission as any
        const uniId = anyA.university_id ?? anyA.universityId
        if (!uniId) continue
        try {
          const uni = await getUniversityById(uniId)
          if (uni && uni.name) {
            results[admission.id] = uni.name
          }
        } catch (err) {
          // ignore
        }
      }

      if (mounted && Object.keys(results).length > 0) {
        setResolvedUniversities((prev) => ({ ...prev, ...results }))
      }
    })()

    return () => { mounted = false }
  }, [recommendedAdmissions])

  const recentActivities = useMemo(() => {
    const activities: Array<{ action: string; time: string }> = []

    // notifications already appear sorted newest-first in the context clone
    notifications.slice(0, 2).forEach((n) => {
      activities.push({ action: n.title, time: n.timeAgo })
    })

    const savedCount = countUniqueSavedAdmissions(admissions.filter((a) => a.saved))
    if (savedCount > 0) {
      activities.push({
        action: `${savedCount} program${savedCount > 1 ? 's' : ''} saved to watchlist`,
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
  }, [notifications, admissions])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['bottom']}>
      <PremiumHeader
        userName={user?.name || user?.display_name || 'Student'}
        userRole="Student"
        notifications={notifications.filter(n => !n.read).length}
        onNotificationPress={() => navigation.navigate('StudentNotifications')}
        onLogout={signOut}
      />
      
      {/* New Admission Slider - Fetches data from store automatically */}
      {!loading && <NewAdmissionSlider />}
      
      {error && !loading ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Pressable style={styles.errorRetryButton} onPress={() => void refetch()}>
            <Text style={styles.errorRetryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <CustomLoader size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Welcome back, {displayName}!</Text>
          <Text style={styles.heroSubtitle}>
            Track your admission progress and discover new opportunities.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable
              style={styles.heroPrimaryButton}
              onPress={() => navigation.navigate('StudentSearch')}
            >
              <View style={styles.heroButtonContent}>
                <Feather name="search" size={14} color="#2563EB" />
                <Text style={styles.heroPrimaryButtonText}>Search Admissions</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.heroSecondaryButton}
              onPress={() => navigation.navigate('StudentDeadlines')}
            >
              <View style={styles.heroButtonContent}>
                <Feather name="calendar" size={14} color="#FFFFFF" />
                <Text style={styles.heroSecondaryButtonText}>View Deadlines</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Stats Cards Grid */}
        <View style={styles.statsGrid}>
          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentSearch')}
          >
            <View style={[styles.statsIcon, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="book-open" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statsLabel}> Active Applications</Text>
            <Text style={styles.statsValue}>{stats.active}</Text>
            <Text style={styles.statsSubtext}>Open & Closing Soon</Text>
          </Pressable>

          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentSearch')}
          >
            <View style={[styles.statsIcon, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="star" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statsLabel}>Recommendations</Text>
            <Text style={styles.statsValue}>{stats.recommendations}</Text>
            <Text style={styles.statsSubtext}>Matched programs</Text>
          </Pressable>

          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentWatchlist')}
          >
            <View style={[styles.statsIcon, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="bookmark" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statsLabel}>Saved Programs</Text>
            <Text style={styles.statsValue}>{stats.saved}</Text>
            <Text style={styles.statsSubtext}>View watchlist</Text>
          </Pressable>

          <Pressable 
            style={styles.statsCard}
            onPress={() => navigation.navigate('StudentDeadlines')}
          >
            <View style={[styles.statsIcon, { backgroundColor: stats.urgent > 0 ? '#FEE2E2' : '#FEF3C7' }]}>
              <Feather name="calendar" size={18} color={stats.urgent > 0 ? '#EF4444' : '#B45309'} />
            </View>
            <Text style={styles.statsLabel}>Upcoming Deadlines</Text>
            <Text style={styles.statsValue}>{stats.upcoming}</Text>
            <Text style={[styles.statsSubtext, { color: stats.urgent > 0 ? '#EF4444' : '#6B7280' }]}>
              {stats.urgent > 0
                ? `${stats.urgent} urgent`
                : `Closing within ${UPCOMING_DEADLINE_STAT_WINDOW_DAYS} days`}
            </Text>
          </Pressable>
        </View>

        {/* Main Content - Quick Access Sections */}
        <View style={styles.mainGrid}>
          {/* Quick Access Sections */}
          <View style={styles.sidebarColumn}>
            {/* Recommendations Card */}
            <View style={styles.sidebarCard}>
              <View style={styles.sidebarCardHeader}>
                <Text style={styles.sidebarCardTitle}>Recommendations</Text>
                <Pressable onPress={() => navigation.navigate('StudentSearch')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </Pressable>
              </View>
              <View style={styles.deadlinesList}>
                {recommendedAdmissions.length === 0 ? (
                  <Text style={styles.mutedText}>No recommendations available</Text>
                ) : (
                  recommendedAdmissions.slice(0, RECOMMENDATION_RENDER_LIMIT).map((admission) => {
                    const match = Math.round(admission.matchNumeric || 0)
                    // Prefer enriched recommendation fields when available
                    const rawUni = String(resolvedUniversities[admission.id] || (admission as any).university_name || admission.university || '')
                    // Normalize university name: strip generic 'unknown' tokens
                    const normalizedUni = rawUni.replace(/unknown/ig, '').trim()
                    const place = [ (admission as any).university_city, admission.city, admission.location ]
                      .filter(Boolean)
                      .join(', ')

                    const title = normalizedUni.length > 0
                      ? normalizedUni
                      : (place || ((admission as any).university_id ? `University ${ (admission as any).university_id }` : 'University'))

                    return (
                      <Pressable
                        key={admission.id}
                        style={styles.recommendationItem}
                        onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
                      >
                        <View style={styles.recommendationBadge}>
                          <Text style={styles.recommendationBadgeText}>{match}%</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.deadlineUniversity} numberOfLines={1}>{title}</Text>
                          <Text style={styles.deadlineProgram} numberOfLines={1}>{admission.program}</Text>
                          {place ? <Text style={styles.recommendationPlace} numberOfLines={1}>{place}</Text> : null}
                        </View>
                      </Pressable>
                    )
                  })
                )}
              </View>
            </View>

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
                    const days = admission.daysRemaining
                    const color = days <= 3 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#10B981'
                    const bgColor = days <= 3 ? '#FEE2E2' : days <= 7 ? '#FEF3C7' : '#D1FAE5'
                    const daysLabel =
                      days <= 0 ? 'Today'
                      : days === 1 ? 'Tomorrow'
                      : `${days}d left`
                    const shortDate = admission.deadlineDisplay
                    return (
                      <View key={admission.id} style={styles.deadlineItem}>
                        <View style={[styles.deadlineDot, { backgroundColor: color }]} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.deadlineUniversity} numberOfLines={1}>{admission.university}</Text>
                          <Text style={styles.deadlineProgram} numberOfLines={1}>{admission.program}</Text>
                        </View>
                        <View style={styles.deadlineBadge}>
                          <Text style={[styles.deadlineBadgeDate, { color }]}>{shortDate}</Text>
                          <View style={[styles.deadlineBadgePill, { backgroundColor: bgColor }]}>
                            <Text style={[styles.deadlineBadgePillText, { color }]}>{daysLabel}</Text>
                          </View>
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
                        <Feather name="bell" size={14} color="#2563EB" />
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
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 8,
  },
  errorRetryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  errorRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
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
  heroButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 28,
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
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  deadlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  deadlineUniversity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  deadlineProgram: {
    fontSize: 11,
    color: '#6B7280',
  },
  deadlineBadge: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  deadlineBadgeDate: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  deadlineBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deadlineBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activityList: {
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  recommendationBadge: {
    minWidth: 42,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recommendationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  recommendationPlace: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
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