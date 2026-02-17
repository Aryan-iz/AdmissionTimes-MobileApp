import { useState, useMemo } from 'react'
import { ScrollView, Text, View, Pressable, TextInput, StyleSheet, Switch } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentData } from '../../contexts/StudentDataContext'
import { getStatusColor, calculateDaysRemaining } from '../../data/studentData'
import { Header } from '../../components/ui'

export default function DeadlineScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { user, logout } = useAuth()
  const { admissions } = useStudentData()

  const [searchQuery, setSearchQuery] = useState('')
  const [universityFilter, setUniversityFilter] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('')

  const universities = useMemo(() => {
    return Array.from(new Set(admissions.map(a => a.university))).sort()
  }, [admissions])

  const filteredDeadlines = useMemo(() => {
    let filtered = admissions.map(a => ({
      ...a,
      daysRemaining: calculateDaysRemaining(a.deadline),
    }))

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.university.toLowerCase().includes(query) ||
        a.program.toLowerCase().includes(query)
      )
    }

    if (universityFilter) {
      filtered = filtered.filter(a => a.university === universityFilter)
    }

    if (degreeFilter) {
      filtered = filtered.filter(a => a.degreeType === degreeFilter)
    }

    if (dateRangeFilter) {
      const now = new Date()
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
  }, [admissions, searchQuery, universityFilter, degreeFilter, dateRangeFilter])

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, typeof filteredDeadlines> = {}
    filteredDeadlines.forEach(deadline => {
      const date = deadline.deadline
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(deadline)
    })
    return Object.entries(grouped).sort((a, b) => 
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    )
  }, [filteredDeadlines])

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
        <Text style={styles.title}>Upcoming Deadlines</Text>

        {/* Search */}
        <View style={styles.searchCard}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search programs or universities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>University</Text>
          <View style={styles.filterChips}>
            <Pressable
              style={[styles.filterChip, !universityFilter && styles.filterChipActive]}
              onPress={() => setUniversityFilter('')}
            >
              <Text style={[styles.filterChipText, !universityFilter && styles.filterChipTextActive]}>All</Text>
            </Pressable>
            {universities.slice(0, 3).map(uni => (
              <Pressable
                key={uni}
                style={[styles.filterChip, universityFilter === uni && styles.filterChipActive]}
                onPress={() => setUniversityFilter(universityFilter === uni ? '' : uni)}
              >
                <Text style={[styles.filterChipText, universityFilter === uni && styles.filterChipTextActive]} numberOfLines={1}>{uni}</Text>
              </Pressable>
            ))}
          </View>

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

          <Text style={styles.filterLabel}>Time Range</Text>
          <View style={styles.filterChips}>
            {[
              { label: 'All', value: '' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: '3 Months', value: '3months' },
            ].map(range => (
              <Pressable
                key={range.value}
                style={[styles.filterChip, dateRangeFilter === range.value && styles.filterChipActive]}
                onPress={() => setDateRangeFilter(range.value)}
              >
                <Text style={[styles.filterChipText, dateRangeFilter === range.value && styles.filterChipTextActive]}>{range.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Deadlines List */}
        {filteredDeadlines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Deadlines Found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : (
          groupedByDate.map(([date, deadlines]) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              {deadlines.map(deadline => {
                const statusColors = getStatusColor(deadline.status)
                const isClosed = deadline.daysRemaining < 0

                return (
                  <Pressable
                    key={deadline.id}
                    style={[styles.deadlineCard, isClosed && styles.deadlineCardClosed]}
                    onPress={() => navigation.navigate('ProgramDetail', { id: deadline.id })}
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
                        <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                          {deadline.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.deadlineDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>🎓</Text>
                        <Text style={styles.detailText}>{deadline.degree}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📅</Text>
                        <Text style={[styles.detailText, isClosed && styles.closedText]}>{deadline.deadlineDisplay}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>⏰</Text>
                        <Text style={[
                          styles.detailText, 
                          isClosed ? styles.closedText : deadline.daysRemaining <= 7 ? styles.urgentText : null
                        ]}>
                          {isClosed ? 'Deadline Passed' : `${deadline.daysRemaining} days left`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.deadlineFooter}>
                      <View style={styles.alertToggle}>
                        <Text style={styles.alertText}>🔔 Alert</Text>
                        <Switch
                          value={true}
                          onValueChange={() => {}}
                          trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.viewLink}>View Details →</Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ))
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
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
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  deadlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deadlineCardClosed: {
    opacity: 0.6,
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
    fontSize: 16,
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
    fontSize: 64,
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

