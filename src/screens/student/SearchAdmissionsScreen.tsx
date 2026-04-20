import { useState, useMemo, useEffect, useRef } from 'react'
import { ScrollView, Text, View, Pressable, TextInput, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuthStore, useStudentStore } from '../../store'
import { getStatusColor } from '../../data/studentData'
import { PremiumHeader, CustomLoader } from '../../components/ui'
import { trackCappedStudentActivitySafe } from '../../services'
import { Feather } from '@expo/vector-icons'

export default function SearchAdmissionsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  const admissions = useStudentStore(state => state.admissions)
  const savedIds = useStudentStore(state => state.savedAdmissions)
  const notifications = useStudentStore(state => state.notifications)
  const toggleSaved = useStudentStore(state => state.toggleSaved)
  const searchAdmissions = useStudentStore(state => state.searchAdmissions)
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [searchResults, setSearchResults] = useState(admissions)
  const lastTrackedQueryRef = useRef<string>('')

  useEffect(() => {
    setSearchResults(admissions)
  }, [admissions])

  const universities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.university))).sort()
  }, [admissions])

  const cities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.city).filter(Boolean))).sort()
  }, [admissions])

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setUniversityFilter('')
    setCityFilter('')
    setSelectedStatus([])
  }

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    const shouldUseApiSearch = trimmedQuery.length > 0 || cityFilter.length > 0

    if (!shouldUseApiSearch) {
      setSearchResults(admissions)
      return
    }

    let isCancelled = false
    setIsLoadingResults(true)

    const timer = setTimeout(() => {
      searchAdmissions({
        search: trimmedQuery || undefined,
        city: cityFilter || undefined,
        limit: 100,
      })
        .then(results => {
          if (!isCancelled) {
            setSearchResults(results)
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingResults(false)
          }
        })
    }, 250)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [admissions, cityFilter, searchAdmissions, searchQuery])

  const filteredAdmissions = useMemo(() => {
    let filtered = [...searchResults]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.university.toLowerCase().includes(query) ||
        a.program.toLowerCase().includes(query) ||
        a.degree.toLowerCase().includes(query)
      )
    }

    if (universityFilter) {
      filtered = filtered.filter(a => a.university === universityFilter)
    }

    if (cityFilter) {
      filtered = filtered.filter(a => a.city === cityFilter)
    }

    if (selectedStatus.length > 0) {
      filtered = filtered.filter(a => selectedStatus.includes(a.status))
    }

    return filtered
  }, [searchResults, searchQuery, universityFilter, cityFilter, selectedStatus])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length > 0 || cityFilter.length > 0) {
      return
    }

    setIsLoadingResults(true)
    const timer = setTimeout(() => setIsLoadingResults(false), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, universityFilter, cityFilter, selectedStatus, admissions.length])

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else if (prev.length < 4) {
        return [...prev, id]
      } else {
        return prev
      }
    })
  }

  const handleCompare = () => {
    if (compareIds.length >= 2) {
      void trackCappedStudentActivitySafe({
        activity_type: 'compared',
        entity_type: 'admission_set',
        entity_id: compareIds.join(','),
        metadata: {
          source: 'mobile_search_admissions',
          compare_count: compareIds.length,
        },
      })
      navigation.navigate('StudentCompare', { ids: compareIds })
    }
  }

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) return

    const primaryAdmissionId = filteredAdmissions[0]?.id
    if (!primaryAdmissionId) return

    const queryKey = `${query.toLowerCase()}|${cityFilter}`
    if (queryKey === lastTrackedQueryRef.current) return

    lastTrackedQueryRef.current = queryKey
    void trackCappedStudentActivitySafe({
      activity_type: 'searched',
      entity_type: 'admission',
      entity_id: primaryAdmissionId,
      metadata: {
        source: 'mobile_search_admissions',
        query,
        city_filter: cityFilter || null,
        result_count: filteredAdmissions.length,
      },
    })
  }, [searchQuery, cityFilter, filteredAdmissions])

  const trackOpenProgramDetail = (admissionId: string) => {
    void trackCappedStudentActivitySafe({
      activity_type: 'viewed',
      entity_type: 'admission',
      entity_id: admissionId,
      metadata: {
        source: 'mobile_search_admissions',
      },
    })
    navigation.navigate('ProgramDetail', { id: admissionId })
  }

  const trackToggleCompare = (admissionId: string) => {
    void trackCappedStudentActivitySafe({
      activity_type: 'compared',
      entity_type: 'admission',
      entity_id: admissionId,
      metadata: {
        source: 'mobile_search_admissions',
      },
    })
    toggleCompare(admissionId)
  }

  const trackToggleSaved = (admissionId: string, currentlySaved: boolean) => {
    void toggleSaved(admissionId)
    void trackCappedStudentActivitySafe({
      activity_type: 'saved',
      entity_type: 'admission',
      entity_id: admissionId,
      metadata: {
        source: 'mobile_search_admissions',
        saved: !currentlySaved,
      },
    })
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
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputRow}>
            <Feather name="search" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search programs, universities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFiltersVisible(!filtersVisible)}
          >
            <Text style={styles.filterButtonText}>
              {filtersVisible ? 'Hide' : 'Show'} Filters
            </Text>
          </Pressable>

          <Text style={styles.resultCount}>
            {filteredAdmissions.length} Result{filteredAdmissions.length !== 1 ? 's' : ''}
          </Text>

          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'grid' && styles.viewButtonTextActive]}>Grid</Text>
            </Pressable>
            <Pressable
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextActive]}>List</Text>
            </Pressable>
          </View>
        </View>

        {/* Compare Bar */}
        {compareIds.length > 0 && (
          <View style={styles.compareBar}>
            <Text style={styles.compareText}>{compareIds.length} selected</Text>
            <Pressable
              style={[styles.compareButton, compareIds.length < 2 && styles.compareButtonDisabled]}
              onPress={handleCompare}
              disabled={compareIds.length < 2}
            >
              <Text style={styles.compareButtonText}>Compare ({compareIds.length})</Text>
            </Pressable>
          </View>
        )}

        {/* Filters */}
        {filtersVisible && (
          <View style={styles.filtersCard}>
            <Text style={styles.filtersTitle}>Filters</Text>

            {/* University Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>University</Text>
              <View style={styles.filterChips}>
                <Pressable
                  style={[styles.filterChip, !universityFilter && styles.filterChipActive]}
                  onPress={() => setUniversityFilter('')}
                >
                  <Text style={[styles.filterChipText, !universityFilter && styles.filterChipTextActive]}>All</Text>
                </Pressable>
                {universities.slice(0, 5).map(uni => (
                  <Pressable
                    key={uni}
                    style={[styles.filterChip, universityFilter === uni && styles.filterChipActive]}
                    onPress={() => setUniversityFilter(universityFilter === uni ? '' : uni)}
                  >
                    <Text style={[styles.filterChipText, universityFilter === uni && styles.filterChipTextActive]} numberOfLines={1}>{uni}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* City Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>City</Text>
              <View style={styles.filterChips}>
                <Pressable
                  style={[styles.filterChip, !cityFilter && styles.filterChipActive]}
                  onPress={() => setCityFilter('')}
                >
                  <Text style={[styles.filterChipText, !cityFilter && styles.filterChipTextActive]}>All</Text>
                </Pressable>
                {cities.map(city => (
                  <Pressable
                    key={city}
                    style={[styles.filterChip, cityFilter === city && styles.filterChipActive]}
                    onPress={() => setCityFilter(cityFilter === city ? '' : city)}
                  >
                    <Text style={[styles.filterChipText, cityFilter === city && styles.filterChipTextActive]}>{city}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterChips}>
                {['Verified', 'Pending', 'Updated'].map(status => (
                  <Pressable
                    key={status}
                    style={[styles.filterChip, selectedStatus.includes(status) && styles.filterChipActive]}
                    onPress={() => toggleStatus(status)}
                  >
                    <Text style={[styles.filterChipText, selectedStatus.includes(status) && styles.filterChipTextActive]}>{status}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable style={styles.resetButton} onPress={handleResetFilters}>
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </Pressable>
          </View>
        )}

        {/* Results */}
        {isLoadingResults ? (
          <View style={styles.loadingResults}>
            <CustomLoader size={40} color="#2563EB" />
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredAdmissions.map((admission) => {
              const statusColors = getStatusColor(admission.status)
              const isSaved = savedIds.includes(admission.id)
              const isComparing = compareIds.includes(admission.id)
              const daysLeft = admission.daysRemaining

              return (
                <View key={admission.id} style={styles.gridCard}>
                  <Pressable
                    style={styles.gridCardInner}
                    onPress={() => trackOpenProgramDetail(admission.id)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.universityLogo, { backgroundColor: admission.logoBg }]}>
                        <Text style={styles.universityLogoText}>
                          {admission.university.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                          {admission.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.universityName} numberOfLines={1}>{admission.university}</Text>
                    <Text style={styles.programName} numberOfLines={2}>{admission.program}</Text>

                    <View style={styles.cardDetails}>
                      <Text style={[styles.detailText, daysLeft <= 7 && styles.urgentText]}>
                        {admission.deadlineDisplay}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          trackToggleCompare(admission.id)
                        }}
                      >
                        <Feather name="shuffle" size={18} color={isComparing ? '#2563EB' : '#6B7280'} />
                      </Pressable>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          trackToggleSaved(admission.id, isSaved)
                        }}
                      >
                        <Feather name="star" size={18} color={isSaved ? '#2563EB' : '#6B7280'} />
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredAdmissions.map((admission) => {
              const statusColors = getStatusColor(admission.status)
              const isSaved = savedIds.includes(admission.id)
              const isComparing = compareIds.includes(admission.id)
              const daysLeft = admission.daysRemaining

              return (
                <Pressable
                  key={admission.id}
                  style={styles.listCard}
                  onPress={() => trackOpenProgramDetail(admission.id)}
                >
                  <View style={styles.listCardContent}>
                    <View style={[styles.universityLogo, { backgroundColor: admission.logoBg }]}>
                      <Text style={styles.universityLogoText}>
                        {admission.university.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.listCardInfo}>
                      <Text style={styles.programName} numberOfLines={1}>{admission.program}</Text>
                      <Text style={styles.universityName} numberOfLines={1}>{admission.university} • {admission.degree}</Text>
                      <View style={styles.listCardMeta}>
                        <Text style={[styles.detailText, daysLeft <= 7 && styles.urgentText]}>
                          {admission.deadlineDisplay}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.listCardActions}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, marginBottom: 8 }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {admission.status}
                      </Text>
                    </View>
                    <View style={styles.listActionButtons}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          trackToggleCompare(admission.id)
                        }}
                      >
                        <Feather name="shuffle" size={18} color={isComparing ? '#2563EB' : '#6B7280'} />
                      </Pressable>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          trackToggleSaved(admission.id, isSaved)
                        }}
                      >
                        <Feather name="star" size={18} color={isSaved ? '#2563EB' : '#6B7280'} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}

        {filteredAdmissions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No admissions found</Text>
            <Pressable style={styles.resetButton} onPress={handleResetFilters}>
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </Pressable>
          </View>
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
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    marginRight: 12,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  loadingResults: {
    padding: 32,
    alignItems: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  viewButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  viewButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#2563EB',
  },
  compareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  compareText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '600',
  },
  compareButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    margin: 4,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridCard: {
    width: '50%',
    padding: 6,
  },
  gridCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  universityLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  universityLogoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  universityName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  programName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 36,
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  urgentText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  actionIconActive: {
    opacity: 1,
    color: '#2563EB',
  },
  listContainer: {
    marginBottom: 16,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listCardContent: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  listCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listCardMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  listCardActions: {
    alignItems: 'flex-end',
  },
  listActionButtons: {
    flexDirection: 'row',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
})

