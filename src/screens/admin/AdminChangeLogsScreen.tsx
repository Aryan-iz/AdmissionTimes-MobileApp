import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Header } from '../../components/ui'
import { adminChangeLogs, type AdminChangeLog } from '../../data/adminData'
import { useAuthStore } from '../../store'

export default function AdminChangeLogsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)
  
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLog, setSelectedLog] = useState<AdminChangeLog | null>(null)

  const filteredLogs = useMemo(() => {
    let filtered = [...adminChangeLogs]

    if (changeTypeFilter !== 'All') {
      filtered = filtered.filter((log) => log.changeType === changeTypeFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((log) =>
        log.admissionTitle.toLowerCase().includes(query) ||
        log.modifiedBy.toLowerCase().includes(query) ||
        log.changeType.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [changeTypeFilter, searchQuery])

  const handleResetFilters = () => {
    setChangeTypeFilter('All')
    setSearchQuery('')
  }

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'Manual Edit':
        return { bg: '#DBEAFE', text: '#1E40AF' }
      case 'Scraper Update':
        return { bg: '#FEF3C7', text: '#92400E' }
      case 'Admin Edit':
        return { bg: '#FEE2E2', text: '#991B1B' }
      default:
        return { bg: '#F3F4F6', text: '#374151' }
    }
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
        <Text style={styles.title}>Change Logs</Text>
        <Text style={styles.subtitle}>Track all modifications to admission postings</Text>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterLabel}>Change Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uniScroll}>
            {['All', 'Manual Edit', 'Scraper Update', 'Admin Edit'].map((type) => {
              const isActive = changeTypeFilter === type
              return (
                <Pressable
                  key={type}
                  style={[styles.uniChip, isActive && styles.uniChipActive]}
                  onPress={() => setChangeTypeFilter(type)}
                >
                  <Text style={[styles.uniChipText, isActive && styles.uniChipTextActive]} numberOfLines={1}>
                    {type}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title or user..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </Pressable>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <Text style={styles.resultsCount}>{filteredLogs.length} change log{filteredLogs.length !== 1 ? 's' : ''}</Text>
          
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No change logs found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredLogs.map((log) => {
              const typeColors = getChangeTypeColor(log.changeType)
              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColors.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: typeColors.text }]}>
                        {log.changeType}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{log.timestamp}</Text>
                  </View>
                  <Text style={styles.logTitle} numberOfLines={2}>{log.admissionTitle}</Text>
                <Text style={styles.logMeta}>Changed by: {log.modifiedBy}</Text>
                <Text style={styles.logMeta}>Summary: {log.summary}</Text>
                  <Pressable style={styles.viewButton} onPress={() => setSelectedLog(log)}>
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </Pressable>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={!!selectedLog}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLog(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedLog(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Change Log Details</Text>
                <View style={[styles.typeBadge, { backgroundColor: getChangeTypeColor(selectedLog?.changeType || '').bg, marginTop: 8 }]}>
                  <Text style={[styles.typeBadgeText, { color: getChangeTypeColor(selectedLog?.changeType || '').text }]}>
                    {selectedLog?.changeType}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedLog(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>Admission Title</Text>
                <Text style={styles.modalValue}>{selectedLog?.admissionTitle}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>Changed By</Text>
                <Text style={styles.modalValue}>{selectedLog?.modifiedBy}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>Timestamp</Text>
                <Text style={styles.modalValue}>{selectedLog?.timestamp}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>Summary</Text>
                <Text style={styles.modalValue}>{selectedLog?.summary}</Text>
              </View>
              {selectedLog?.reasonForChange && (
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Reason for Change</Text>
                  <Text style={styles.modalValue}>{selectedLog.reasonForChange}</Text>
                </View>
              )}
              
              {selectedLog?.diff && (
                <View style={styles.changesSection}>
                  <Text style={styles.changesTitle}>Changed Fields</Text>
                  {selectedLog.diff.map((change, idx) => (
                    <View key={idx} style={styles.changeItem}>
                      <Text style={styles.changeField}>{change.field}</Text>
                      <View style={styles.changeValues}>
                        <View style={styles.oldValue}>
                          <Text style={styles.oldValueLabel}>Old:</Text>
                          <Text style={styles.oldValueText}>{change.oldValue || 'N/A'}</Text>
                        </View>
                        <View style={styles.newValue}>
                          <Text style={styles.newValueLabel}>New:</Text>
                          <Text style={styles.newValueText}>{change.newValue || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCloseButton} onPress={() => setSelectedLog(null)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
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
  uniScroll: {
    marginBottom: 12,
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
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  logUniversity: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  logMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  viewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignSelf: 'flex-start',
  },
  viewButtonText: {
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
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 14,
    color: '#111827',
  },
  changesSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  changeItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  changeField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  changeValues: {
    marginTop: 4,
  },
  oldValue: {
    marginBottom: 8,
  },
  oldValueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 2,
  },
  oldValueText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 4,
  },
  newValue: {
    marginBottom: 4,
  },
  newValueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  newValueText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
})
