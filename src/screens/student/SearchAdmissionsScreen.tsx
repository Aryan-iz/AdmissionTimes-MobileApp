import { useState, useMemo } from 'react'
import { ScrollView, Text, View, Pressable, TextInput, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentData } from '../../contexts/StudentDataContext'
import { getStatusColor, calculateDaysRemaining } from '../../data/studentData'
import { Header } from '../../components/ui'

export default function SearchAdmissionsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { user, logout } = useAuth()
  const { admissions, toggleSaved } = useStudentData()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])

  const savedIds = useMemo(() => admissions.filter(a => a.saved).map(a => a.id), [admissions])

  const universities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.university))).sort()
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
    setDegreeFilter('')
    setSelectedStatus([])
  }

  const filteredAdmissions = useMemo(() => {
    let filtered = [...admissions]

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

    if (degreeFilter) {
      filtered = filtered.filter(a => a.degreeType === degreeFilter)
    }

    if (selectedStatus.length > 0) {
      filtered = filtered.filter(a => selectedStatus.includes(a.status))
    }

    return filtered
  }, [admissions, searchQuery, universityFilter, degreeFilter, selectedStatus])

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
      navigation.navigate('StudentCompare', { ids: compareIds })
    }
  }

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name || 'Student'}
        userRole="Student"
        notifications={0}
        onNotificationPress={() => navigation.navigate('StudentNotifications')}
        onLogout={logout}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search programs, universities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
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

            {/* Degree Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Degree</Text>
              <View style={styles.filterChips}>
                {['BS', 'MS', 'PhD', 'MBA'].map(deg => (
                  <Pressable
                    key={deg}
                    style={[styles.filterChip, degreeFilter === deg && styles.filterChipActive]}
                    onPress={() => setDegreeFilter(degreeFilter === deg ? '' : deg)}
                  >
                    <Text style={[styles.filterChipText, degreeFilter === deg && styles.filterChipTextActive]}>{deg}</Text>
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
        {viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredAdmissions.map((admission) => {
              const statusColors = getStatusColor(admission.status)
              const isSaved = savedIds.includes(admission.id)
              const isComparing = compareIds.includes(admission.id)
              const daysLeft = calculateDaysRemaining(admission.deadline)

              return (
                <View key={admission.id} style={styles.gridCard}>
                  <Pressable
                    style={styles.gridCardInner}
                    onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
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
                      <Text style={styles.detailText}>{admission.fee}</Text>
                    </View>

                    <View style={styles.cardActions}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          toggleCompare(admission.id)
                        }}
                      >
                        <Text style={[styles.actionIcon, isComparing && styles.actionIconActive]}>⚖</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          toggleSaved(admission.id)
                        }}
                      >
                        <Text style={[styles.actionIcon, isSaved && styles.actionIconActive]}>{isSaved ? '★' : '☆'}</Text>
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
              const daysLeft = calculateDaysRemaining(admission.deadline)

              return (
                <Pressable
                  key={admission.id}
                  style={styles.listCard}
                  onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
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
                        <Text style={styles.detailText}> • {admission.fee}</Text>
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
                          toggleCompare(admission.id)
                        }}
                      >
                        <Text style={[styles.actionIcon, isComparing && styles.actionIconActive]}>⚖</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          toggleSaved(admission.id)
                        }}
                      >
                        <Text style={[styles.actionIcon, isSaved && styles.actionIconActive]}>{isSaved ? '★' : '☆'}</Text>
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
    </View>
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
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    fontSize: 16,
    color: '#111827',
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

