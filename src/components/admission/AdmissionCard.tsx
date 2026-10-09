import type { ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import type { StudentAdmission } from '../../domain/admission'
import { daysLeftLabel } from '../../domain/dates'
import { colors, font, radius, spacing } from '../../theme'
import UniversityAvatar from './UniversityAvatar'
import { ProgramStatusBadge, SourceBadge } from './AdmissionBadges'

interface AdmissionCardProps {
  admission: StudentAdmission
  onPress: () => void
  onToggleSave?: () => void
  onToggleCompare?: () => void
  comparing?: boolean
  /** Extra content under the main row (e.g. reminder switch on the watchlist). */
  footer?: ReactNode
}

export const deadlineTone = (admission: Pick<StudentAdmission, 'daysRemaining' | 'hasDeadline'>): string => {
  if (!admission.hasDeadline || admission.daysRemaining < 0) return colors.textMuted
  if (admission.daysRemaining <= 3) return colors.danger
  if (admission.daysRemaining <= 7) return colors.warning
  return colors.textSecondary
}

/** The one card used for admissions in every list (search, deadlines, watchlist, compare picker). */
export default function AdmissionCard({ admission, onPress, onToggleSave, onToggleCompare, comparing, footer }: AdmissionCardProps) {
  const closed = admission.programStatus === 'Closed'
  const meta = [admission.degree, admission.programsOffered.length > 0 ? `${admission.programsOffered.length} programs` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <View style={[styles.card, closed && styles.cardClosed]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${admission.program}, ${admission.university}, ${admission.programStatus}`}
      >
        <UniversityAvatar name={admission.university} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <Text style={styles.university} numberOfLines={1}>
              {admission.university}
            </Text>
            <ProgramStatusBadge status={admission.programStatus} />
          </View>
          <Text style={styles.program} numberOfLines={2}>
            {admission.program}
          </Text>
          <View style={styles.metaRow}>
            <SourceBadge source={admission.source} />
            {meta ? (
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.footerRow}>
        <View style={styles.deadline}>
          <Feather name="calendar" size={13} color={deadlineTone(admission)} />
          <Text style={[styles.deadlineText, { color: deadlineTone(admission) }]} numberOfLines={1}>
            {admission.hasDeadline ? `${admission.deadlineDisplay} · ` : ''}
            {daysLeftLabel(admission.daysRemaining, admission.hasDeadline)}
          </Text>
        </View>
        <View style={styles.actions}>
          {onToggleCompare ? (
            <Pressable
              onPress={onToggleCompare}
              hitSlop={8}
              style={[styles.iconButton, comparing && styles.iconButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: comparing }}
              accessibilityLabel={comparing ? 'Remove from comparison' : 'Add to comparison'}
            >
              <Feather name="shuffle" size={16} color={comparing ? colors.primary : colors.textMuted} />
            </Pressable>
          ) : null}
          {onToggleSave ? (
            <Pressable
              onPress={onToggleSave}
              hitSlop={8}
              style={[styles.iconButton, admission.saved && styles.iconButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: admission.saved }}
              accessibilityLabel={admission.saved ? 'Remove from saved' : 'Save program'}
            >
              <Feather name="bookmark" size={16} color={admission.saved ? colors.primary : colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {footer ? <View style={styles.extra}>{footer}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardClosed: {
    opacity: 0.75,
  },
  main: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  pressed: {
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  university: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
    fontWeight: '500',
  },
  program: {
    fontSize: font.title,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  deadline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deadlineText: {
    flex: 1,
    fontSize: font.small,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSoft,
  },
  iconButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  extra: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
})
