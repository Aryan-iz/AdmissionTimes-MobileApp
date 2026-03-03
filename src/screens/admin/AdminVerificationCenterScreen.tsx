import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Modal, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Header } from '../../components/ui'
import {
  verificationItems,
  getUniqueUniversities,
  getVerificationStatusColor,
  type VerificationItem,
  type VerificationStatus,
} from '../../data/adminData'
import { useAuthStore } from '../../store'

export default function AdminVerificationCenterScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'All'>('All')
  const [universityFilter, setUniversityFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null)
  const [actionType, setActionType] = useState<'Verify' | 'Reject' | 'Dispute' | null>(null)
  const [remarks, setRemarks] = useState('')

  const universities = getUniqueUniversities()

  const filteredItems = useMemo(() => {
    let filtered = [...verificationItems]

    if (statusFilter !== 'All') {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (universityFilter !== 'All') {
      filtered = filtered.filter((item) => item.university === universityFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((item) =>
        item.admissionTitle.toLowerCase().includes(query) ||
        item.university.toLowerCase().includes(query) ||
        item.submittedBy.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [statusFilter, universityFilter, searchQuery])

  const handleReview = (item: VerificationItem) => {
    setSelectedItem(item)
    setActionType(null)
    setRemarks('')
  }

  const handleSubmitAction = () => {
    if (!selectedItem || !actionType || remarks.trim().length < 10) {
      Alert.alert('Error', 'Please select an action and provide remarks (minimum 10 characters)')
      return
    }

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${actionType.toLowerCase()} this admission?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            Alert.alert('Success', `Admission ${actionType.toLowerCase()}ed successfully!`)
            setSelectedItem(null)
            setActionType(null)
            setRemarks('')
          }
        }
      ]
    )
  }

  const handleResetFilters = () => {
    setStatusFilter('All')
    setUniversityFilter('All')
    setSearchQuery('')
  }

  return (
    <View style={styles.container}>
      <Header
        userName={user?.name || 'Admin User'}
        userRole="Admin"
        notifications={0}
        onLogout={signOut}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verification Center</Text>
        <Text style={styles.subtitle}>Review and manage admissions requiring verification</Text>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterLabel}>Status Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
            {(['All', 'Pending', 'Verified', 'Rejected', 'Disputed'] as const).map((status) => {
              const isActive = statusFilter === status
              return (
                <Pressable
                  key={status}
                  style={[styles.statusChip, isActive && styles.statusChipActive]}
                  onPress={() => setStatusFilter(status === 'All' ? 'All' : status)}
                >
                  <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={[styles.filterLabel, { marginTop: 16 }]}>University</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>University:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', ...universities].map((uni) => {
                const isActive = universityFilter === uni
                return (
                  <Pressable
                    key={uni}
                    style={[styles.uniChip, isActive && styles.uniChipActive]}
                    onPress={() => setUniversityFilter(uni)}
                  >
                    <Text style={[styles.uniChipText, isActive && styles.uniChipTextActive]} numberOfLines={1}>
                      {uni}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search admission title..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </Pressable>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.resultsCount}>{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</Text>
          
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No verifications found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredItems.map((item) => {
              const statusColors = getVerificationStatusColor(item.status)
              return (
                <View key={item.id} style={styles.itemCard}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{item.admissionTitle}</Text>
                  <Text style={styles.itemUniversity}>{item.university}</Text>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemMeta}>By: {item.submittedBy}</Text>
                    <Text style={styles.itemMeta}>{item.submittedOn}</Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {item.status}
                      </Text>
                    </View>
                    <Pressable style={styles.reviewButton} onPress={() => handleReview(item)}>
                      <Text style={styles.reviewButtonText}>Review</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedItem(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Review Admission</Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>{selectedItem?.admissionTitle}</Text>
              </View>
              <Pressable onPress={() => setSelectedItem(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>University: {selectedItem?.university}</Text>
                <Text style={styles.modalLabel}>Submitted by: {selectedItem?.submittedBy}</Text>
                <Text style={styles.modalLabel}>Submitted on: {selectedItem?.submittedOn}</Text>
                <Text style={styles.modalLabel}>Current Status: {selectedItem?.status}</Text>
              </View>

              <Text style={styles.actionTitle}>Select Action</Text>
              <View style={styles.actionButtons}>
                <Pressable
                  style={[styles.actionButton, actionType === 'Verify' && styles.actionButtonVerify]}
                  onPress={() => setActionType('Verify')}
                >
                  <Text style={[styles.actionButtonText, actionType === 'Verify' && { color: '#FFFFFF' }]}>
                    ✓ Verify
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, actionType === 'Reject' && styles.actionButtonReject]}
                  onPress={() => setActionType('Reject')}
                >
                  <Text style={[styles.actionButtonText, actionType === 'Reject' && { color: '#FFFFFF' }]}>
                    ✕ Reject
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, actionType === 'Dispute' && styles.actionButtonDispute]}
                  onPress={() => setActionType('Dispute')}
                >
                  <Text style={[styles.actionButtonText, actionType === 'Dispute' && { color: '#FFFFFF' }]}>
                    ⚠ Dispute
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.remarksLabel}>Remarks (required, min 10 characters)</Text>
              <TextInput
                style={styles.remarksInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter your remarks..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.remarksCount}>{remarks.length} characters</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelButton} onPress={() => setSelectedItem(null)}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalSubmitButton, (!actionType || remarks.length < 10) && styles.modalSubmitButtonDisabled]} 
                onPress={handleSubmitAction}
                disabled={!actionType || remarks.length < 10}
              >
                <Text style={styles.modalSubmitButtonText}>Submit</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  statusScroll: {
    marginBottom: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  statusChipActive: {
    backgroundColor: '#004AAD',
    borderColor: '#004AAD',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  uniChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    maxWidth: 150,
  },
  uniChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  uniChipText: {
    fontSize: 12,
    color: '#374151',
  },
  uniChipTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  itemUniversity: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    maxWidth: 280,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalBody: {
    marginBottom: 16,
  },
  modalInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonVerify: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  actionButtonReject: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  actionButtonDispute: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    minHeight: 100,
    marginBottom: 4,
  },
  remarksCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  modalSubmitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
})
