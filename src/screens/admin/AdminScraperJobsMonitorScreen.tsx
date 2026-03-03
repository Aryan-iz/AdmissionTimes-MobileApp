import { useState } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { Header } from '../../components/ui'
import {
  scraperJobs,
  scraperSummary,
  getScraperJobStatusColor,
  type ScraperJob,
} from '../../data/adminData'
import { useAuthStore } from '../../store'

export default function AdminScraperJobsMonitorScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const user = useAuthStore(state => state.user)
  const signOut = useAuthStore(state => state.signOut)

  const handleRunAll = () => {
    Alert.alert(
      'Run Scraper',
      'Are you sure you want to run the scraper for all universities?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run',
          onPress: () => Alert.alert('Success', 'Scraper started successfully.')
        }
      ]
    )
  }

  const handleRerun = (university: string) => {
    Alert.alert(
      'Rerun Scraper',
      `Rerun scraper for ${university}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rerun',
          onPress: () => Alert.alert('Success', 'Scraper rerun initiated.')
        }
      ]
    )
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
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scraper Jobs Monitor</Text>
            <Text style={styles.subtitle}>Track automated scraper executions</Text>
          </View>
          <Pressable style={styles.runButton} onPress={handleRunAll}>
            <Text style={styles.runButtonText}>Run Manually</Text>
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryValue}>{scraperSummary.totalJobs}</Text>
            <Text style={styles.summaryLabel}>Total Jobs</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#10B981' }]}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{scraperSummary.successCount}</Text>
            <Text style={styles.summaryLabel}>Successful</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: '#EF4444' }]}>
            <Text style={styles.summaryIcon}>❌</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{scraperSummary.failedCount}</Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: '#2563EB' }]}>
            <Text style={styles.summaryIcon}>📅</Text>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{scraperJobs.length}</Text>
            <Text style={styles.summaryLabel}>Total Runs</Text>
          </View>
        </View>

        {/* Jobs List */}
        <View style={styles.jobsSection}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          <Text style={styles.resultsCount}>{scraperJobs.length} job{scraperJobs.length !== 1 ? 's' : ''}</Text>
          
          {scraperJobs.map((job) => {
            const statusColors = getScraperJobStatusColor(job.status)
            return (
              <View key={job.jobId} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                      {job.status}
                    </Text>
                  </View>
                  <Text style={styles.jobId}>#{job.jobId}</Text>
                </View>
                
                <Text style={styles.jobUniversity}>{job.university}</Text>
                
                <View style={styles.jobStats}>
                  <View style={styles.jobStat}>
                    <Text style={styles.jobStatLabel}>Duration</Text>
                    <Text style={styles.jobStatValue}>{job.duration}</Text>
                  </View>
                  <View style={styles.jobStat}>
                    <Text style={styles.jobStatLabel}>Changes</Text>
                    <Text style={[styles.jobStatValue, { color: '#F59E0B' }]}>{job.changesDetected?.length || 0}</Text>
                  </View>
                  <View style={styles.jobStat}>
                    <Text style={styles.jobStatLabel}>Status</Text>
                    <Text style={[styles.jobStatValue, { fontSize: 12 }]}>{job.status}</Text>
                  </View>
                </View>

                <Text style={styles.jobTime}>Started: {job.startedAt}</Text>
                <Text style={styles.jobTime}>Finished: {job.finishedAt}</Text>

                {job.errorLog && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorLabel}>Error:</Text>
                    <Text style={styles.errorMessage} numberOfLines={3}>{job.errorLog}</Text>
                  </View>
                )}

                {job.status === 'Failed' && (
                  <Pressable 
                    style={styles.retryButton} 
                    onPress={() => handleRerun(job.university)}
                  >
                    <Text style={styles.retryButtonText}>🔄 Retry</Text>
                  </Pressable>
                )}
              </View>
            )
          })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  },
  runButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#004AAD',
  },
  runButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  jobsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  jobId: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  jobUniversity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  jobStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  jobStat: {
    alignItems: 'center',
  },
  jobStatLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  jobStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  jobTime: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 12,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 11,
    color: '#7F1D1D',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
  },
})
