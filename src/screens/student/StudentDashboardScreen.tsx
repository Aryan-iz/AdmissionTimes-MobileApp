import { useEffect, useMemo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useAuthStore, useStudentStore } from '../../store'
import { useStudentDashboardData } from '../../hooks/useStudentDashboardData'
import { isOpen } from '../../domain/admission'
import { daysLeftLabel, formatShortDate } from '../../domain/dates'
import { StudentScreen, Section, EmptyState, ErrorBanner, CustomLoader, Badge } from '../../components/ui'
import AdmissionRow from '../../components/admission/AdmissionRow'
import { deadlineTone } from '../../components/admission/AdmissionCard'
import { useAi } from '../../contexts/AiContext'
import { colors, font, radius, spacing } from '../../theme'

const CLOSING_SOON_DAYS = 7
const SECTION_LIMIT = 3

type StatCardProps = {
  icon: keyof typeof Feather.glyphMap
  label: string
  value: number
  hint: string
  tone?: string
  onPress: () => void
}

function StatCard({ icon, label, value, hint, tone = colors.primary, onPress }: StatCardProps) {
  return (
    <Pressable style={styles.stat} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.statHeader}>
        <Feather name={icon} size={16} color={tone} />
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint} numberOfLines={1}>
        {hint}
      </Text>
    </Pressable>
  )
}

export default function StudentDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore((state) => state.user)
  const admissions = useStudentStore((state) => state.admissions)
  const recommendations = useStudentStore((state) => state.recommendations)
  const notifications = useStudentStore((state) => state.notifications)
  const stats = useStudentStore((state) => state.stats)
  const error = useStudentStore((state) => state.error)
  const { loading, refetch } = useStudentDashboardData()
  const { setContext } = useAi()

  useEffect(() => {
    setContext('Student Dashboard')
  }, [setContext])

  const firstName = (user?.display_name?.trim() || user?.email?.split('@')[0] || 'there').split(/\s+/)[0]
  const open = useMemo(() => admissions.filter(isOpen), [admissions])
  // Admissions are sorted soonest-deadline first, so the first open ones close first.
  const closingSoon = useMemo(
    () => open.filter((a) => a.hasDeadline && a.daysRemaining <= CLOSING_SOON_DAYS),
    [open]
  )
  const recentlyAdded = useMemo(
    () => [...open].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, SECTION_LIMIT),
    [open]
  )
  const openRecommendations = useMemo(() => recommendations.filter(isOpen).slice(0, SECTION_LIMIT), [recommendations])
  const unread = notifications.filter((n) => !n.read).length
  const savedCount = stats?.saved_count ?? admissions.filter((a) => a.saved).length

  const openProgram = (id: string) => navigation.navigate('ProgramDetail', { id })
  const goTab = (name: 'StudentSearch' | 'StudentDeadlines' | 'StudentWatchlist' | 'StudentNotifications') =>
    navigation.reset({ index: 0, routes: [{ name }] })

  if (loading && admissions.length === 0) {
    return (
      <StudentScreen scroll={false}>
        <View style={styles.loading}>
          <CustomLoader size={56} color={colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </StudentScreen>
    )
  }

  return (
    <StudentScreen refreshing={loading} onRefresh={() => void refetch()}>
      {error ? <ErrorBanner message={error} onRetry={() => void refetch()} /> : null}

      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome back, {firstName}!</Text>
        <Text style={styles.heroText}>Track deadlines and discover verified admissions.</Text>
        <Pressable style={styles.heroButton} onPress={() => goTab('StudentSearch')} accessibilityRole="button" accessibilityLabel="Search admissions">
          <Feather name="search" size={16} color={colors.primary} />
          <Text style={styles.heroButtonText}>Search admissions</Text>
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="book-open" label="Open programs" value={open.length} hint="Accepting applications" onPress={() => goTab('StudentSearch')} />
        <StatCard icon="bookmark" label="Saved" value={savedCount} hint="On your watchlist" onPress={() => goTab('StudentWatchlist')} />
        <StatCard
          icon="clock"
          label="Closing this week"
          value={closingSoon.length}
          hint={`Within ${CLOSING_SOON_DAYS} days`}
          tone={closingSoon.length > 0 ? colors.warning : colors.primary}
          onPress={() => goTab('StudentDeadlines')}
        />
        <StatCard
          icon="bell"
          label="Unread alerts"
          value={unread}
          hint="Notifications"
          tone={unread > 0 ? colors.danger : colors.primary}
          onPress={() => goTab('StudentNotifications')}
        />
      </View>

      <Section title="Recommended for you" actionLabel="Search" onAction={() => goTab('StudentSearch')}>
        {openRecommendations.length === 0 ? (
          <Text style={styles.muted}>Save a few programs and we will suggest similar ones.</Text>
        ) : (
          openRecommendations.map((admission) => (
            <AdmissionRow
              key={admission.id}
              admission={admission}
              onPress={() => openProgram(admission.id)}
              // Scores under 60 are the engine's generic fallback; its reason adds nothing.
              subtitle={
                admission.matchReason && (admission.matchScore ?? 0) >= 60
                  ? `${admission.university} · ${admission.matchReason}`
                  : admission.university
              }
              trailing={admission.matchLabel ? <Badge label={admission.matchLabel} tone="primary" /> : null}
            />
          ))
        )}
      </Section>

      <Section title="Closing soon" actionLabel="All deadlines" onAction={() => goTab('StudentDeadlines')}>
        {closingSoon.length === 0 ? (
          <Text style={styles.muted}>No deadlines in the next {CLOSING_SOON_DAYS} days.</Text>
        ) : (
          closingSoon.slice(0, SECTION_LIMIT).map((admission) => (
            <AdmissionRow
              key={admission.id}
              admission={admission}
              onPress={() => openProgram(admission.id)}
              trailing={
                <>
                  <Text style={[styles.trailingStrong, { color: deadlineTone(admission) }]}>
                    {daysLeftLabel(admission.daysRemaining, admission.hasDeadline)}
                  </Text>
                  <Text style={styles.trailingMuted}>{formatShortDate(admission.deadlineIso)}</Text>
                </>
              }
            />
          ))
        )}
      </Section>

      <Section title="Recently added" actionLabel="Search" onAction={() => goTab('StudentSearch')}>
        {recentlyAdded.length === 0 ? (
          <EmptyState icon="inbox" title="No open admissions right now" />
        ) : (
          recentlyAdded.map((admission) => (
            <AdmissionRow
              key={admission.id}
              admission={admission}
              onPress={() => openProgram(admission.id)}
              trailing={<Text style={styles.trailingMuted}>{formatShortDate(admission.deadlineIso)}</Text>}
            />
          ))
        )}
      </Section>

      <Section title="Latest notifications" actionLabel="View all" onAction={() => goTab('StudentNotifications')}>
        {notifications.length === 0 ? (
          <Text style={styles.muted}>You are all caught up.</Text>
        ) : (
          notifications.slice(0, SECTION_LIMIT).map((notification) => (
            <Pressable
              key={notification.id}
              style={styles.notification}
              onPress={() => (notification.admissionId ? openProgram(notification.admissionId) : goTab('StudentNotifications'))}
              accessibilityRole="button"
            >
              <View style={[styles.unreadDot, notification.read && styles.readDot]} />
              <View style={styles.notificationBody}>
                <Text style={styles.notificationTitle} numberOfLines={2}>
                  {notification.title}
                </Text>
                <Text style={styles.trailingMuted}>{notification.timeAgo}</Text>
              </View>
            </Pressable>
          ))
        )}
      </Section>
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: font.display,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroText: {
    fontSize: font.body,
    color: '#DBEAFE',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  heroButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: font.body,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statLabel: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  statHint: {
    fontSize: font.caption,
    color: colors.textFaint,
  },
  muted: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  trailingStrong: {
    fontSize: font.small,
    fontWeight: '700',
  },
  trailingMuted: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  notification: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  readDot: {
    backgroundColor: colors.border,
  },
  notificationBody: {
    flex: 1,
    gap: 2,
  },
  notificationTitle: {
    fontSize: font.body,
    color: colors.text,
    fontWeight: '500',
  },
})
