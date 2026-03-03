import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native'
import { useUniversityStore } from '../../store'
import { ChangeLogItem } from '../../data/universityData'
import { TitleHeader } from '../../components/ui'

export default function ChangeLogsScreen() {
  const changeLogs = useUniversityStore(state => state.changeLogs)
  const admissions = useUniversityStore(state => state.admissions)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [admission, setAdmission] = useState('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ChangeLogItem | null>(null)

  const admissionOptions = useMemo(() => {
    const titles = admissions.map(a => a.title)
    return ['All', ...titles]
  }, [admissions])

  const filtered = useMemo(() => {
    let list = changeLogs
    
    if (admission !== 'All') {
      list = list.filter(log => log.admission === admission)
    }
    
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(log => 
        log.admission.toLowerCase().includes(q) || 
        log.modifiedBy.toLowerCase().includes(q)
      )
    }
    
    if (from) {
      list = list.filter(log => log.date >= from)
    }
    
    if (to) {
      list = list.filter(log => log.date <= to)
    }
    
    return list
  }, [changeLogs, admission, search, from, to])

  return (
    <View style={styles.container}>
      <TitleHeader title="Change Logs" />

      <View style={styles.content}>
        <Text style={styles.subtitle}>Track all modifications to admission records</Text>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <View style={styles.dateFilters}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>From</Text>
              <TextInput
                style={styles.dateInput}
                value={from}
                onChangeText={setFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.filterLabel}>To</Text>
              <TextInput
                style={styles.dateInput}
                value={to}
                onChangeText={setTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Text style={styles.filterLabel}>Filter by Admission</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.admissionScroll}>
            {admissionOptions.slice(0, 5).map((opt) => {
              const isActive = admission === opt
              return (
                <Pressable
                  key={opt}
                  style={[styles.admissionChip, isActive && styles.admissionChipActive]}
                  onPress={() => setAdmission(opt)}
                >
                  <Text style={[styles.admissionChipText, isActive && styles.admissionChipTextActive]} numberOfLines={1}>
                    {opt}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by title or modifier..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Change Logs List */}
        <ScrollView style={styles.scrollView}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No change logs found</Text>
              <Text style={styles.emptySubtext}>Adjust filters or search terms</Text>
            </View>
          ) : (
            filtered.map((log) => (
              <Pressable
                key={log.id}
                style={styles.logCard}
                onPress={() => setSelected(log)}
              >
                <View style={styles.logHeader}>
                  <Text style={styles.logTitle} numberOfLines={2}>{log.admission}</Text>
                  <Text style={styles.logDate}>{log.date}</Text>
                </View>
                <View style={styles.logDetails}>
                  <Text style={styles.logModifier}>Modified by: {log.modifiedBy}</Text>
                  <Text style={styles.logSummary} numberOfLines={2}>
                    {log.diff.length} field{log.diff.length !== 1 ? 's' : ''} changed
                  </Text>
                </View>
                <Text style={styles.viewDiffLink}>View Diff →</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>

      {/* Diff Modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Details</Text>
                <Text style={styles.modalSubtitle}>{selected?.admission}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {selected && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalLabel}>Modified By: {selected.modifiedBy}</Text>
                  <Text style={styles.modalLabel}>Date: {selected.date}</Text>
                </View>
                <Text style={styles.diffTitle}>Changes:</Text>
                {selected.diff.map((d, idx) => (
                  <View key={idx} style={styles.diffItem}>
                    <Text style={styles.diffField}>{d.field}</Text>
                    <View style={styles.diffOld}>
                      <Text style={styles.diffLabel}>Old:</Text>
                      <Text style={styles.diffValue}>{d.old}</Text>
                    </View>
                    <View style={styles.diffNew}>
                      <Text style={styles.diffLabel}>New:</Text>
                      <Text style={styles.diffValue}>{d.new}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <Pressable style={styles.modalCloseButton} onPress={() => setSelected(null)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
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
  content: {
    flex: 1,
    padding: 16,
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
  dateFilters: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  admissionScroll: {
    marginBottom: 16,
  },
  admissionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    maxWidth: 200,
  },
  admissionChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  admissionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  admissionChipTextActive: {
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
  scrollView: {
    flex: 1,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  logDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  logDetails: {
    marginBottom: 12,
  },
  logModifier: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  logSummary: {
    fontSize: 14,
    color: '#374151',
  },
  viewDiffLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
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
    maxHeight: '80%',
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
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  diffTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  diffItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  diffField: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  diffOld: {
    marginBottom: 8,
  },
  diffNew: {
    marginBottom: 0,
  },
  diffLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  diffValue: {
    fontSize: 13,
    color: '#374151',
  },
  modalCloseButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
})
