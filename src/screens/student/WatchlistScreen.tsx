import { useState, useMemo, useEffect } from 'react'
import { ScrollView, Text, View, Pressable, TextInput, StyleSheet, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuthStore, useStudentStore } from '../../store'
import { getStatusColor, calculateDaysRemaining } from '../../data/studentData'
import { PremiumHeader, CustomLoader } from '../../components/ui'
import { Feather } from '@expo/vector-icons'

export default function WatchlistScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  const admissions = useStudentStore(state => state.admissions)
  const savedIds = useStudentStore(state => state.savedAdmissions)
  const notifications = useStudentStore(state => state.notifications)
  const toggleSaved = useStudentStore(state => state.toggleSaved)
  const toggleAlert = useStudentStore(state => state.toggleAlert)

  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(false)

  const savedAdmissions = useMemo(() => {
    return admissions.filter(a => savedIds.includes(a.id))
  }, [admissions, savedIds])

  const cities = useMemo(() => {
    return Array.from(new Set(savedAdmissions.map(a => a.city).filter(Boolean))).sort()
  }, [savedAdmissions])

  const filteredAdmissions = useMemo(() => {
    let filtered = [...savedAdmissions]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.university.toLowerCase().includes(query) ||
        a.program.toLowerCase().includes(query)
      )
    }

    if (cityFilter) {
      filtered = filtered.filter(a => a.city === cityFilter)
    }

    return filtered
  }, [savedAdmissions, searchQuery, cityFilter])

  useEffect(() => {
    setIsLoadingResults(true)
    const timer = setTimeout(() => setIsLoadingResults(false), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, cityFilter, savedAdmissions.length])

  const upcomingCount = useMemo(() => {
    return savedAdmissions.filter(a => calculateDaysRemaining(a.deadline) <= 30).length
  }, [savedAdmissions])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleCompare = () => {
    if (selectedIds.length >= 2 && selectedIds.length <= 4) {
      navigation.navigate('StudentCompare', { ids: selectedIds })
    }
  }

  const handleRemove = (id: string) => {
    toggleSaved(id)
    setSelectedIds(prev => prev.filter(i => i !== id))
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
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Saved Programs</Text>
          <Pressable
            style={[styles.compareButton, selectedIds.length < 2 && styles.compareButtonDisabled]}
            onPress={handleCompare}
            disabled={selectedIds.length < 2}
          >
            <Text style={styles.compareButtonText}>Compare ({selectedIds.length})</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchInputRow}>
            <Feather name="search" size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved programs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter by City:</Text>
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

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Saved</Text>
              <Text style={styles.statValue}>{savedAdmissions.length}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="bookmark" size={18} color="#2563EB" />
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Active Alerts</Text>
              <Text style={styles.statValue}>{savedAdmissions.filter(a => a.alertEnabled).length}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="bell" size={18} color="#B45309" />
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Upcoming</Text>
              <Text style={styles.statValue}>{upcomingCount}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="clock" size={18} color="#EF4444" />
            </View>
          </View>
        </View>

        {/* Programs List */}
        {isLoadingResults ? (
          <View style={styles.loadingResults}>
            <CustomLoader size={40} color="#2563EB" />
          </View>
        ) : filteredAdmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {savedAdmissions.length === 0
                ? 'No saved programs yet'
                : 'No programs match your filters'}
            </Text>
            {savedAdmissions.length === 0 && (
              <Pressable
                style={styles.browseButton}
                onPress={() => navigation.navigate('StudentSearch')}
              >
                <Text style={styles.browseButtonText}>Browse Programs</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredAdmissions.map((admission) => {
            const statusColors = getStatusColor(admission.status)
            const isSelected = selectedIds.includes(admission.id)
            const daysLeft = calculateDaysRemaining(admission.deadline)

            return (
              <View key={admission.id} style={styles.programCard}>
                <View style={styles.programHeader}>
                  <Pressable
                    style={styles.checkbox}
                    onPress={() => toggleSelection(admission.id)}
                  >
                    <View style={[styles.checkboxInner, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </Pressable>
                  <View style={[styles.universityLogo, { backgroundColor: admission.logoBg }]}>
                    <Text style={styles.universityLogoText}>
                      {admission.university.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={styles.universityName} numberOfLines={1}>{admission.university}</Text>
                    <Text style={styles.programName} numberOfLines={1}>{admission.program}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                      {admission.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.programDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Degree:</Text>
                    <Text style={styles.detailValue}>{admission.degree}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Deadline:</Text>
                    <Text style={[styles.detailValue, daysLeft <= 7 && styles.urgentText]}>
                      {admission.deadlineDisplay}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City:</Text>
                    <Text style={styles.detailValue}>{admission.city}</Text>
                  </View>
                </View>

                <View style={styles.programActions}>
                  <View style={styles.alertRow}>
                    <View style={styles.alertLabelRow}>
                      <Feather name="bell" size={14} color="#374151" />
                      <Text style={styles.alertText}>Deadline Alerts</Text>
                    </View>
                    <Switch
                      value={admission.alertEnabled === true}
                      onValueChange={() => toggleAlert(admission.id)}
                      trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.viewButton}
                      onPress={() => navigation.navigate('ProgramDetail', { id: admission.id })}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </Pressable>
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemove(admission.id)}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )
          })
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
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
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    marginHorizontal: -4,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
  },
  statContent: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  alertLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    padding: 4,
    marginRight: 12,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  programInfo: {
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
  programDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  urgentText: {
    color: '#EF4444',
  },
  programActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingResults: {
    padding: 32,
    alignItems: 'center',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  browseButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
})

