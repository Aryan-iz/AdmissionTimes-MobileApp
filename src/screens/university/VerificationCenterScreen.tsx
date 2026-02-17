import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native'
import { useUniversityData } from '../../contexts/UniversityDataContext'
import { AuditItem, AuditStatus } from '../../data/universityData'
import { TitleHeader } from '../../components/ui'

const STATUS_OPTIONS: Array<"All" | AuditStatus> = ["All", "Pending", "Verified", "Rejected", "Disputed"]

const STATUS_STYLES: Record<AuditStatus, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Verified: { bg: '#D1FAE5', text: '#065F46' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
  Disputed: { bg: '#FED7AA', text: '#9A3412' },
}

export default function VerificationCenterScreen() {
  const [status, setStatus] = useState<"All" | AuditStatus>("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AuditItem | null>(null)
  const { audits } = useUniversityData()

  const filtered = useMemo(() => {
    let list = audits
    if (status !== "All") {
      list = list.filter((a) => a.status === status)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((a) => a.title.toLowerCase().includes(q))
    }
    return list
  }, [audits, status, search])

  return (
    <View style={styles.container}>
      <TitleHeader title="Verification Center" />

      <View style={styles.content}>
        <Text style={styles.subtitle}>Track your admission reviews and audit results.</Text>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <Text style={styles.filterLabel}>Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
            {STATUS_OPTIONS.map((opt) => {
              const isActive = status === opt
              return (
                <Pressable
                  key={opt}
                  style={[styles.statusChip, isActive && styles.statusChipActive]}
                  onPress={() => setStatus(opt)}
                >
                  <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
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
              placeholder="Search admission title..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Audit List */}
        <ScrollView style={styles.scrollView}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No audits found</Text>
              <Text style={styles.emptySubtext}>Adjust filters or search terms</Text>
            </View>
          ) : (
            filtered.map((audit) => {
              const statusColors = STATUS_STYLES[audit.status]
              return (
                <Pressable
                  key={audit.id}
                  style={styles.auditCard}
                  onPress={() => setSelected(audit)}
                >
                  <View style={styles.auditHeader}>
                    <Text style={styles.auditTitle} numberOfLines={2}>{audit.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {audit.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.auditDetails}>
                    <View style={styles.auditDetailRow}>
                      <Text style={styles.auditDetailLabel}>Verified By:</Text>
                      <Text style={styles.auditDetailValue}>{audit.verifiedBy || '—'}</Text>
                    </View>
                    <View style={styles.auditDetailRow}>
                      <Text style={styles.auditDetailLabel}>Last Action:</Text>
                      <Text style={styles.auditDetailValue}>{audit.lastAction}</Text>
                    </View>
                    {audit.remarks && (
                      <View style={styles.remarksContainer}>
                        <Text style={styles.auditDetailLabel}>Remarks:</Text>
                        <Text style={styles.remarksText} numberOfLines={2}>{audit.remarks}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.viewDetailsLink}>View Details →</Text>
                </Pressable>
              )
            })
          )}
        </ScrollView>
      </View>

      {/* Detail Modal */}
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
                <Text style={styles.modalTitle}>Admission Details</Text>
                <Text style={styles.modalSubtitle}>Review verification context and last action</Text>
              </View>
              <Pressable onPress={() => setSelected(null)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {selected && (
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Title</Text>
                  <Text style={styles.modalValue}>{selected.title}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_STYLES[selected.status].bg }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_STYLES[selected.status].text }]}>
                      {selected.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Verified By</Text>
                  <Text style={styles.modalValue}>{selected.verifiedBy || '—'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Last Action</Text>
                  <Text style={styles.modalValue}>{selected.lastAction}</Text>
                </View>
                <View style={styles.modalRowColumn}>
                  <Text style={styles.modalLabel}>Remarks</Text>
                  <Text style={styles.modalRemarks}>{selected.remarks || '—'}</Text>
                </View>
              </View>
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
  filterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusScroll: {
    marginBottom: 16,
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusChipTextActive: {
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
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  auditTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  auditDetails: {
    marginBottom: 12,
  },
  auditDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  auditDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  auditDetailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  remarksContainer: {
    marginTop: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  viewDetailsLink: {
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
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalRowColumn: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  modalRemarks: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
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
