import { useState, useMemo, useEffect } from 'react'
import { ScrollView, Text, View, Pressable, TextInput, StyleSheet, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuthStore, useStudentStore } from '../../store'
import { getStatusColor, calculateDaysRemaining } from '../../data/studentData'
import { PremiumHeader } from '../../components/ui'
import { trackCappedStudentActivitySafe } from '../../services'
import { Feather } from '@expo/vector-icons'

const DATE_RANGE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: '3 Months', value: '3months' },
] as const

export default function DeadlineScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  const admissions = useStudentStore(state => state.admissions)
  const notifications = useStudentStore(state => state.notifications)
  const toggleAlert = useStudentStore(state => state.toggleAlert)

  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [pendingAlertIds, setPendingAlertIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 220)

    return () => clearTimeout(timer)
  }, [searchInput])

  const universities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.university))).sort()
  }, [admissions])

  const cities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.city).filter(Boolean))).sort()
  }, [admissions])

  const filteredDeadlines = useMemo(() => {
    let filtered = admissions.map(a => ({
      ...a,
      daysRemaining: calculateDaysRemaining(a.deadline),
    }))

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.university.toLowerCase().includes(query) ||
        a.program.toLowerCase().includes(query)
      )
    }

    if (universityFilter) {
      filtered = filtered.filter(a => a.university === universityFilter)
    }

    if (cityFilter) {
      filtered = filtered.filter(a => a.city === cityFilter)
    }

    if (dateRangeFilter) {
      filtered = filtered.filter(a => {
        const daysLeft = a.daysRemaining
        if (dateRangeFilter === 'week') return daysLeft >= 0 && daysLeft <= 7
        if (dateRangeFilter === 'month') return daysLeft >= 0 && daysLeft <= 30
        if (dateRangeFilter === '3months') return daysLeft >= 0 && daysLeft <= 90
        return true
      })
    }

    filtered.sort((a, b) => a.daysRemaining - b.daysRemaining)
    return filtered
  }, [admissions, searchQuery, universityFilter, cityFilter, dateRangeFilter])

  const grouped = useMemo(() => {
    const groupByDate = (items: typeof filteredDeadlines) => {
      const groupedByDateMap: Record<string, typeof filteredDeadlines> = {}
      items.forEach((item) => {
        const date = item.deadline
        if (!groupedByDateMap[date]) {
          groupedByDateMap[date] = []
        }
        groupedByDateMap[date].push(item)
      })

      return Object.entries(groupedByDateMap).sort(
        (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
      )
    }

    const openItems = filteredDeadlines.filter(
      (item) => item.programStatus !== 'Closed' && item.daysRemaining >= 0
    )
    const closedItems = filteredDeadlines.filter(
      (item) => item.programStatus === 'Closed' || item.daysRemaining < 0
    )

    return {
      openGroups: groupByDate(openItems),
      closedGroups: groupByDate(closedItems),
    }
  }, [filteredDeadlines])

  const hasActiveFilters = Boolean(searchInput || universityFilter || cityFilter || dateRangeFilter)

  const handleReset = () => {
    setSearchInput('')
    setSearchQuery('')
    setUniversityFilter('')
    setCityFilter('')
    setDateRangeFilter('')
  }

  const handleToggleAlert = async (id: string) => {
    const admission = admissions.find((item) => item.id === id)
    const nextEnabled = !admission?.alertEnabled

    setPendingAlertIds((prev) => ({ ...prev, [id]: true }))
    try {
      await toggleAlert(id)
      void trackCappedStudentActivitySafe({
        activity_type: 'alert',
        entity_type: 'admission',
        entity_id: id,
        metadata: {
          source: 'mobile_deadline_screen',
          enabled: nextEnabled,
        },
      })
    } finally {
      setPendingAlertIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleOpenProgramDetail = (admissionId: string) => {
    void trackCappedStudentActivitySafe({
      activity_type: 'viewed',
      entity_type: 'admission',
      entity_id: admissionId,
      metadata: {
        source: 'mobile_deadline_screen',
      },
    })
    navigation.navigate('ProgramDetail', { id: admissionId })
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <PremiumHeader
        userName={user?.name || 'Student'}
        userRole="Student"
        notifications={notifications.filter(n => !n.read).length}
        onNotificationPress={() => navigation.navigate('StudentNotifications')}
        onLogout={signOut}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Upcoming Deadlines</Text>
          {hasActiveFilters && (
            <Pressable onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchInputRow}>
            <Feather name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search program or university"
              value={searchInput}
              onChangeText={setSearchInput}
              placeholderTextColor="#9CA3AF"
            />
            {searchInput.length > 0 && (
              <Pressable onPress={() => setSearchInput('')}>
                <Feather name="x-circle" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.resultCount}>{filteredDeadlines.length} result{filteredDeadlines.length === 1 ? '' : 's'}</Text>
            <Pressable
              onPress={() => setFiltersExpanded(prev => !prev)}
              style={[styles.filterToggleBtn, filtersExpanded && styles.filterToggleBtnActive]}
            >
              <Feather name="filter" size={14} color={filtersExpanded ? '#2563EB' : '#6B7280'} />
              <Text style={[styles.filterToggleText, filtersExpanded && styles.filterToggleTextActive]}>
                {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
              </Text>
            </Pressable>
          </View>
        </View>

        {filtersExpanded && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>University</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowScroll}>
              <Pressable
                style={[styles.filterChip, !universityFilter && styles.filterChipActive]}
                onPress={() => setUniversityFilter('')}
              >
                <Text style={[styles.filterChipText, !universityFilter && styles.filterChipTextActive]}>All Universities</Text>
              </Pressable>
              {universities.slice(0, 8).map((uni) => (
                <Pressable
                  key={uni}
                  style={[styles.filterChip, universityFilter === uni && styles.filterChipActive]}
                  onPress={() => setUniversityFilter(universityFilter === uni ? '' : uni)}
                >
                  <Text style={[styles.filterChipText, universityFilter === uni && styles.filterChipTextActive]}>
                    {uni}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRowScroll}>
              <Pressable
                style={[styles.filterChip, !cityFilter && styles.filterChipActive]}
                onPress={() => setCityFilter('')}
              >
                <Text style={[styles.filterChipText, !cityFilter && styles.filterChipTextActive]}>All Cities</Text>
              </Pressable>
              {cities.slice(0, 8).map((city) => (
                <Pressable
                  key={city}
                  style={[styles.filterChip, cityFilter === city && styles.filterChipActive]}
                  onPress={() => setCityFilter(cityFilter === city ? '' : city)}
                >
                  <Text style={[styles.filterChipText, cityFilter === city && styles.filterChipTextActive]}>{city}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Time Range</Text>
            <View style={styles.filterWrapRow}>
              {DATE_RANGE_OPTIONS.map((range) => (
                <Pressable
                  key={range.value}
                  style={[styles.filterChip, dateRangeFilter === range.value && styles.filterChipActive]}
                  onPress={() => setDateRangeFilter(range.value)}
                >
                  <Text style={[styles.filterChipText, dateRangeFilter === range.value && styles.filterChipTextActive]}>
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {filteredDeadlines.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={52} color="#9CA3AF" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Deadlines Found</Text>
            <Text style={styles.emptyText}>Try adjusting search or filters.</Text>
          </View>
        ) : (
          <>
            {grouped.openGroups.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
                {grouped.openGroups.map(([date, deadlines]) => (
                  <View key={`open-${date}`} style={styles.dateGroup}>
                    <Text style={styles.dateHeader}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>

                    {deadlines.map((deadline) => {
                      const statusColors = getStatusColor(deadline.status)
                      const isUrgent = deadline.daysRemaining <= 7

                      return (
                        <Pressable
                          key={deadline.id}
                          style={styles.deadlineCard}
                          onPress={() => handleOpenProgramDetail(deadline.id)}
                        >
                          <View style={styles.deadlineHeader}>
                            <View style={[styles.universityLogo, { backgroundColor: deadline.logoBg }]}>
                              <Text style={styles.universityLogoText}>
                                {deadline.university.substring(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.deadlineInfo}>
                              <Text style={styles.universityName} numberOfLines={1}>{deadline.university}</Text>
                              <Text style={styles.programName} numberOfLines={1}>{deadline.program}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>{deadline.status}</Text>
                            </View>
                          </View>

                          <View style={styles.deadlineDetails}>
                            <View style={styles.detailRow}>
                              <Feather name="book-open" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={styles.detailText}>{deadline.degree}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={styles.detailText}>{deadline.deadlineDisplay}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Feather name="clock" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={[styles.detailText, isUrgent && styles.urgentText]}>
                                {`${deadline.daysRemaining} days left`}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.deadlineFooter}>
                            <View style={styles.alertToggle}>
                              <Feather name="bell" size={14} color="#374151" />
                              <Text style={styles.alertText}>Alert</Text>
                              <Switch
                                value={deadline.alertEnabled === true}
                                onValueChange={() => void handleToggleAlert(deadline.id)}
                                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                                thumbColor="#FFFFFF"
                                disabled={pendingAlertIds[deadline.id] === true}
                              />
                              {pendingAlertIds[deadline.id] && (
                                <Text style={styles.pendingText}>Updating...</Text>
                              )}
                            </View>
                            <View style={styles.viewLinkRow}>
                              <Text style={styles.viewLink}>View Details</Text>
                              <Feather name="arrow-right" size={14} color="#2563EB" />
                            </View>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ))}
              </View>
            )}

            {grouped.closedGroups.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitleMuted}>Closed / Passed</Text>
                {grouped.closedGroups.map(([date, deadlines]) => (
                  <View key={`closed-${date}`} style={styles.dateGroup}>
                    <Text style={styles.dateHeaderMuted}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>

                    {deadlines.map((deadline) => {
                      const statusColors = getStatusColor(deadline.status)

                      return (
                        <Pressable
                          key={deadline.id}
                          style={[styles.deadlineCard, styles.deadlineCardClosed]}
                          onPress={() => handleOpenProgramDetail(deadline.id)}
                        >
                          <View style={styles.deadlineHeader}>
                            <View style={[styles.universityLogo, { backgroundColor: deadline.logoBg }]}>
                              <Text style={styles.universityLogoText}>
                                {deadline.university.substring(0, 2).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.deadlineInfo}>
                              <Text style={styles.universityName} numberOfLines={1}>{deadline.university}</Text>
                              <Text style={styles.programName} numberOfLines={1}>{deadline.program}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>{deadline.status}</Text>
                            </View>
                          </View>

                          <View style={styles.deadlineDetails}>
                            <View style={styles.detailRow}>
                              <Feather name="book-open" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={styles.detailText}>{deadline.degree}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={[styles.detailText, styles.closedText]}>{deadline.deadlineDisplay}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Feather name="clock" size={16} color="#6B7280" style={styles.detailIcon} />
                              <Text style={[styles.detailText, styles.closedText]}>Deadline Passed</Text>
                            </View>
                          </View>

                          <View style={styles.deadlineFooter}>
                            <View style={styles.alertToggle}>
                              <Feather name="bell" size={14} color="#374151" />
                              <Text style={styles.alertText}>Alert</Text>
                              <Switch
                                value={deadline.alertEnabled === true}
                                onValueChange={() => void handleToggleAlert(deadline.id)}
                                trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                                thumbColor="#FFFFFF"
                                disabled={pendingAlertIds[deadline.id] === true}
                              />
                              {pendingAlertIds[deadline.id] && (
                                <Text style={styles.pendingText}>Updating...</Text>
                              )}
                            </View>
                            <View style={styles.viewLinkRow}>
                              <Text style={styles.viewLink}>View Details</Text>
                              <Feather name="arrow-right" size={14} color="#2563EB" />
                            </View>
                          </View>
                        </Pressable>
                      )
                    })}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  resetText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 10,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterToggleBtnActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterToggleTextActive: {
    color: '#2563EB',
  },
  filterSection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterRowScroll: {
    paddingBottom: 4,
    gap: 8,
  },
  filterWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  sectionTitleMuted: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10,
  },
  dateGroup: {
    marginBottom: 14,
  },
  dateHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  dateHeaderMuted: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  deadlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deadlineCardClosed: {
    opacity: 0.65,
  },
  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  universityLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  universityLogoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deadlineInfo: {
    flex: 1,
    marginRight: 8,
  },
  universityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  programName: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  deadlineDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  urgentText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  closedText: {
    color: '#9CA3AF',
  },
  deadlineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  alertToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 14,
    marginRight: 8,
    marginLeft: 6,
  },
  pendingText: {
    marginLeft: 6,
    fontSize: 11,
    color: '#6B7280',
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
})
