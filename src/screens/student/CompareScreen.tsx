import { useMemo, useState, useEffect } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { useStudentStore, selectSavedAdmissions } from '../../store'
import { dedupeSavedAdmissions } from '../../utils/watchlistUtils'
import { getStatusColor, StudentAdmission } from '../../data/studentData'
import { TitleHeader, CustomLoader } from '../../components/ui'
import { Feather } from '@expo/vector-icons'

type CompareScreenRouteProp = RouteProp<RootStackParamList, 'StudentCompare'>
type CompareScreenNavigationProp = StackNavigationProp<RootStackParamList, 'StudentCompare'>

// Helper function to convert match percentage to text label
function getMatchLabel(matchNumeric?: number): string {
  if (!matchNumeric) return 'Match'
  if (matchNumeric >= 90) return 'Excellent Match'
  if (matchNumeric >= 85) return 'High Match'
  if (matchNumeric >= 80) return 'Good Match'
  if (matchNumeric >= 75) return 'Fair Match'
  return 'Match'
}

const CompareCard = ({ admission, onViewDetails }: { admission: StudentAdmission; onViewDetails: () => void }) => {
  const statusColors = getStatusColor(admission.status)

  const handleViewOriginal = () => {
    if (admission.officialUrl) {
      Linking.openURL(admission.officialUrl)
    } else {
      onViewDetails()
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>{admission.university}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{admission.program}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.badgeText, { color: statusColors.text }]}>{admission.programStatus}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Feather name="book-open" size={16} color="#6B7280" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={1}>{admission.degree}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="calendar" size={16} color="#6B7280" style={styles.detailIcon} />
          <Text style={styles.detailText}>{admission.deadlineDisplay}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="map-pin" size={16} color="#6B7280" style={styles.detailIcon} />
          <Text style={styles.detailText} numberOfLines={1}>{admission.location}</Text>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryLabel}>AI Summary</Text>
        <Text style={styles.summaryText} numberOfLines={5}>
          {admission.aiSummary || 'No summary available.'}
        </Text>
      </View>

      <Pressable onPress={handleViewOriginal}>
        <View style={styles.viewLinkRow}>
          <Text style={styles.viewLink}>View Original Admission</Text>
          <Feather name="arrow-right" size={14} color="#2563EB" />
        </View>
      </Pressable>
    </View>
  )
}

export default function CompareScreen() {
  const route = useRoute<CompareScreenRouteProp>()
  const navigation = useNavigation<CompareScreenNavigationProp>()
  const admissions = useStudentStore(state => state.admissions)
  const savedAdmissions = useStudentStore(selectSavedAdmissions)
  const dedupedSaved = useMemo(() => dedupeSavedAdmissions(savedAdmissions), [savedAdmissions])
  const [isLoading, setIsLoading] = useState(true)
  
  const getAdmissionById = (id: string) => admissions.find(a => a.id === id)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])
  
  const selectedAdmissions = useMemo(() => {
    const ids = route.params?.ids
    if (ids && Array.isArray(ids)) {
      return ids
        .map((id: string) => getAdmissionById(id))
        .filter((a): a is StudentAdmission => a !== undefined)
    }
    // Default: use first 3 saved admissions
    return dedupedSaved.slice(0, 4)
  }, [route.params?.ids, admissions, dedupedSaved])

  const highlights = useMemo(() => {
    if (selectedAdmissions.length === 0) return []
    
    const lowestFee = selectedAdmissions.reduce((min: StudentAdmission, a: StudentAdmission) => a.feeNumeric < min.feeNumeric ? a : min, selectedAdmissions[0])
    const earliestDeadline = selectedAdmissions.reduce((earliest: StudentAdmission, a: StudentAdmission) => {
      const daysA = a.daysRemaining
      const daysB = earliest.daysRemaining
      return daysA < daysB ? a : earliest
    }, selectedAdmissions[0])
    const highestMatch = selectedAdmissions.reduce((max: StudentAdmission, a: StudentAdmission) => (a.matchNumeric || 0) > (max.matchNumeric || 0) ? a : max, selectedAdmissions[0])
    
    return [
      `${lowestFee.university} offers the lowest fee at ${lowestFee.fee}, making it the most cost-effective option.`,
      `${earliestDeadline.university} has the earliest deadline (${earliestDeadline.deadlineDisplay}), requiring immediate application submission.`,
      `${highestMatch.university} provides the best match (${getMatchLabel(highestMatch.matchNumeric)}) based on your profile.`,
      `All ${selectedAdmissions.length} universities are located in major cities with excellent infrastructure and facilities.`,
    ]
  }, [selectedAdmissions])

  const count = selectedAdmissions.length

  if (isLoading) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Compare Admissions" />
        <View style={styles.loadingContainer}>
          <CustomLoader size={60} color="#2563EB" />
          <Text style={styles.loadingText}>Loading comparison...</Text>
        </View>
      </View>
    )
  }

  if (count < 2) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Compare Admissions" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Feather name="file-text" size={56} color="#9CA3AF" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Not Enough Admissions Selected</Text>
            <Text style={styles.emptyMessage}>Please select at least 2 admissions to compare.</Text>
            <Pressable 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('StudentWatchlist')}
            >
              <Text style={styles.emptyButtonText}>Go to Watchlist</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  if (count > 4) {
    return (
      <View style={styles.container}>
        <TitleHeader title="Compare Admissions" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Feather name="alert-triangle" size={56} color="#F59E0B" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Too Many Admissions Selected</Text>
            <Text style={styles.emptyMessage}>Please select a maximum of 4 admissions to compare.</Text>
            <Pressable 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('StudentWatchlist')}
            >
              <Text style={styles.emptyButtonText}>Go to Watchlist</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TitleHeader title="Compare Admissions" />
      
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>
          <Text style={styles.headerCount}>{count}</Text> Admissions Selected
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {selectedAdmissions.map((admission: StudentAdmission) => (
          <CompareCard 
            key={admission.id} 
            admission={admission}
            onViewDetails={() => navigation.navigate('ProgramDetail', { id: admission.id })}
          />
        ))}

        <View style={styles.highlightsCard}>
          <View style={styles.highlightsHeader}>
            <Feather name="zap" size={18} color="#2563EB" style={styles.highlightIcon} />
            <Text style={styles.highlightsTitle}>Key Differences</Text>
          </View>
          <View style={styles.highlightsList}>
            {highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Feather name="check" size={14} color="#9CA3AF" style={styles.highlightBullet} />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
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
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerCount: {
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  summaryContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  highlightIcon: {
    marginRight: 8,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  highlightsList: {
    marginTop: 0,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  highlightBullet: {
    marginRight: 12,
    marginTop: 2,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 32,
    maxWidth: 400,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
