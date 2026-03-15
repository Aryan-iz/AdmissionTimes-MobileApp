import { Platform } from 'react-native'
import Constants from 'expo-constants'
import type { Notification, NotificationResponse } from 'expo-notifications'

type NotificationsModule = typeof import('expo-notifications')

let notificationsModulePromise: Promise<NotificationsModule | null> | null = null
let pushUnsupportedWarned = false

const warnPushUnsupportedOnce = (reason: string) => {
  if (pushUnsupportedWarned) {
    return
  }

  pushUnsupportedWarned = true
  console.warn(`⚠️ [Push] Push notifications unavailable in this runtime (${reason}).`)
}

const isExpoGoStoreClient = (): boolean => {
  const constantsAny = Constants as unknown as {
    appOwnership?: string
    executionEnvironment?: string
  }

  return constantsAny.appOwnership === 'expo' || constantsAny.executionEnvironment === 'storeClient'
}

const getNotificationsModule = async (): Promise<NotificationsModule | null> => {
  if (Platform.OS === 'web') {
    return null
  }

  if (Platform.OS === 'android' && isExpoGoStoreClient()) {
    warnPushUnsupportedOnce('Expo Go on Android (SDK 53+)')
    return null
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = (async () => {
      try {
        const notifications = await import('expo-notifications')

        if (typeof notifications.setNotificationHandler === 'function') {
          notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
            }),
          })
        } else {
          warnPushUnsupportedOnce('missing setNotificationHandler API')
          return null
        }

        return notifications
      } catch (error: any) {
        const message = String(error?.message || error)
        if (message.includes('removed from Expo Go') || message.includes('expo-notifications')) {
          warnPushUnsupportedOnce('expo-notifications not available in current client')
          return null
        }

        throw error
      }
    })()
  }

  return notificationsModulePromise
}

const noopSubscription = {
  remove: () => {},
}

export const setupNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return
  }

  const notifications = await getNotificationsModule()
  if (!notifications) {
    return
  }

  if (typeof notifications.setNotificationChannelAsync !== 'function') {
    warnPushUnsupportedOnce('missing Android notification channel API')
    return
  }

  await notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563EB',
  })
}

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return null
  }

  const notifications = await getNotificationsModule()
  if (!notifications) {
    return null
  }

  if (
    typeof notifications.getPermissionsAsync !== 'function' ||
    typeof notifications.requestPermissionsAsync !== 'function' ||
    typeof notifications.getExpoPushTokenAsync !== 'function'
  ) {
    warnPushUnsupportedOnce('missing permissions or push token APIs')
    return null
  }

  const Device = await import('expo-device')
  const Constants = await import('expo-constants')

  if (!Device.isDevice) {
    console.warn('⚠️ [Push] Push notifications require a physical device')
    return null
  }

  const { status: existingStatus } = await notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('⚠️ [Push] Notification permission not granted')
    return null
  }

  const projectId =
    Constants.default.expoConfig?.extra?.eas?.projectId ||
    Constants.default.easConfig?.projectId

  if (!projectId) {
    console.warn('⚠️ [Push] Missing EAS project ID, cannot fetch Expo push token')
    return null
  }

  const token = (await notifications.getExpoPushTokenAsync({ projectId })).data
  return token
}

export const addForegroundNotificationListener = (
  listener: (notification: Notification) => void
) => {
  if (Platform.OS === 'web') {
    return noopSubscription
  }

  const subscriptionHolder: { remove: () => void } = { remove: () => {} }

  getNotificationsModule().then(notifications => {
    if (!notifications) {
      return
    }

    if (typeof notifications.addNotificationReceivedListener !== 'function') {
      return
    }

    const subscription = notifications.addNotificationReceivedListener((notification) => {
      listener(notification)
    })

    subscriptionHolder.remove = () => subscription.remove()
  }).catch(() => {})

  return {
    remove: () => subscriptionHolder.remove(),
  }
}

export const addNotificationResponseListener = (
  listener: (response: NotificationResponse) => void
) => {
  if (Platform.OS === 'web') {
    return noopSubscription
  }

  const subscriptionHolder: { remove: () => void } = { remove: () => {} }

  getNotificationsModule().then(notifications => {
    if (!notifications) {
      return
    }

    if (typeof notifications.addNotificationResponseReceivedListener !== 'function') {
      return
    }

    const subscription = notifications.addNotificationResponseReceivedListener((response) => {
      listener(response)
    })

    subscriptionHolder.remove = () => subscription.remove()
  }).catch(() => {})

  return {
    remove: () => subscriptionHolder.remove(),
  }
}

export const showLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const notifications = await getNotificationsModule()
  if (!notifications) {
    return
  }

  if (typeof notifications.scheduleNotificationAsync !== 'function') {
    return
  }

  await notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null,
  })
}
