import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Feather } from '@expo/vector-icons'

import type { RootStackParamList } from '../../navigation/types'
import { useStudentStore } from '../../store'
import { useStudentDashboardData } from '../../hooks/useStudentDashboardData'
import { SOURCE_LABEL, type DataSource, type ProgramStatus, type StudentAdmission } from '../../domain/admission'
import { StudentScreen, EmptyState, Chip, CustomLoader } from '../../components/ui'
import AdmissionCard from '../../components/admission/AdmissionCard'
import CompareTray, { useCompareSelection } from '../../components/admission/CompareTray'
import { showErrorToast } from '../../services/toast'
import { trackCappedStudentActivitySafe } from '../../services'
import { colors, font, radius, spacing } from '../../theme'

const SEARCH_DEBOUNCE_MS = 300

type StatusFilter = 'all' | ProgramStatus
type SourceFilter = 'all' | DataSource

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Open', label: 'Open' },
  { value: 'Closing Soon', label: 'Closing soon' },
  { value: 'Closed', label: 'Closed' },
]

const SOURCE_OPTIONS: Array<{ value: SourceFilter; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'university', label: SOURCE_LABEL.university },
  { value: 'scraper', label: SOURCE_LABEL.scraper },
]

const unique = (values: Array<string | null>) =>
  Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b))

export default function SearchAdmissionsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const catalog = useStudentStore((state) => state.admissions)
  const watchlist = useStudentStore((state) => state.watchlist)
  const searchAdmissions = useStudentStore((state) => state.searchAdmissions)
  const setSaved = useStudentStore((state) => state.setSaved)
  const { loading, refetch } = useStudentDashboardData()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentAdmission[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [source, setSource] = useState<SourceFilter>('all')
  const [university, setUniversity] = useState('')
  const [degree, setDegree] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const compare = useCompareSelection()

  // Text search goes to the API (title, university, description, ...); filters apply locally.
  useEffect(() => {
    const text = query.trim()
    if (!text) {
      setSearchResults(null)
      setSearching(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(() => {
      searchAdmissions({ search: text })
        .then((results) => {
          if (cancelled) return
          setSearchResults(results)
          // Activity entity ids must be admission UUIDs: record the top result.
          if (text.length >= 2 && results[0]) {
            void trackCappedStudentActivitySafe({
              activity_type: 'searched',
              entity_type: 'admission',
              entity_id: results[0].id,
              metadata: { source: 'mobile_search', query: text, result_count: results.length },
            })
          }
        })
        .catch(() => {
          if (!cancelled) setSearchResults([])
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, searchAdmissions])

  // Search results carry their own watch state snapshot; keep it in sync with saves.
  const base = useMemo(() => {
    const list = searchResults ?? catalog
    return list.map((a) => {
      const entry = watchlist[a.id]
      return entry ? { ...a, saved: true, alertEnabled: entry.alertOptIn } : { ...a, saved: false, alertEnabled: false }
    })
  }, [searchResults, catalog, watchlist])

  const universities = useMemo(() => unique(catalog.map((a) => a.university)), [catalog])
  const degrees = useMemo(() => unique(catalog.map((a) => a.degree)), [catalog])

  const results = useMemo(
    () =>
      base.filter(
        (a) =>
          (status === 'all' || a.programStatus === status) &&
          (source === 'all' || a.source === source) &&
          (!university || a.university === university) &&
          (!degree || a.degree === degree)
      ),
    [base, status, source, university, degree]
  )

  const activeFilters = [status !== 'all', source !== 'all', Boolean(university), Boolean(degree)].filter(Boolean).length

  const resetFilters = () => {
    setStatus('all')
    setSource('all')
    setUniversity('')
    setDegree('')
  }

  const toggleSave = async (admission: StudentAdmission) => {
    const ok = await setSaved(admission.id, !admission.saved)
    if (!ok) showErrorToast('Could not update saved programs', 'Check your connection and try again.')
  }

  return (
    <StudentScreen refreshing={loading} onRefresh={() => void refetch()} top={<CompareTray ids={compare.ids} onClear={compare.clear} />}>
      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search programs or universities"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          accessibilityLabel="Search admissions"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <Feather name="x-circle" size={16} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.count}>
          {searching ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
        </Text>
        <Pressable
          style={[styles.filterToggle, filtersOpen && styles.filterToggleActive]}
          onPress={() => setFiltersOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityState={{ expanded: filtersOpen }}
        >
          <Feather name="sliders" size={14} color={filtersOpen ? colors.primary : colors.textSecondary} />
          <Text style={[styles.filterToggleText, filtersOpen && styles.filterToggleTextActive]}>
            Filters{activeFilters ? ` (${activeFilters})` : ''}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_OPTIONS.map((option) => (
          <Chip key={option.value} label={option.label} active={status === option.value} onPress={() => setStatus(option.value)} />
        ))}
      </ScrollView>

      {filtersOpen ? (
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Source</Text>
          <View style={styles.wrap}>
            {SOURCE_OPTIONS.map((option) => (
              <Chip key={option.value} label={option.label} active={source === option.value} onPress={() => setSource(option.value)} />
            ))}
          </View>

          <Text style={styles.filterLabel}>University</Text>
          <View style={styles.wrap}>
            <Chip label="All" active={!university} onPress={() => setUniversity('')} />
            {universities.map((name) => (
              <Chip key={name} label={name} active={university === name} onPress={() => setUniversity(university === name ? '' : name)} />
            ))}
          </View>

          {degrees.length > 0 ? (
            <>
              <Text style={styles.filterLabel}>Degree</Text>
              <View style={styles.wrap}>
                <Chip label="All" active={!degree} onPress={() => setDegree('')} />
                {degrees.map((name) => (
                  <Chip key={name} label={name} active={degree === name} onPress={() => setDegree(degree === name ? '' : name)} />
                ))}
              </View>
            </>
          ) : null}

          {activeFilters > 0 ? (
            <Pressable onPress={resetFilters} style={styles.reset} accessibilityRole="button">
              <Text style={styles.resetText}>Reset filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {searching && results.length === 0 ? (
        <View style={styles.loading}>
          <CustomLoader size={40} color={colors.primary} />
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title="No admissions found"
          message={query || activeFilters ? 'Try a different search or fewer filters.' : 'No verified admissions are published yet.'}
          actionLabel={activeFilters ? 'Reset filters' : undefined}
          onAction={activeFilters ? resetFilters : undefined}
        />
      ) : (
        results.map((admission) => (
          <AdmissionCard
            key={admission.id}
            admission={admission}
            onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
            onToggleSave={() => void toggleSave(admission)}
            onToggleCompare={() => compare.toggle(admission.id)}
            comparing={compare.ids.includes(admission.id)}
          />
        ))
      )}
    </StudentScreen>
  )
}

const styles = StyleSheet.create({
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
  },
  searchInput: {
    flex: 1,
    fontSize: font.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  count: {
    fontSize: font.body,
    color: colors.textMuted,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterToggleText: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterToggleTextActive: {
    color: colors.primary,
  },
  chips: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  filters: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterLabel: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reset: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  resetText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: font.body,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
})
