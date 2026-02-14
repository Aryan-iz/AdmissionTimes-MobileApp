/**
 * Admission Times Mobile App
 * React Native (Expo) + TypeScript
 * 
 * SCOPE: This mobile application implements the STUDENT MODULE only.
 * Admin and University Representative modules are intentionally excluded in this phase
 * and planned as future work. This is a deliberate scope decision for the FYP demonstration.
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

import { AuthProvider } from './src/contexts/AuthContext.tsx'
import { StudentDataProvider } from './src/contexts/StudentDataContext.tsx'
import { UniversityDataProvider } from './src/contexts/UniversityDataContext.tsx'
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
        <AuthProvider>
          <StudentDataProvider>
            <UniversityDataProvider>
              <AiProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </AiProvider>
            </UniversityDataProvider>
          </StudentDataProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  )
}
