import { useCallback, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore, useSavedAdmissions } from '../../store'
import { useStudentDashboardData } from '../../hooks/useStudentDashboardData'
import { isOpen, sortByDeadline, type StudentAdmission } from '../../domain/admission'
import { StudentScreen, EmptyState } from '../../components/ui'
import AdmissionCard from '../../components/admission/AdmissionCard'
import CompareTray, { useCompareSelection } from '../../components/admission/CompareTray'
import { showErrorToast } from '../../services/toast'
import { colors, font, radius, spacing } from '../../theme'


export default function WatchlistScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const saved = useSavedAdmissions()
  const setSaved = useStudentStore((state) => state.setSaved)
  const setAlert = useStudentStore((state) => state.setAlert)
  const { loading, refetch } = useStudentDashboardData()

  const [query, setQuery] = useState('')
  const compare = useCompareSelection()
  const [pending, setPending] = useState<Record<string, boolean>>({})

  // The watchlist can change on other devices or the web app.
  useFocusEffect(
    useCallback(() => {
      void refetch()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    const filtered = text
      ? saved.filter((a) => a.program.toLowerCase().includes(text) || a.university.toLowerCase().includes(text))
      : saved
    return sortByDeadline(filtered)
  }, [saved, query])

  const openCount = saved.filter(isOpen).length
  const remindersOn = saved.filter((a) => a.alertEnabled).length

  const withPending = async (id: string, action: () => Promise<boolean>, failure: string) => {
    setPending((p) => ({ ...p, [id]: true }))
    const ok = await action()
    setPending((p) => ({ ...p, [id]: false }))
    if (!ok) showErrorToast(failure, 'Check your connection and try again.')
  }

  const remove = (admission: StudentAdmission) => {
    compare.remove(admission.id)
    void withPending(admission.id, () => setSaved(admission.id, false), 'Could not remove program')
  }

  return (
    <StudentScreen refreshing={loading} onRefresh={() => void refetch()} top={<CompareTray ids={compare.ids} onClear={compare.clear} />}>
      <Text style={styles.heading}>Saved programs</Text>
      <Text style={styles.summary}>
        {saved.length} saved · {openCount} open · {remindersOn} with reminders
      </Text>

      {saved.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No saved programs yet"
          message="Save programs to track their deadlines and get reminders."
          actionLabel="Browse admissions"
          onAction={() => navigation.reset({ index: 0, routes: [{ name: 'StudentSearch' }] })}
        />
      ) : (
        <>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color={colors.textFaint} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved programs"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              accessibilityLabel="Search saved programs"
            />
          </View>

          {visible.length === 0 ? (
            <EmptyState icon="search" title="No saved programs match your search" />
          ) : (
            visible.map((admission) => (
              <AdmissionCard
                key={admission.id}
                admission={admission}
                onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
                onToggleCompare={() => compare.toggle(admission.id)}
                comparing={compare.ids.includes(admission.id)}
                footer={
                  <View style={styles.footer}>
                    <View style={styles.reminder}>
                      <Feather name="bell" size={14} color={colors.textSecondary} />
                      <Text style={styles.reminderText}>Deadline reminders</Text>
                      <Switch
                        value={admission.alertEnabled}
                        disabled={pending[admission.id] || !isOpen(admission)}
                        onValueChange={(value) =>
                          void withPending(admission.id, () => setAlert(admission.id, value), 'Reminder not updated')
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        accessibilityLabel="Deadline reminders"
                      />
                    </View>
                    <Pressable
                      onPress={() => remove(admission)}
                      disabled={pending[admission.id]}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${admission.program} from saved`}
                    >
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                }
              />
            ))
          )}
        </>
      )}
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
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: font.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reminder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reminderText: {
    flex: 1,
    fontSize: font.small,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  remove: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.danger,
  },
})
