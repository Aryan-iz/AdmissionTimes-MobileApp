import { useMemo, useState } from 'react'
import { ScrollView, Text, View, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'

import type { RootStackParamList } from '../../navigation/AppNavigator'
import { useUniversityData } from '../../contexts/UniversityDataContext'
import { useAuth } from '../../contexts/AuthContext'
import { getStatusColor } from '../../data/universityData'
import { screenStyles } from '../../utils/screenStyles'
import { Header } from '../../components/ui'

export default function UniversityDashboardScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { admissions, deleteAdmission } = useUniversityData()
  const { user, logout } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Calculate stats
  const stats = useMemo(() => {
    const active = admissions.filter(a => a.status === 'Active' || a.status === 'Verified').length
    const totalViews = admissions.reduce((sum, a) => {
      const views = parseInt(a.views.replace('k', '000').replace(/[^\d]/g, '')) || 0
      return sum + views
    }, 0)
    const closingSoon = admissions.filter(a => {
      if (!a.deadline) return false
      const deadline = new Date(a.deadline)
      const now = new Date()
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays > 0
    }).length
    const verified = admissions.filter(a => a.status === 'Verified').length
    const total = admissions.length

    return { active, totalViews, closingSoon, verified, total }
  }, [admissions])

  // Filter admissions
  const filteredAdmissions = useMemo(() => {
    if (statusFilter === 'All') return admissions
    return admissions.filter(a => a.status === statusFilter)
  }, [admissions, statusFilter])

  const handleDelete = (id: string) => {
    deleteAdmission(id)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <Header
        userName={user?.name || 'University User'}
        userRole="University"
        notifications={0}
        onLogout={logout}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View style={[screenStyles.card, { backgroundColor: '#2563EB', borderColor: '#2563EB' }]}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: 'white' }}>Welcome back!</Text>
        <Text style={{ color: 'white', opacity: 0.9, marginTop: 6 }}>
          Here's your admission overview for today.
        </Text>
        <View style={{ height: 12 }} />
        <Pressable
          style={[screenStyles.button, { backgroundColor: 'white' }]}
          onPress={() => navigation.navigate('ManageAdmissions')}
        >
          <Text style={{ color: '#2563EB', fontWeight: '700' }}>+ New Admission</Text>
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Your Stats</Text>
        <View style={screenStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Active Admissions</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{stats.active}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Total Views</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>
              {stats.totalViews >= 1000 ? `${(stats.totalViews / 1000).toFixed(1)}k` : stats.totalViews}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Closing Soon (this week)</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>{stats.closingSoon}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>Verified Admissions</Text>
            <Text style={{ fontSize: 24, fontWeight: '800' }}>
              {stats.verified}/{stats.total} ({stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Admissions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {['All', 'Active', 'Verified', 'Pending Audit', 'Draft'].map((status) => (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={[
                screenStyles.button,
                {
                  backgroundColor: statusFilter === status ? '#2563EB' : '#F3F4F6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 8,
                  marginBottom: 8,
                },
              ]}
            >
              <Text style={{ fontWeight: '600', color: statusFilter === status ? 'white' : '#6B7280' }}>{status}</Text>
            </Pressable>
          ))}
        </View>

        {filteredAdmissions.length === 0 ? (
          <Text style={screenStyles.muted}>No admissions found.</Text>
        ) : (
          <View>
            {filteredAdmissions.slice(0, 10).map((admission) => {
              const statusColors = getStatusColor(admission.status)
              return (
                <Pressable
                  key={admission.id}
                  onPress={() => navigation.navigate('VerificationCenter')}
                  style={[screenStyles.card, { marginBottom: 10 }]}
                >
                  <Text style={{ fontWeight: '700' }}>{admission.title}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: statusColors.text }}>{admission.status}</Text>
                    <Text style={[screenStyles.muted, { fontSize: 12 }]}>Deadline: {admission.deadline}</Text>
                  </View>
                  <Text style={[screenStyles.muted, { fontSize: 12, marginTop: 4 }]}>Views: {admission.views}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <Pressable
                      style={[screenStyles.button, { flex: 1, backgroundColor: '#10B981', marginRight: 8 }]}
                      onPress={() => navigation.navigate('ManageAdmissions')}
                    >
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                    </Pressable>
                    <Pressable
                      style={[screenStyles.button, { flex: 1, backgroundColor: '#EF4444' }]}
                      onPress={() => handleDelete(admission.id)}
                    >
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Delete</Text>
                    </Pressable>
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={screenStyles.section}>
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
            <Pressable style={screenStyles.button} onPress={() => navigation.navigate('ManageAdmissions')}>
              <Text style={screenStyles.buttonText}>Manage Admissions</Text>
            </Pressable>
          </View>
          <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
            <Pressable style={screenStyles.button} onPress={() => navigation.navigate('VerificationCenter')}>
              <Text style={screenStyles.buttonText}>Verification Center</Text>
            </Pressable>
          </View>
          <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
            <Pressable style={screenStyles.button} onPress={() => navigation.navigate('UniversityChangeLogs')}>
              <Text style={screenStyles.buttonText}>Change Logs</Text>
            </Pressable>
          </View>
          <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
            <Pressable style={screenStyles.button} onPress={() => navigation.navigate('UniversityNotifications')}>
              <Text style={screenStyles.buttonText}>Notifications</Text>
            </Pressable>
          </View>
          <View style={{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }}>
            <Pressable style={screenStyles.button} onPress={() => navigation.navigate('UniversitySettings')}>
              <Text style={screenStyles.buttonText}>Settings</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  )
}
