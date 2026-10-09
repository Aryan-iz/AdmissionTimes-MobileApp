import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore, useSavedAdmissions } from '../../store'
import { isOpen, SOURCE_LABEL, type StudentAdmission } from '../../domain/admission'
import { daysLeftLabel } from '../../domain/dates'
import { aiService, type AiCompareResponse } from '../../services/aiService'
import { trackCappedStudentActivitySafe } from '../../services'
import { StudentScreen, Section, CustomLoader, Badge } from '../../components/ui'
import AdmissionRow from '../../components/admission/AdmissionRow'
import UniversityAvatar from '../../components/admission/UniversityAvatar'
import { colors, font, radius, spacing } from '../../theme'

const MAX_COMPARE = 4
const COLUMN_WIDTH = 168
const LABEL_WIDTH = 104

type CompareRoute = RouteProp<RootStackParamList, 'StudentCompare'>

const ROWS: Array<{ label: string; value: (a: StudentAdmission) => string }> = [
  { label: 'Status', value: (a) => a.programStatus },
  { label: 'Deadline', value: (a) => a.deadlineDisplay },
  { label: 'Time left', value: (a) => daysLeftLabel(a.daysRemaining, a.hasDeadline) },
  { label: 'Degree', value: (a) => a.degree ?? 'Not specified' },
  { label: 'Fee', value: (a) => a.fee },
  { label: 'Location', value: (a) => a.location ?? 'Not specified' },
  { label: 'Study mode', value: (a) => a.deliveryMode ?? 'Not specified' },
  { label: 'Duration', value: (a) => a.duration ?? 'Not specified' },
  { label: 'Source', value: (a) => SOURCE_LABEL[a.source] },
]

export default function CompareScreen() {
  const route = useRoute<CompareRoute>()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const admissions = useStudentStore((state) => state.admissions)
  const ensureAdmission = useStudentStore((state) => state.ensureAdmission)
  const saved = useSavedAdmissions()

  const [ids, setIds] = useState<string[]>(() => (route.params?.ids ?? []).slice(0, MAX_COMPARE))
  const [loading, setLoading] = useState(true)
  const [ai, setAi] = useState<AiCompareResponse | null>(null)
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle')

  // Programs opened from search may not be in the store yet.
  const idsKey = ids.join(',')
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(ids.map((id) => ensureAdmission(id))).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
    // ids is represented by idsKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, ensureAdmission])

  const selected = useMemo(
    () => ids.map((id) => admissions.find((a) => a.id === id)).filter((a): a is StudentAdmission => Boolean(a)),
    [ids, admissions]
  )

  // Suggestions to add: saved programs first, then other open programs.
  const candidates = useMemo(() => {
    const pool = [...saved, ...admissions.filter(isOpen)]
    const seen = new Set(ids)
    return pool.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true))).slice(0, 8)
  }, [saved, admissions, ids])

  // A new selection invalidates the previous AI comparison.
  useEffect(() => {
    setAi(null)
    setAiState('idle')
  }, [idsKey])

  const add = (id: string) => setIds((prev) => (prev.length >= MAX_COMPARE || prev.includes(id) ? prev : [...prev, id]))
  const remove = (id: string) => setIds((prev) => prev.filter((x) => x !== id))

  const runAiCompare = async () => {
    setAiState('loading')
    try {
      const response = await aiService.compare(selected.map((a) => a.id))
      setAi(response.data)
      setAiState('idle')
      void trackCappedStudentActivitySafe({
        activity_type: 'compared',
        entity_type: 'admission',
        entity_id: selected[0].id,
        metadata: { source: 'mobile_compare', admission_ids: selected.map((a) => a.id) },
      })
    } catch {
      setAiState('error')
    }
  }

  if (loading) {
    return (
      <StudentScreen title="Compare Programs" scroll={false}>
        <View style={styles.center}>
          <CustomLoader size={48} color={colors.primary} />
        </View>
      </StudentScreen>
    )
  }

  return (
    <StudentScreen title="Compare Programs">
      {selected.length >= 2 ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={styles.labelCell} />
                {selected.map((a) => (
                  <View key={a.id} style={styles.headCell}>
                    <View style={styles.headTop}>
                      <UniversityAvatar name={a.university} size={32} />
                      <Pressable onPress={() => remove(a.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${a.program}`}>
                        <Feather name="x" size={16} color={colors.textFaint} />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => navigation.navigate('ProgramDetail', { id: a.id })} accessibilityRole="link">
                      <Text style={styles.headProgram} numberOfLines={3}>
                        {a.program}
                      </Text>
                    </Pressable>
                    <Text style={styles.headUniversity} numberOfLines={2}>
                      {a.university}
                    </Text>
                  </View>
                ))}
              </View>
              {ROWS.map((row, index) => (
                <View key={row.label} style={[styles.row, index % 2 === 0 && styles.rowStriped]}>
                  <Text style={styles.labelCell}>{row.label}</Text>
                  {selected.map((a) => {
                    const value = row.value(a)
                    return (
                      <Text key={a.id} style={[styles.valueCell, value === 'Not specified' && styles.missing]}>
                        {value}
                      </Text>
                    )
                  })}
                </View>
              ))}
            </View>
          </ScrollView>

          <Section title="AI comparison">
            {ai ? (
              <>
                <Text style={styles.paragraph}>{ai.summary}</Text>
                {ai.highlights.map((highlight) => (
                  <View key={highlight} style={styles.highlight}>
                    <Feather name="check" size={14} color={colors.primary} />
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
                <View style={styles.aiMeta}>
                  <Badge label={ai.method === 'ai' ? 'AI generated' : 'Rule-based summary'} tone="neutral" />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.muted}>Get a short comparison based on the programs’ published details.</Text>
                <Pressable
                  style={[styles.aiButton, aiState === 'loading' && styles.aiButtonBusy]}
                  onPress={() => void runAiCompare()}
                  disabled={aiState === 'loading'}
                  accessibilityRole="button"
                  accessibilityLabel="Compare with AI"
                >
                  <Feather name="zap" size={16} color="#FFFFFF" />
                  <Text style={styles.aiButtonText}>{aiState === 'loading' ? 'Comparing…' : 'Compare with AI'}</Text>
                </Pressable>
                {aiState === 'error' ? <Text style={styles.error}>The AI comparison is unavailable right now. Try again later.</Text> : null}
              </>
            )}
          </Section>
        </>
      ) : (
        <Section title="Choose programs">
          <Text style={styles.muted}>
            Select {2 - selected.length} more program{2 - selected.length === 1 ? '' : 's'} to compare (up to {MAX_COMPARE}).
          </Text>
          {selected.map((a) => (
            <AdmissionRow
              key={a.id}
              admission={a}
              onPress={() => remove(a.id)}
              trailing={<Badge label="Selected" tone="primary" icon="check" />}
            />
          ))}
        </Section>
      )}

      {selected.length < MAX_COMPARE && candidates.length > 0 ? (
        <Section title={saved.length > 0 ? 'Add from saved and open programs' : 'Add open programs'}>
          {candidates.map((a) => (
            <AdmissionRow
              key={a.id}
              admission={a}
              onPress={() => add(a.id)}
              trailing={<Feather name="plus-circle" size={20} color={colors.primary} />}
            />
          ))}
        </Section>
      ) : null}
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableScroll: {
    marginBottom: spacing.lg,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  rowStriped: {
    backgroundColor: colors.bg,
  },
  labelCell: {
    width: LABEL_WIDTH,
    padding: spacing.md,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
  },
  headCell: {
    width: COLUMN_WIDTH,
    padding: spacing.md,
    gap: spacing.xs,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  headTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headProgram: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.primary,
  },
  headUniversity: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  valueCell: {
    width: COLUMN_WIDTH,
    padding: spacing.md,
    fontSize: font.small,
    color: colors.text,
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  missing: {
    color: colors.textFaint,
  },
  paragraph: {
    fontSize: font.body,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  muted: {
    fontSize: font.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  highlight: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  highlightText: {
    flex: 1,
    fontSize: font.body,
    color: colors.textSecondary,
  },
  aiMeta: {
    marginTop: spacing.md,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  aiButtonBusy: {
    opacity: 0.6,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: font.body,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: font.small,
    color: colors.danger,
  },
})
