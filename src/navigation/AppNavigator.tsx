/**
 * AppNavigator - Main navigation controller for the Admission Times mobile app
 * 
 * Refactored to use Zustand store for state management
 * Supports all three roles: Student, University, Admin
 * Matches web frontend routing structure exactly
 */

import { useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { useAuthStore } from '../store'

import AuthLoadingScreen from '../screens/auth/AuthLoadingScreen.tsx'
import LoginScreen from '../screens/auth/LoginScreen.tsx'
import SignUpScreen from '../screens/auth/SignUpScreen.tsx'
import NotFoundScreen from '../screens/NotFoundScreen.tsx'

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
import ViewAllAdmissionsScreen from '../screens/university/ViewAllAdmissionsScreen.tsx'
import VerificationCenterScreen from '../screens/university/VerificationCenterScreen.tsx'
import ChangeLogsScreen from '../screens/university/ChangeLogsScreen.tsx'
import UniversityNotificationsCenterScreen from '../screens/university/UniversityNotificationsCenterScreen.tsx'
import UniversitySettingsScreen from '../screens/university/UniversitySettingsScreen.tsx'
import EditProfileScreen from '../screens/university/EditProfileScreen.tsx'

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen.tsx'
import AdminVerificationCenterScreen from '../screens/admin/AdminVerificationCenterScreen.tsx'
import AdminNotificationsCenterScreen from '../screens/admin/AdminNotificationsCenterScreen.tsx'
import AdminScraperJobsMonitorScreen from '../screens/admin/AdminScraperJobsMonitorScreen.tsx'
import AdminChangeLogsScreen from '../screens/admin/AdminChangeLogsScreen.tsx'
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen.tsx'

export type RootStackParamList = {
  AuthLoading: undefined
  Login: undefined
  SignUp: undefined
  NotFound: undefined

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
  ViewAllAdmissions: undefined
  VerificationCenter: undefined
  UniversityChangeLogs: undefined
  UniversityNotifications: undefined
  UniversitySettings: undefined
  EditProfile: undefined

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
  const user = useAuthStore(state => state.user)
  const isLoading = useAuthStore(state => state.isLoading)
  const checkAuth = useAuthStore(state => state.checkAuth)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Public/Auth Routes
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : user.role === 'student' ? (
        // Student Routes - ONLY MODULE ENABLED
        <>
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
          <Stack.Screen name="StudentSearch" component={SearchAdmissionsScreen} />
          <Stack.Screen name="StudentCompare" component={CompareScreen} />
          <Stack.Screen name="StudentDeadlines" component={DeadlineScreen} />
          <Stack.Screen name="StudentWatchlist" component={WatchlistScreen} />
          <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
          <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
        </>
      ) : (
        // DISABLED: University and Admin modules
        // Only student role is supported for now
        <>
          <Stack.Screen name="NotFound" component={NotFoundScreen} />
        </>
      )}

      {/* Public screens accessible from anywhere */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Features" component={FeaturesScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  )
}
