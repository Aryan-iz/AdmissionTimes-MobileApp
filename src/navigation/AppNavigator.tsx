import { createStackNavigator } from '@react-navigation/stack'

import { useAuth } from '../contexts/AuthContext.tsx'

import AuthLoadingScreen from '../screens/auth/AuthLoadingScreen.tsx'
import LoginScreen from '../screens/auth/LoginScreen.tsx'

import HomeScreen from '../screens/public/HomeScreen.tsx'
import FeaturesScreen from '../screens/public/FeaturesScreen.tsx'
import ContactScreen from '../screens/public/ContactScreen.tsx'

import StudentDashboardScreen from '../screens/student/StudentDashboardScreen.tsx'
import SearchAdmissionsScreen from '../screens/student/SearchAdmissionsScreen.tsx'
import CompareScreen from '../screens/student/CompareScreen.tsx'
import DeadlineScreen from '../screens/student/DeadlineScreen.tsx'
import WatchlistScreen from '../screens/student/WatchlistScreen.tsx'
import StudentNotificationsScreen from '../screens/student/StudentNotificationsScreen.tsx'
import ProgramDetailScreen from '../screens/student/ProgramDetailScreen.tsx'

import UniversityDashboardScreen from '../screens/university/UniversityDashboardScreen.tsx'
import ManageAdmissionsScreen from '../screens/university/ManageAdmissionsScreen.tsx'
import VerificationCenterScreen from '../screens/university/VerificationCenterScreen.tsx'
import ChangeLogsScreen from '../screens/university/ChangeLogsScreen.tsx'
import UniversityNotificationsCenterScreen from '../screens/university/UniversityNotificationsCenterScreen.tsx'
import UniversitySettingsScreen from '../screens/university/UniversitySettingsScreen.tsx'

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen.tsx'
import AdminVerificationCenterScreen from '../screens/admin/AdminVerificationCenterScreen.tsx'
import AdminNotificationsCenterScreen from '../screens/admin/AdminNotificationsCenterScreen.tsx'
import AdminScraperJobsMonitorScreen from '../screens/admin/AdminScraperJobsMonitorScreen.tsx'
import AdminChangeLogsScreen from '../screens/admin/AdminChangeLogsScreen.tsx'
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen.tsx'

export type RootStackParamList = {
  AuthLoading: undefined
  Login: undefined

  Home: undefined
  Features: undefined
  Contact: undefined

  // Student
  StudentDashboard: undefined
  StudentSearch: undefined
  StudentCompare: { ids?: string[] } | undefined
  StudentDeadlines: undefined
  StudentWatchlist: undefined
  StudentNotifications: undefined
  ProgramDetail: { id: string }

  // University
  UniversityDashboard: undefined
  ManageAdmissions: { editId?: string } | undefined
  VerificationCenter: undefined
  UniversityChangeLogs: undefined
  UniversityNotifications: undefined
  UniversitySettings: undefined

  // Admin
  AdminDashboard: undefined
  AdminVerificationCenter: undefined
  AdminNotifications: undefined
  AdminScraperJobs: undefined
  AdminChangeLogs: undefined
  AdminAnalytics: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'student' ? (
        <>
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
          <Stack.Screen name="StudentSearch" component={SearchAdmissionsScreen} />
          <Stack.Screen name="StudentCompare" component={CompareScreen} />
          <Stack.Screen name="StudentDeadlines" component={DeadlineScreen} />
          <Stack.Screen name="StudentWatchlist" component={WatchlistScreen} />
          <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
          <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
        </>
      ) : user.role === 'university' ? (
        <>
          <Stack.Screen name="UniversityDashboard" component={UniversityDashboardScreen} />
          <Stack.Screen name="ManageAdmissions" component={ManageAdmissionsScreen} />
          <Stack.Screen name="VerificationCenter" component={VerificationCenterScreen} />
          <Stack.Screen name="UniversityChangeLogs" component={ChangeLogsScreen} />
          <Stack.Screen name="UniversityNotifications" component={UniversityNotificationsCenterScreen} />
          <Stack.Screen name="UniversitySettings" component={UniversitySettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminVerificationCenter" component={AdminVerificationCenterScreen} />
          <Stack.Screen name="AdminNotifications" component={AdminNotificationsCenterScreen} />
          <Stack.Screen name="AdminScraperJobs" component={AdminScraperJobsMonitorScreen} />
          <Stack.Screen name="AdminChangeLogs" component={AdminChangeLogsScreen} />
          <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
        </>
      )}

      {/* Public screens can still be reachable if you add links later */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Features" component={FeaturesScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  )
}
