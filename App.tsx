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

import { NavigationContainer } from '@react-navigation/native'
import { View, StatusBar, AppState, Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useEffect, useRef, useState } from 'react'
import type { NotificationResponse, EventSubscription } from 'expo-notifications'
import Toast from 'react-native-toast-message'

import { AiProvider, useAi } from './src/contexts/AiContext.tsx'
import StudentAiOverlay from './src/components/ai/StudentAiOverlay.tsx'
import AppNavigator from './src/navigation/AppNavigator.tsx'
import { navigationRef } from './src/navigation/navigationRef'
import { useAuthStore, useStudentStore } from './src/store'
import { config } from './src/config/env'
import {
  setupNotificationChannel,
  registerForPushNotifications,
  addForegroundNotificationListener,
  addNotificationResponseListener,
  showLocalNotification,
  rememberRegisteredPushToken,
} from './src/services/pushNotifications'
import { subscribeToStudentNotificationInserts } from './src/realtime/notificationsSubscription'
import { notificationsService } from './src/services/notificationsService'
import { toastConfig } from './src/services/toast'
import { admissionIdOf } from './src/domain/notification'
import { createLogger } from './src/utils/logger'

const log = createLogger('App')

/**
 * Notifications shown in the last minute (push and realtime can both deliver
 * the same one); used to avoid showing a duplicate local notification.
 */
const SEEN_WINDOW_MS = 60_000
const recentlySeenNotifications = new Map<string, number>()

const pruneSeenNotifications = () => {
  const now = Date.now()
  recentlySeenNotifications.forEach((seenAt, key) => {
    if (now - seenAt > SEEN_WINDOW_MS) recentlySeenNotifications.delete(key)
  })
}

const markNotificationAsSeen = (notificationId?: string | null) => {
  if (!notificationId) return
  pruneSeenNotifications()
  recentlySeenNotifications.set(notificationId, Date.now())
}

const hasSeenNotificationRecently = (notificationId?: string | null) => {
  if (!notificationId) return false
  pruneSeenNotifications()
  return recentlySeenNotifications.has(notificationId)
}

const extractNotificationId = (data: Record<string, unknown>) =>
  (data.notification_id as string | undefined) || (data.notificationId as string | undefined) || null


function syncNavigationRoute(setActiveRouteName: (routeName?: string) => void) {
  const routeName = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined
  setActiveRouteName(routeName)
}

function AppNavigationHost() {
  const { setActiveRouteName } = useAi()
  const user = useAuthStore((state) => state.user)
  const refreshNotifications = useStudentStore((state) => state.refreshNotifications)
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  // Read by the realtime handler without re-subscribing when the token arrives.
  const expoPushTokenRef = useRef<string | null>(null)
  expoPushTokenRef.current = expoPushToken
  const appState = useRef(AppState.currentState)
  const previousStudentUserIdRef = useRef<string | null>(null)
  const registeredTokenKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
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
        log.error('Initialization failed:', error)
      }
    }

    initializePush()

    const foregroundSubscription: EventSubscription = addForegroundNotificationListener((notification) => {
      const data = (notification.request.content.data || {}) as Record<string, unknown>
      markNotificationAsSeen(extractNotificationId(data))
      refreshNotifications().catch(() => {})
    })

    const responseSubscription: EventSubscription = addNotificationResponseListener((response: NotificationResponse) => {
      const data = response.notification.request.content.data || {}
      markNotificationAsSeen(extractNotificationId(data as Record<string, unknown>))
      // Server pushes carry admission_id; local notifications (realtime) carry admissionId.
      const admissionId = (data.admission_id as string | undefined) || (data.admissionId as string | undefined)

      refreshNotifications().catch(() => {})

      if (admissionId && user?.role === 'student' && navigationRef.isReady()) {
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

    // Sign-out unregisters the token itself (authStore.signOut) while the
    // session is still valid; here we only forget what was registered.
    if (previousStudentUserId && previousStudentUserId !== currentStudentUserId) {
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
        rememberRegisteredPushToken(expoPushToken)
      })
      .catch((error) => {
        if (__DEV__) {
          log.warn('Failed to register push token:', error)
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
          refreshNotifications({ force: true }).catch(() => {})

          const notificationId = payload.id || null
          if (hasSeenNotificationRecently(notificationId)) {
            return
          }

          // With a registered push token the server push shows it; otherwise show it locally.
          if (config.enablePushNotifications && expoPushTokenRef.current) {
            return
          }

          showLocalNotification(
            payload.title || 'New Notification',
            payload.message || 'You have a new update.',
            {
              notification_id: payload.id,
              admissionId: admissionIdOf(payload),
            }
          ).catch(() => {})
          markNotificationAsSeen(notificationId)
        },
        onError: (status) => {
          log.warn('Notifications channel issue:', status)
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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => syncNavigationRoute(setActiveRouteName)}
      onStateChange={() => syncNavigationRoute(setActiveRouteName)}
    >
      <AppNavigator />
      <StudentAiOverlay />
    </NavigationContainer>
  )
}

export default function App() {
  useEffect(() => {
    StatusBar.setBarStyle('dark-content')
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#FFFFFF')
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
          <AppNavigationHost />
        </AiProvider>
        <Toast config={toastConfig} topOffset={52} />
      </View>
    </SafeAreaProvider>
  )
}
