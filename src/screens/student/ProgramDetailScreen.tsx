import { useState, useMemo } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useStudentData } from '../../contexts/StudentDataContext'
import { calculateDaysRemaining } from '../../data/studentData'
import { TitleHeader } from '../../components/ui'

type ProgramDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProgramDetail'>
type ProgramDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProgramDetail'>

export default function ProgramDetailScreen() {
  const route = useRoute<ProgramDetailScreenRouteProp>()
  const navigation = useNavigation<ProgramDetailScreenNavigationProp>()
  const [activeTab, setActiveTab] = useState<'Overview' | 'Eligibility' | 'Important Dates'>('Overview')
  const { getAdmissionById, admissions } = useStudentData()

  const program = route.params?.id ? getAdmissionById(route.params.id) : undefined
  
  // Get related programs (same degree type, different university, limit 3)
  const relatedPrograms = useMemo(() => {
    if (!program) return []
    return admissions
      .filter(a => a.id !== program.id && a.degreeType === program.degreeType)
      .slice(0, 3)
  }, [program, admissions])

  if (!program) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Program Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
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

  const handleApplyNow = () => {
    if (program.officialUrl) {
      Linking.openURL(program.officialUrl)
    } else {
      Alert.alert('Apply Now', 'Please contact the university directly to apply for this program.')
    }
  }

  const handleCompare = () => {
    navigation.navigate('StudentCompare', { ids: [program.id] })
  }

  const handleSetReminder = () => {
    Alert.alert('Reminder Set', 'You will be notified about this program deadline.')
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
                <Text style={styles.locationIcon}>📍</Text>
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
                <Text style={styles.actionButtonSecondaryText}>↔️ Compare</Text>
              </Pressable>
              <Pressable style={styles.actionButtonSecondary} onPress={handleSetReminder}>
                <Text style={styles.actionButtonSecondaryText}>🔔 Reminder</Text>
              </Pressable>
            </View>

            <Pressable style={styles.applyButton} onPress={handleApplyNow}>
              <Text style={styles.applyButtonText}>✓ Apply Now</Text>
            </Pressable>

            <Text style={styles.lastUpdated}>Last Updated: {program.updated}</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {(['Overview', 'Eligibility', 'Important Dates'] as const).map((tab) => {
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
                    <Text style={styles.infoLabel}>Application Fee</Text>
                    <Text style={styles.infoValue}>{program.fee}</Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Deadline</Text>
                    <Text style={styles.infoValue}>{program.deadlineDisplay}</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'Eligibility' && (
              <View>
                <Text style={styles.sectionTitle}>Eligibility Requirements</Text>
                
                <View style={styles.eligibilityCard}>
                  <Text style={styles.subsectionTitle}>Degree Type</Text>
                  <Text style={styles.descriptionText}>{program.degree}</Text>
                </View>

                <View style={styles.eligibilityCard}>
                  <Text style={styles.subsectionTitle}>General Requirements</Text>
                  <Text style={styles.descriptionText}>
                    Please contact the university directly for specific eligibility requirements and required documents for this program.
                  </Text>
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
                <Text style={styles.officialLinkButtonIcon}>🌐</Text>
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 64,
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
