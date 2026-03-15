/**
 * AppNavigator - Main navigation controller for the Admission Times mobile app
 * 
 * Student-only navigation for the mobile app.
 * Uses Zustand-backed auth state and registers only auth/student screens.
 */

import { useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import { useAuthStore } from '../store'

import AuthLoadingScreen from '../screens/auth/AuthLoadingScreen.tsx'
import LoginScreen from '../screens/auth/LoginScreen.tsx'
import SignUpScreen from '../screens/auth/SignUpScreen.tsx'

import StudentDashboardScreen from '../screens/student/StudentDashboardScreen.tsx'
import SearchAdmissionsScreen from '../screens/student/SearchAdmissionsScreen.tsx'
import CompareScreen from '../screens/student/CompareScreen.tsx'
import DeadlineScreen from '../screens/student/DeadlineScreen.tsx'
import WatchlistScreen from '../screens/student/WatchlistScreen.tsx'
import StudentNotificationsScreen from '../screens/student/StudentNotificationsScreen.tsx'
import ProgramDetailScreen from '../screens/student/ProgramDetailScreen.tsx'

export type RootStackParamList = {
  Login: undefined
  SignUp: undefined

  StudentDashboard: undefined
  StudentSearch: undefined
  StudentCompare: { ids?: string[] } | undefined
  StudentDeadlines: undefined
  StudentWatchlist: undefined
  StudentNotifications: undefined
  ProgramDetail: { id: string }
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
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
          <Stack.Screen name="StudentSearch" component={SearchAdmissionsScreen} />
          <Stack.Screen name="StudentCompare" component={CompareScreen} />
          <Stack.Screen name="StudentDeadlines" component={DeadlineScreen} />
          <Stack.Screen name="StudentWatchlist" component={WatchlistScreen} />
          <Stack.Screen name="StudentNotifications" component={StudentNotificationsScreen} />
          <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}
