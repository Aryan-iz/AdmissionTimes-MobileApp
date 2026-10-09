import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore } from '../../store'
import { SOURCE_HINT, type StudentAdmission } from '../../domain/admission'
import { daysLeftLabel, formatDateTime } from '../../domain/dates'
import { StudentScreen, Section, EmptyState, CustomLoader } from '../../components/ui'
import UniversityAvatar from '../../components/admission/UniversityAvatar'
import { ProgramStatusBadge, SourceBadge } from '../../components/admission/AdmissionBadges'
import { deadlineTone } from '../../components/admission/AdmissionCard'
import { showErrorToast, showSuccessToast } from '../../services/toast'
import { trackCappedStudentActivitySafe } from '../../services'
import { useAi } from '../../contexts/AiContext'
import { colors, font, radius, spacing } from '../../theme'

type DetailRoute = RouteProp<RootStackParamList, 'ProgramDetail'>

/** Primary link: the portal or announcement students act on. */
const primaryLink = (a: StudentAdmission): { label: string; url: string } | null => {
  if (a.portalUrl) return { label: 'Apply on admission portal', url: a.portalUrl }
  if (a.source === 'scraper' && a.announcementUrl) return { label: 'View official announcement', url: a.announcementUrl }
  if (a.applyUrl) return { label: 'Open official page', url: a.applyUrl }
  if (a.websiteUrl) return { label: 'Visit university website', url: a.websiteUrl }
  return null
}

const openUrl = async (url: string) => {
  try {
    await Linking.openURL(url)
  } catch {
    showErrorToast('Could not open link', url)
  }
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, !value && styles.factMissing]}>{value ?? 'Not specified'}</Text>
    </View>
  )
}

function ActionButton({
  icon,
  label,
  active,
  busy,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap
  label: string
  active?: boolean
  busy?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[styles.action, active && styles.actionActive]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, busy }}
    >
      <Feather name={icon} size={16} color={active ? colors.primary : colors.textSecondary} />
      <Text style={[styles.actionText, active && styles.actionTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function ProgramDetailScreen() {
  const route = useRoute<DetailRoute>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const programId = route.params?.id
  const program = useStudentStore((state) => state.admissions.find((a) => a.id === programId))
  const ensureAdmission = useStudentStore((state) => state.ensureAdmission)
  const setSaved = useStudentStore((state) => state.setSaved)
  const setAlert = useStudentStore((state) => state.setAlert)
  const { setContext } = useAi()
  const [loading, setLoading] = useState(!program)
  const [busy, setBusy] = useState<'save' | 'alert' | null>(null)

  // Opened from a notification or link, the program may not be loaded yet.
  useEffect(() => {
    let cancelled = false
    if (!programId) {
      setLoading(false)
      return
    }
    ensureAdmission(programId).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [programId, ensureAdmission])

  useEffect(() => {
    if (!program) return
    setContext(`Program Details: ${program.program} at ${program.university}`)
    void trackCappedStudentActivitySafe({
      activity_type: 'viewed',
      entity_type: 'admission',
      entity_id: program.id,
      metadata: { source: 'mobile_program_detail' },
    })
    // Track once per program.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id])

  if (loading) {
    return (
      <StudentScreen title="Program Details" scroll={false}>
        <View style={styles.center}>
          <CustomLoader size={48} color={colors.primary} />
        </View>
      </StudentScreen>
    )
  }

  if (!program) {
    return (
      <StudentScreen title="Program Details">
        <EmptyState
          icon="alert-circle"
          title="Program not available"
          message="It may have been removed or is no longer published."
          actionLabel="Search admissions"
          onAction={() => navigation.reset({ index: 0, routes: [{ name: 'StudentSearch' }] })}
        />
      </StudentScreen>
    )
  }

  const link = primaryLink(program)
  const closed = program.programStatus === 'Closed'

  const toggleSave = async () => {
    setBusy('save')
    const ok = await setSaved(program.id, !program.saved)
    setBusy(null)
    if (!ok) showErrorToast('Could not update saved programs', 'Check your connection and try again.')
    else if (!program.saved) showSuccessToast('Saved', 'Deadline reminders are on for this program.')
  }

  const toggleReminder = async () => {
    const enable = !program.alertEnabled
    setBusy('alert')
    const ok = await setAlert(program.id, enable)
    setBusy(null)
    if (!ok) {
      showErrorToast('Reminder not updated', 'Check your connection and try again.')
      return
    }
    showSuccessToast(enable ? 'Reminder on' : 'Reminder off', enable ? "We'll remind you 7, 3 and 1 day before the deadline." : 'You will not get deadline reminders for this program.')
    void trackCappedStudentActivitySafe({
      activity_type: 'alert',
      entity_type: 'admission',
      entity_id: program.id,
      metadata: { source: 'mobile_program_detail', enabled: enable },
    })
  }

  return (
    <StudentScreen title="Program Details">
      <View style={styles.headerCard}>
        <View style={styles.universityRow}>
          <UniversityAvatar name={program.university} size={44} />
          <View style={styles.universityText}>
            <Text style={styles.university} numberOfLines={2}>
              {program.university}
            </Text>
            {program.location ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color={colors.textMuted} />
                <Text style={styles.location} numberOfLines={1}>
                  {program.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>{program.program}</Text>

        <View style={styles.badges}>
          <ProgramStatusBadge status={program.programStatus} />
          <SourceBadge source={program.source} />
        </View>

        <View style={styles.deadlineBox}>
          <Feather name="calendar" size={18} color={deadlineTone(program)} />
          <View style={styles.deadlineText}>
            <Text style={styles.deadlineLabel}>Application deadline</Text>
            <Text style={styles.deadlineValue}>{program.deadlineDisplay}</Text>
          </View>
          <Text style={[styles.daysLeft, { color: deadlineTone(program) }]}>
            {daysLeftLabel(program.daysRemaining, program.hasDeadline)}
          </Text>
        </View>

        {link ? (
          <Pressable style={styles.primary} onPress={() => void openUrl(link.url)} accessibilityRole="link" accessibilityLabel={link.label}>
            <Feather name="external-link" size={16} color="#FFFFFF" />
            <Text style={styles.primaryText}>{link.label}</Text>
          </Pressable>
        ) : (
          <Text style={styles.noLink}>No official link was provided. Contact the university for application details.</Text>
        )}

        <View style={styles.actions}>
          <ActionButton
            icon="bookmark"
            label={program.saved ? 'Saved' : 'Save'}
            active={program.saved}
            busy={busy === 'save'}
            onPress={() => void toggleSave()}
          />
          <ActionButton
            icon={program.alertEnabled ? 'bell' : 'bell-off'}
            label={program.alertEnabled ? 'Reminder on' : 'Remind me'}
            active={program.alertEnabled}
            busy={busy === 'alert' || closed}
            onPress={() => void toggleReminder()}
          />
          <ActionButton icon="shuffle" label="Compare" onPress={() => navigation.navigate('StudentCompare', { ids: [program.id] })} />
        </View>
      </View>

      <Section title={program.source === 'university' ? 'About this program' : 'About this admission'}>
        {program.description ? (
          <Text style={styles.paragraph}>{program.description}</Text>
        ) : (
          <Text style={styles.muted}>
            {program.source === 'scraper'
              ? 'This admission was collected from the university’s public announcement, which does not include a program description.'
              : 'The university has not added a description yet.'}
          </Text>
        )}
      </Section>

      {program.programsOffered.length > 0 ? (
        <Section title={`Programs in this admission (${program.programsOffered.length})`}>
          <View style={styles.programList}>
            {program.programsOffered.map((name) => (
              <View key={name} style={styles.programItem}>
                <Feather name="check" size={14} color={colors.primary} />
                <Text style={styles.programName}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Key details">
        <View style={styles.facts}>
          <Fact label="Degree" value={program.degree} />
          <Fact label="Application fee" value={program.fee === 'Not specified' ? null : program.fee} />
          <Fact label="Field of study" value={program.fieldOfStudy} />
          <Fact label="Program type" value={program.programType} />
          <Fact label="Duration" value={program.duration} />
          <Fact label="Study mode" value={program.deliveryMode} />
        </View>
      </Section>

      <Section title="Eligibility">
        {program.eligibility ? (
          <Text style={styles.paragraph}>{program.eligibility}</Text>
        ) : (
          <Text style={styles.muted}>Eligibility criteria were not provided. Check the official page before applying.</Text>
        )}
      </Section>

      <Section title="Source">
        <SourceBadge source={program.source} />
        <Text style={[styles.muted, styles.sourceHint]}>{SOURCE_HINT[program.source]}</Text>
        <Text style={styles.updated}>Last updated {formatDateTime(program.updatedAt)}</Text>
        {program.websiteUrl && program.websiteUrl !== link?.url ? (
          <Pressable style={styles.secondaryLink} onPress={() => void openUrl(program.websiteUrl as string)} accessibilityRole="link" accessibilityLabel="University website">
            <Feather name="globe" size={14} color={colors.primary} />
            <Text style={styles.secondaryLinkText}>University website</Text>
          </Pressable>
        ) : null}
        {program.announcementUrl && program.announcementUrl !== link?.url ? (
          <Pressable style={styles.secondaryLink} onPress={() => void openUrl(program.announcementUrl as string)} accessibilityRole="link" accessibilityLabel="Official announcement">
            <Feather name="file-text" size={14} color={colors.primary} />
            <Text style={styles.secondaryLinkText}>Official announcement</Text>
          </Pressable>
        ) : null}
      </Section>
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  universityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  university: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  location: {
    flex: 1,
    fontSize: font.small,
    color: colors.textMuted,
  },
  title: {
    fontSize: font.display,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deadlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  deadlineText: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  deadlineValue: {
    fontSize: font.title,
    fontWeight: '600',
    color: colors.text,
  },
  daysLeft: {
    fontSize: font.small,
    fontWeight: '700',
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: 46,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: font.body,
  },
  noLink: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  actionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionTextActive: {
    color: colors.primary,
  },
  paragraph: {
    fontSize: font.body,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  muted: {
    fontSize: font.body,
    lineHeight: 20,
    color: colors.textMuted,
  },
  programList: {
    gap: spacing.sm,
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  programName: {
    flex: 1,
    fontSize: font.body,
    color: colors.textSecondary,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  fact: {
    width: '48%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  factLabel: {
    fontSize: font.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  factValue: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  factMissing: {
    fontWeight: '400',
    color: colors.textFaint,
  },
  sourceHint: {
    marginTop: spacing.sm,
  },
  updated: {
    fontSize: font.small,
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryLinkText: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.primary,
  },
})
