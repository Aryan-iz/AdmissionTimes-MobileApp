import { useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore } from '../../store'
import { useStudentDashboardData } from '../../hooks/useStudentDashboardData'
import { isOpen, type StudentAdmission } from '../../domain/admission'
import { dayKey } from '../../domain/dates'
import { StudentScreen, EmptyState, Chip } from '../../components/ui'
import AdmissionCard from '../../components/admission/AdmissionCard'
import { showErrorToast } from '../../services/toast'
import { colors, font, spacing } from '../../theme'

type Range = 'week' | 'month' | 'quarter' | 'all'

const RANGES: Array<{ value: Range; label: string; days: number | null }> = [
  { value: 'week', label: 'This week', days: 7 },
  { value: 'month', label: '30 days', days: 30 },
  { value: 'quarter', label: '90 days', days: 90 },
  { value: 'all', label: 'All', days: null },
]

/** Group admissions that share a deadline day, keeping the input order. */
const groupByDay = (items: StudentAdmission[]) => {
  const groups: Array<{ key: string; label: string; items: StudentAdmission[] }> = []
  items.forEach((item) => {
    const key = dayKey(item.deadlineIso)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, label: item.hasDeadline ? item.deadlineDisplay : 'No deadline', items: [item] })
  })
  return groups
}

export default function DeadlineScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const admissions = useStudentStore((state) => state.admissions)
  const setSaved = useStudentStore((state) => state.setSaved)
  const { loading, refetch } = useStudentDashboardData()

  const [range, setRange] = useState<Range>('month')
  const [savedOnly, setSavedOnly] = useState(false)
  const [showClosed, setShowClosed] = useState(false)

  const { upcoming, closed } = useMemo(() => {
    const limit = RANGES.find((r) => r.value === range)?.days ?? null
    const pool = savedOnly ? admissions.filter((a) => a.saved) : admissions
    // admissions are already sorted: open by soonest deadline, then closed by most recent.
    const open = pool.filter((a) => isOpen(a) && (limit === null || (a.hasDeadline && a.daysRemaining <= limit)))
    return { upcoming: groupByDay(open), closed: pool.filter((a) => !isOpen(a)) }
  }, [admissions, range, savedOnly])

  const upcomingCount = upcoming.reduce((sum, g) => sum + g.items.length, 0)

  const toggleSave = async (admission: StudentAdmission) => {
    const ok = await setSaved(admission.id, !admission.saved)
    if (!ok) showErrorToast('Could not update saved programs', 'Check your connection and try again.')
  }

  const renderCard = (admission: StudentAdmission) => (
    <AdmissionCard
      key={admission.id}
      admission={admission}
      onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
      onToggleSave={() => void toggleSave(admission)}
    />
  )

  return (
    <StudentScreen refreshing={loading} onRefresh={() => void refetch()}>
      <Text style={styles.heading}>Deadlines</Text>
      <Text style={styles.summary}>
        {upcomingCount} upcoming {savedOnly ? 'in your saved programs' : 'across all programs'}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {RANGES.map((option) => (
          <Chip key={option.value} label={option.label} active={range === option.value} onPress={() => setRange(option.value)} />
        ))}
        <View style={styles.divider} />
        <Chip label="Saved only" active={savedOnly} onPress={() => setSavedOnly((v) => !v)} />
      </ScrollView>

      {upcoming.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No upcoming deadlines"
          message={range === 'all' ? undefined : 'Try a longer time range.'}
          actionLabel={range === 'all' ? undefined : 'Show all'}
          onAction={range === 'all' ? undefined : () => setRange('all')}
        />
      ) : (
        upcoming.map((group) => (
          <View key={group.key}>
            <View style={styles.groupHeader}>
              <Feather name="calendar" size={14} color={colors.textMuted} />
              <Text style={styles.groupTitle}>{group.label}</Text>
              <Text style={styles.groupCount}>{group.items.length}</Text>
            </View>
            {group.items.map(renderCard)}
          </View>
        ))
      )}

      {closed.length > 0 ? (
        <>
          <Pressable
            style={styles.closedToggle}
            onPress={() => setShowClosed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={`Closed programs (${closed.length})`}
            accessibilityState={{ expanded: showClosed }}
          >
            <Text style={styles.closedTitle}>Closed ({closed.length})</Text>
            <Feather name={showClosed ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {showClosed ? closed.map(renderCard) : null}
        </>
      ) : null}
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
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
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupTitle: {
    flex: 1,
    fontSize: font.body,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  groupCount: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  closedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closedTitle: {
    fontSize: font.title,
    fontWeight: '600',
    color: colors.textMuted,
  },
})
