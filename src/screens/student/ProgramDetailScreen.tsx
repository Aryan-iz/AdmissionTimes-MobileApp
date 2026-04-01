import { useState, useMemo, useEffect } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useStudentStore } from '../../store'
import { calculateDaysRemaining } from '../../data/studentData'
import { TitleHeader, CustomLoader } from '../../components/ui'
import { ReminderModal } from '../../components/student'
import { trackCappedStudentActivitySafe } from '../../services'
import { Feather } from '@expo/vector-icons'

type ProgramDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProgramDetail'>
type ProgramDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProgramDetail'>

export default function ProgramDetailScreen() {
  const route = useRoute<ProgramDetailScreenRouteProp>()
  const navigation = useNavigation<ProgramDetailScreenNavigationProp>()
  const [activeTab, setActiveTab] = useState<'Overview' | 'Important Dates'>('Overview')
  const [isLoading, setIsLoading] = useState(true)
  const [reminderModalVisible, setReminderModalVisible] = useState(false)
  const admissions = useStudentStore(state => state.admissions)
  const toggleAlert = useStudentStore(state => state.toggleAlert)
  
  // Helper to get admission by ID
  const getAdmissionById = (id: string) => admissions.find(a => a.id === id)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const program = route.params?.id ? getAdmissionById(route.params.id) : undefined

  useEffect(() => {
    if (!program?.id) return

    void trackCappedStudentActivitySafe({
      activity_type: 'viewed',
      entity_type: 'admission',
      entity_id: program.id,
      metadata: {
        source: 'mobile_program_detail',
      },
    })
  }, [program?.id])
  
  // Get related programs (same degree type, different university, limit 3)
  const relatedPrograms = useMemo(() => {
    if (!program) return []
    return admissions
      .filter(a => a.id !== program.id && a.degreeType === program.degreeType)
      .slice(0, 3)
  }, [program, admissions])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Program Details" />
        <View style={styles.loadingContainer}>
          <CustomLoader size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Loading program details...</Text>
        </View>
      </View>
    )
  }

  if (!program) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Program Details" />
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={56} color="#EF4444" style={styles.errorIcon} />
          <Text style={styles.errorText}>Program not found</Text>
          <Pressable 
            style={styles.errorButton}
            onPress={() => navigation.navigate('StudentDashboard')}
          >
            <Text style={styles.errorButtonText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return { bg: '#D1FAE5', text: '#10B981' }
      case 'Closing Soon': return { bg: '#FEF3C7', text: '#FACC15' }
      case 'Closed': return { bg: '#FEE2E2', text: '#EF4444' }
      default: return { bg: '#F3F4F6', text: '#6B7280' }
    }
  }

  const statusColors = getStatusColor(program.programStatus)
  const daysRemaining = calculateDaysRemaining(program.deadline)

  const handleApplyNow = async () => {
    if (!program.officialUrl) {
      Alert.alert('Apply Now', 'Official application link is not available for this program yet.')
      return
    }

    const canOpen = await Linking.canOpenURL(program.officialUrl)
    if (!canOpen) {
      Alert.alert('Apply Now', 'Unable to open the official application link on this device.')
      return
    }

    await Linking.openURL(program.officialUrl)
    void trackCappedStudentActivitySafe({
      activity_type: 'searched',
      entity_type: 'admission',
      entity_id: program.id,
      metadata: {
        source: 'mobile_program_detail_apply',
        official_url: program.officialUrl,
      },
    })
  }

  const handleCompare = () => {
    void trackCappedStudentActivitySafe({
      activity_type: 'compared',
      entity_type: 'admission',
      entity_id: program.id,
      metadata: {
        source: 'mobile_program_detail',
      },
    })
    navigation.navigate('StudentCompare', { ids: [program.id] })
  }

  const handleSetReminder = () => {
    setReminderModalVisible(true)
  }

  const handleConfirmReminder = async () => {
    const wasAlertEnabled = program.alertEnabled

    if (!program.alertEnabled) {
      await toggleAlert(program.id)
    }

    if (!wasAlertEnabled) {
      void trackCappedStudentActivitySafe({
        activity_type: 'alert',
        entity_type: 'admission',
        entity_id: program.id,
        metadata: {
          source: 'mobile_program_detail',
          enabled: true,
        },
      })
    }

    Alert.alert(
      'Reminder Enabled',
      'This admission has been saved and deadline alerts are now enabled.',
      [{ text: 'OK', style: 'default' }]
    )
  }

  return (
    <View style={styles.container}>
      <TitleHeader title="Program Details" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <Text style={styles.programTitle}>{program.program}</Text>
            <Text style={styles.universityName}>{program.university}</Text>
            
            <View style={styles.headerMeta}>
              <View style={styles.locationContainer}>
                <Feather name="map-pin" size={16} color="#6B7280" style={styles.locationIcon} />
                <Text style={styles.locationText}>{program.location}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                  {program.programStatus}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButtonSecondary} onPress={handleCompare}>
                <View style={styles.secondaryButtonContent}>
                  <Feather name="shuffle" size={14} color="#374151" />
                  <Text style={styles.actionButtonSecondaryText}>Compare</Text>
                </View>
              </Pressable>
              <Pressable style={styles.actionButtonSecondary} onPress={handleSetReminder}>
                <View style={styles.secondaryButtonContent}>
                  <Feather name="bell" size={14} color="#374151" />
                  <Text style={styles.actionButtonSecondaryText}>Reminder</Text>
                </View>
              </Pressable>
            </View>

            <Pressable style={styles.applyButton} onPress={handleApplyNow}>
              <View style={styles.applyButtonContent}>
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </View>
            </Pressable>

            <Text style={styles.lastUpdated}>Last Updated: {program.updated}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {(['Overview', 'Important Dates'] as const).map((tab) => {
              const isActive = activeTab === tab
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                </Pressable>
              )
            })}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'Overview' && (
              <View>
                <Text style={styles.sectionTitle}>Overview</Text>
                
                <View style={styles.overviewSection}>
                  <Text style={styles.subsectionTitle}>Program Information</Text>
                  <Text style={styles.descriptionText}>
                    {program.program} at {program.university} is a {program.degree} program located in {program.location}.
                    {program.aiSummary && (
                      <Text>{'\n\n'}{program.aiSummary}</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Degree Type</Text>
                    <Text style={styles.infoValue}>{program.degree}</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{program.location}</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Deadline</Text>
                    <Text style={styles.infoValue}>{program.deadlineDisplay}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'Important Dates' && (
              <View>
                <Text style={styles.sectionTitle}>Important Dates</Text>
                
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Application Deadline</Text>
                  <Text style={styles.dateValue}>{program.deadlineDisplay}</Text>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Days Remaining</Text>
                  <Text style={[
                    styles.dateValue, 
                    styles.daysRemainingValue,
                    { color: daysRemaining >= 0 && daysRemaining <= 7 ? '#EF4444' : daysRemaining >= 0 ? '#10B981' : '#6B7280' }
                  ]}>
                    {daysRemaining >= 0 ? `${daysRemaining} days` : 'Deadline passed'}
                  </Text>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Last Updated</Text>
                  <Text style={styles.dateValue}>{program.updated}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Official Links */}
          <View style={styles.officialLinksCard}>
            <Text style={styles.officialLinksTitle}>Official Links</Text>
            {program.officialUrl ? (
              <Pressable 
                style={styles.officialLinkButton}
                onPress={() => Linking.openURL(program.officialUrl!)}
              >
                <Feather name="globe" size={16} color="#FFFFFF" style={styles.officialLinkButtonIcon} />
                <Text style={styles.officialLinkButtonText}>Visit Official Website</Text>
              </Pressable>
            ) : (
              <View style={styles.noLinkCard}>
                <Text style={styles.noLinkText}>
                  Official website link not available. Please contact the university directly for more information.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reminder Modal */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        onSetReminder={handleConfirmReminder}
        programName={program.program}
        deadline={program.deadlineDisplay}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  programTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  universityName: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 16,
  },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  applyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  applyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  overviewSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 0,
  },
  infoCard: {
    width: '50%',
    padding: 4,
    marginBottom: 8,
  },
  infoCardInner: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  eligibilityCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dateValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  daysRemainingValue: {
    fontWeight: '600',
  },
  officialLinksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  officialLinksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  officialLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  officialLinkButtonIcon: {
    marginRight: 8,
  },
  officialLinkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  noLinkCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  noLinkText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
