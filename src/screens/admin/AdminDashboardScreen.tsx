import { useMemo } from 'react'
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useAuth } from '../../contexts/AuthContext'
import {
  pendingVerifications,
  recentAdminActions,
  adminNotifications,
  scraperActivities,
  systemMetrics,
  admissionAnalytics,
  getActionColor,
  getScraperStatusColor,
  getVerificationStatusColor,
} from '../../data/adminData'
import { screenStyles } from '../../utils/screenStyles'
import { Header } from '../../components/ui'
import {
  AdmissionStatusChart,
  UniversityDistributionChart,
  MonthlyTrendChart,
  DegreeTypeChart,
} from '../../components/admin'

export default function AdminDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { user, logout } = useAuth()

  const displayPendingVerifications = useMemo(() => pendingVerifications.slice(0, 5), [])
  const displayRecentActions = useMemo(() => recentAdminActions.slice(0, 5), [])
  const displayNotifications = useMemo(() => adminNotifications.slice(0, 4), [])
  const displayScraperActivities = useMemo(() => scraperActivities.slice(0, 4), [])

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <Header
        userName={user?.name || 'Admin User'}
        userRole="Admin"
        notifications={adminNotifications.length}
        onNotificationPress={() => navigation.navigate('AdminNotifications')}
        onLogout={logout}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* System Metrics */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>System Metrics</Text>
        <View style={screenStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Total Users</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{systemMetrics.totalUsers.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Total Admissions</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{systemMetrics.totalAdmissions.toLocaleString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Total Alerts Sent</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{systemMetrics.totalAlertsSent.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Admission Analytics Charts */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Admission Analytics</Text>
        
        <View style={screenStyles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Status Breakdown</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Distribution of verification statuses</Text>
          <AdmissionStatusChart data={admissionAnalytics.statusBreakdown} />
        </View>

        <View style={screenStyles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>University Distribution</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Admissions by university</Text>
          <UniversityDistributionChart data={admissionAnalytics.universityDistribution} />
        </View>

        <View style={screenStyles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Monthly Admission Trend</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>New postings over time</Text>
          <MonthlyTrendChart data={admissionAnalytics.monthlyTrend} />
        </View>

        <View style={screenStyles.card}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Degree Type Distribution</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Admissions by degree level</Text>
          <DegreeTypeChart data={admissionAnalytics.degreeTypeDistribution.map(d => ({ type: d.degreeType, count: d.count, percentage: 0 }))} />
        </View>
      </View>

      {/* Pending Verifications */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 8 }}>Pending Verifications</Text>
        <Text style={[screenStyles.muted, { marginBottom: 12 }]}>
          {displayPendingVerifications.length} admission{displayPendingVerifications.length !== 1 ? 's' : ''} awaiting review
        </Text>
        {displayPendingVerifications.length === 0 ? (
          <Text style={screenStyles.muted}>No pending verifications.</Text>
        ) : (
          <View>
            {displayPendingVerifications.map((item) => {
              const statusColors = getVerificationStatusColor('Pending' as any)
              return (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate('AdminVerificationCenter')}
                  style={[screenStyles.card, { marginBottom: 10 }]}
                >
                  <Text style={{ fontWeight: '700' }}>{item.admissionTitle}</Text>
                  <Text style={screenStyles.muted}>{item.university}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: statusColors.text }}>{item.status}</Text>
                    <Text style={[screenStyles.muted, { fontSize: 12 }]}>Submitted: {item.submittedOn}</Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
        <View style={{ height: 8 }} />
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminVerificationCenter')}>
          <Text style={screenStyles.buttonText}>View All Verifications</Text>
        </Pressable>
      </View>

      {/* Recent Admin Actions */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Recent Actions</Text>
        {displayRecentActions.length === 0 ? (
          <Text style={screenStyles.muted}>No recent actions.</Text>
        ) : (
          <View>
            {displayRecentActions.map((action) => {
              const actionColors = getActionColor(action.action)
              return (
                <View key={action.id} style={[screenStyles.card, { marginBottom: 10 }]}>
                  <Text style={{ fontWeight: '700' }}>{action.admission}</Text>
                  <Text style={[screenStyles.muted, { marginTop: 4 }]}>By {action.admin}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: actionColors.text }}>{action.action}</Text>
                    <Text style={[screenStyles.muted, { fontSize: 12 }]}>{action.timestamp}</Text>
                  </View>
                  {action.remarks && <Text style={[screenStyles.muted, { fontSize: 12, marginTop: 4 }]}>{action.remarks}</Text>}
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* Scraper Activities */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Scraper Activities</Text>
        {displayScraperActivities.length === 0 ? (
          <Text style={screenStyles.muted}>No scraper activities.</Text>
        ) : (
          <View>
            {displayScraperActivities.map((activity) => {
              const statusColors = getScraperStatusColor(activity.status)
              return (
                <View key={activity.id} style={[screenStyles.card, { marginBottom: 10 }]}>
                  <Text style={{ fontWeight: '700' }}>{activity.university}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: statusColors.text }}>{activity.status}</Text>
                    <Text style={[screenStyles.muted, { fontSize: 12 }]}>Last run: {activity.lastRun}</Text>
                  </View>
                  {activity.changesDetected > 0 && (
                    <Text style={[screenStyles.muted, { fontSize: 12, marginTop: 4 }]}>
                      {activity.changesDetected} change{activity.changesDetected !== 1 ? 's' : ''} detected
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        )}
        <View style={{ height: 8 }} />
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminScraperJobs')}>
          <Text style={screenStyles.buttonText}>View Scraper Jobs</Text>
        </Pressable>
      </View>

      {/* Notifications */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Notifications</Text>
        {displayNotifications.length === 0 ? (
          <Text style={screenStyles.muted}>No notifications.</Text>
        ) : (
          <View>
            {displayNotifications.map((notif) => (
              <View key={notif.id} style={[screenStyles.card, { marginBottom: 10 }]}>
                <Text style={{ fontWeight: '700' }}>{notif.title}</Text>
                <Text style={[screenStyles.muted, { marginTop: 4 }]}>{notif.message}</Text>
                <Text style={[screenStyles.muted, { fontSize: 12, marginTop: 8 }]}>{notif.timeAgo}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 8 }} />
        <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminNotifications')}>
          <Text style={screenStyles.buttonText}>View All Notifications</Text>
        </Pressable>
      </View>

      {/* Quick Actions */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Quick Actions</Text>
        <View style={{ marginBottom: 12 }}>
          <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminAnalytics')}>
            <Text style={screenStyles.buttonText}>Analytics</Text>
          </Pressable>
        </View>
        <View style={{ marginBottom: 12 }}>
          <Pressable style={screenStyles.button} onPress={() => navigation.navigate('AdminChangeLogs')}>
            <Text style={screenStyles.buttonText}>Change Logs</Text>
          </Pressable>
        </View>
        <View style={{ marginBottom: 12 }}>
          <Pressable style={screenStyles.button} onPress={() => logout()}>
            <Text style={screenStyles.buttonText}>Logout</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}
