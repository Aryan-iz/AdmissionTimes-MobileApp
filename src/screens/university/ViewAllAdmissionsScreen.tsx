/**
 * ViewAllAdmissionsScreen - Complete Admissions List
 * 
 * View and manage all admission programs posted by the university
 * Features: Filtering by status, search, edit, delete
 * Matches web frontend ViewAllAdmissions.tsx exactly
 */

import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useUniversityStore } from '../../store/universityStore'
import { getStatusColor } from '../../data/universityData'
import type { Admission } from '../../data/universityData'
import { TitleHeader } from '../../components/ui'

type StatusFilter = 'all' | 'draft' | 'pending' | 'verified' | 'rejected'

export default function ViewAllAdmissionsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const admissions = useUniversityStore(state => state.admissions)
  const deleteAdmission = useUniversityStore(state => state.deleteAdmission)
  
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort admissions
  const filteredAdmissions = useMemo(() => {
    let filtered = [...admissions]

    // Apply status filter
    if (statusFilter !== 'all') {
      const statusMap: { [key in StatusFilter]: string[] } = {
        all: [],
        draft: ['Draft'],
        pending: ['Pending Audit'],
        verified: ['Verified'],
        rejected: ['Rejected', 'Disputed'],
      }
      const targetStatuses = statusMap[statusFilter] || []
      filtered = filtered.filter(adm => targetStatuses.includes(adm.status))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        adm =>
          adm.title.toLowerCase().includes(query) ||
          adm.department?.toLowerCase().includes(query) ||
          adm.degreeType?.toLowerCase().includes(query)
      )
    }

    // Sort by last action (most recent first)
    return filtered.sort((a, b) => (b.lastAction || '').localeCompare(a.lastAction || ''))
  }, [admissions, statusFilter, searchQuery])

  // Get counts for each status
  const statusCounts = useMemo(() => {
    return {
      all: admissions.length,
      draft: admissions.filter(a => a.status === 'Draft').length,
      pending: admissions.filter(a => a.status === 'Pending Audit').length,
      verified: admissions.filter(a => a.status === 'Verified').length,
      rejected: admissions.filter(a => a.status === 'Rejected' || a.status === 'Disputed').length,
    }
  }, [admissions])

  const handleEdit = (id: string) => {
    navigation.navigate('ManageAdmissions', { editId: id })
  }

  const handleDelete = async (id: string, title: string) => {
    Alert.alert(
      'Delete Admission',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAdmission(id)
            
            if (result.success) {
              Alert.alert('Success', 'Admission deleted successfully!')
            } else {
              Alert.alert('Error', `Failed to delete admission: ${result.error || 'Unknown error'}`)
            }
          },
        },
      ]
    )
  }

  const handleCreateNew = () => {
    navigation.navigate('ManageAdmissions')
  }

  const renderStatusCard = (status: StatusFilter, label: string, count: number, color: string) => {
    const isSelected = statusFilter === status
    
    return (
      <Pressable
        style={[
          styles.statusCard,
          { borderColor: isSelected ? color : '#E5E7EB' },
          isSelected && { backgroundColor: `${color}10` },
        ]}
        onPress={() => setStatusFilter(status)}
      >
        <Text style={[styles.statusCount, { color: isSelected ? color : '#111827' }]}>
          {count}
        </Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </Pressable>
    )
  }

  const renderAdmissionItem = ({ item }: { item: Admission }) => {
    const statusColorData = getStatusColor(item.status)
    
    return (
      <View style={styles.admissionCard}>
        <View style={styles.admissionHeader}>
          <View style={styles.admissionTitleContainer}>
            <Text style={styles.admissionTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColorData.bg },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusColorData.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.admissionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Degree:</Text>
            <Text style={styles.detailValue}>{item.degreeType || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Department:</Text>
            <Text style={styles.detailValue}>{item.department || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deadline:</Text>
            <Text style={styles.detailValue}>
              {item.deadline
                ? new Date(item.deadline).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>
              {item.lastAction
                ? new Date(item.lastAction).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.admissionActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleEdit(item.id)}
          >
            <Text style={[styles.actionButtonText, { color: '#2563EB' }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TitleHeader title="All Admissions" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        <Text style={styles.description}>
          View and manage all admission programs posted by your university
        </Text>

        {/* Create Button */}
        <Pressable style={styles.createButton} onPress={handleCreateNew}>
          <Text style={styles.createButtonText}>+ Create New Admission</Text>
        </Pressable>

        {/* Status Filter Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusCardsContainer}
          contentContainerStyle={styles.statusCardsContent}
        >
          {renderStatusCard('all', 'Total', statusCounts.all, '#2563EB')}
          {renderStatusCard('draft', 'Draft', statusCounts.draft, '#6B7280')}
          {renderStatusCard('pending', 'Pending', statusCounts.pending, '#F59E0B')}
          {renderStatusCard('verified', 'Verified', statusCounts.verified, '#10B981')}
          {renderStatusCard('rejected', 'Rejected', statusCounts.rejected, '#EF4444')}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by title, department, or degree..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Admissions List */}
        {filteredAdmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📄</Text>
            <Text style={styles.emptyStateTitle}>No admissions found</Text>
            <Text style={styles.emptyStateDescription}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Get started by creating your first admission program'}
            </Text>
            {!searchQuery && statusFilter === 'all' && (
              <Pressable style={styles.emptyStateButton} onPress={handleCreateNew}>
                <Text style={styles.emptyStateButtonText}>Create Admission</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={filteredAdmissions}
              renderItem={renderAdmissionItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.admissionsList}
            />

            {/* Results Summary */}
            <Text style={styles.resultsSummary}>
              Showing {filteredAdmissions.length} of {admissions.length} total admission
              {admissions.length !== 1 ? 's' : ''}
            </Text>
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
    flex: 1,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCardsContainer: {
    marginBottom: 16,
  },
  statusCardsContent: {
    gap: 12,
    paddingRight: 16,
  },
  statusCard: {
    width: 100,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  admissionsList: {
    gap: 12,
    paddingBottom: 16,
  },
  admissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  admissionHeader: {
    marginBottom: 12,
  },
  admissionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  admissionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  admissionDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
  },
  admissionActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSummary: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 16,
  },
})
