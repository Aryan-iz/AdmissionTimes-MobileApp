/**
 * Admission Times Mobile App
 * React Native (Expo) + TypeScript
 * 
 * STATE MANAGEMENT: Uses Zustand for centralized state management
 * - Auth: useAuthStore
 * - Student Data: useStudentStore
 * 
 * SCOPE: STUDENT MODULE ONLY
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

import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { View, StatusBar, AppState, Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useRef, useState } from 'react'
import type { NotificationResponse, EventSubscription } from 'expo-notifications'
import Toast from 'react-native-toast-message'

import { AiProvider } from './src/contexts/AiContext.tsx'
import AppNavigator from './src/navigation/AppNavigator.tsx'
import type { RootStackParamList } from './src/navigation/AppNavigator.tsx'
import { useAuthStore, useStudentStore } from './src/store'
import { config } from './src/config/env'
import {
  setupNotificationChannel,
  registerForPushNotifications,
  addForegroundNotificationListener,
  addNotificationResponseListener,
  showLocalNotification,
} from './src/services/pushNotifications'
import { subscribeToStudentNotificationInserts } from './src/realtime/notificationsSubscription'
import { notificationsService } from './src/services/notificationsService'
import { toastConfig } from './src/services/toast'

const navigationRef = createNavigationContainerRef<RootStackParamList>()

export default function App() {
  const appState = useRef(AppState.currentState)
  const previousStudentUserIdRef = useRef<string | null>(null)
  const registeredTokenKeyRef = useRef<string | null>(null)
  const user = useAuthStore(state => state.user)
  const refreshNotifications = useStudentStore(state => state.refreshNotifications)
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)

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

  useEffect(() => {
    if (!config.enablePushNotifications || user?.role !== 'student') {
      return
    }

    const initializePush = async () => {
      try {
        await setupNotificationChannel()
        const token = await registerForPushNotifications()
        if (token) {
          setExpoPushToken(token)
        }
      } catch (error) {
        console.error('❌ [Push] Initialization failed:', error)
      }
    }

    initializePush()

    const foregroundSubscription: EventSubscription = addForegroundNotificationListener(() => {
      refreshNotifications().catch(() => {})
    })

    const responseSubscription: EventSubscription = addNotificationResponseListener((response: NotificationResponse) => {
      const data = response.notification.request.content.data || {}
      const admissionId =
        (data.admissionId as string | undefined) ||
        (data.admission_id as string | undefined) ||
        (data.related_entity_id as string | undefined)

      refreshNotifications().catch(() => {})

      if (
        admissionId &&
        user?.role === 'student' &&
        navigationRef.isReady()
      ) {
        navigationRef.navigate('ProgramDetail', { id: String(admissionId) })
      }
    })

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [refreshNotifications, user?.role])

  useEffect(() => {
    if (!config.enablePushNotifications || !expoPushToken) {
      return
    }

    const currentStudentUserId = user?.role === 'student' ? user.id : null
    const previousStudentUserId = previousStudentUserIdRef.current

    if (previousStudentUserId && previousStudentUserId !== currentStudentUserId) {
      notificationsService
        .unregisterPushToken({ expo_push_token: expoPushToken })
        .catch((error) => {
          if (__DEV__) {
            console.warn('⚠️ [Push] Failed to unregister push token:', error)
          }
        })
      registeredTokenKeyRef.current = null
    }

    previousStudentUserIdRef.current = currentStudentUserId

    if (!currentStudentUserId) {
      return
    }

    const tokenKey = `${currentStudentUserId}:${expoPushToken}`
    if (registeredTokenKeyRef.current === tokenKey) {
      return
    }

    notificationsService
      .registerPushToken({
        expo_push_token: expoPushToken,
        platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      })
      .then(() => {
        registeredTokenKeyRef.current = tokenKey
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn('⚠️ [Push] Failed to register push token:', error)
        }
      })
  }, [expoPushToken, user?.id, user?.role])

  useEffect(() => {
    if (!user?.id || user.role !== 'student') {
      return
    }

    const refresh = () => {
      refreshNotifications().catch(() => {})
    }

    refresh()

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refresh()
      }
    })

    const pollId = setInterval(refresh, 45000)

    let unsubscribeRealtime: (() => Promise<void>) | null = null
    if (config.enableRealtime) {
      unsubscribeRealtime = subscribeToStudentNotificationInserts({
        userId: user.id,
        onInsert: (payload) => {
          refresh()

          if (config.enablePushNotifications) {
            showLocalNotification(
              payload.title || 'New Notification',
              payload.message || 'You have a new update.',
              {
                admissionId: payload.related_entity_type === 'admission' ? payload.related_entity_id : undefined,
                related_entity_id: payload.related_entity_id,
              }
            ).catch(() => {})
          }
        },
        onError: (status) => {
          console.warn('⚠️ [Realtime] Notifications channel issue:', status)
        },
      })
    }

    return () => {
      appStateSubscription.remove()
      clearInterval(pollId)
      if (unsubscribeRealtime) {
        unsubscribeRealtime().catch(() => {})
      }
    }
  }, [refreshNotifications, user?.id, user?.role])

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <AiProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </AiProvider>
        <Toast config={toastConfig} topOffset={52} />
      </View>
    </SafeAreaProvider>
  )
}
