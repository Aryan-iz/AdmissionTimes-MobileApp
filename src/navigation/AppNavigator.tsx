/**
 * AppNavigator - Main navigation controller for the Admission Times mobile app
 * 
 * SCOPE NOTE: This mobile app currently implements ONLY the Student module.
 * Admin and University Representative modules are intentionally excluded in this phase
 * and planned as future work. This is a deliberate scope decision for the FYP demonstration.
 */

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
import ProfileEditScreen from '../screens/student/ProfileEditScreen.tsx'

// University and Admin screens are imported but not used in current scope
// These modules are planned for future phases
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
  ProfileEdit: undefined

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
      ) : (
        // STUDENT MODULE ONLY - Currently the only active role in this mobile app
        // University Representative and Admin modules are planned for future phases
        <>
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
          <Stack.Screen name="StudentSearch" component={SearchAdmissionsScreen} />
          <Stack.Screen name="StudentCompare" component={CompareScreen} />
          <Stack.Screen name="StudentDeadlines" component={DeadlineScreen} />
          <Stack.Screen name="StudentWatchlist" component={WatchlistScreen} />
          <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
          <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        </>
      )}

      {/* Public screens can still be reachable if you add links later */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Features" component={FeaturesScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  )
}
