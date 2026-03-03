/**
 * Admission Times Mobile App
 * React Native (Expo) + TypeScript
 * 
 * STATE MANAGEMENT: Uses Zustand for centralized state management
 * - Auth: useAuthStore
 * - Student Data: useStudentStore
 * 
 * SCOPE: STUDENT MODULE ONLY (University and Admin modules disabled)
 * 
 * FEATURES (Student Module):
 * - Authentication (Student access only)
 * - Dashboard with stats and recommendations
 * - Search and filter admissions
 * - Compare programs (up to 4)
 * - Watchlist/saved programs
 * - Deadline tracking
 * - Notifications
 * - AI Assistant integration
 * - Program details view
 */

import 'react-native-gesture-handler'

import { NavigationContainer } from '@react-navigation/native'
import { View, StatusBar, AppState, Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useRef } from 'react'

import { AiProvider } from './src/contexts/AiContext.tsx'
import AppNavigator from './src/navigation/AppNavigator.tsx'

export default function App() {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    // Set status bar on mount
    StatusBar.setBarStyle('dark-content')
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#FFFFFF')
    }

    // Listen for app state changes (background <-> foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, reset status bar
        StatusBar.setBarStyle('dark-content')
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('#FFFFFF')
        }
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <AiProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AiProvider>
      </View>
    </SafeAreaProvider>
  )
}
