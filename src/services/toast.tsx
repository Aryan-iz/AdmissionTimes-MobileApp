import React from 'react'
import { StyleSheet } from 'react-native'
import Toast, { BaseToast, ErrorToast, type ToastConfig } from 'react-native-toast-message'

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 6,
    minHeight: 62,
    paddingRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  message: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
})

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[styles.container, { borderLeftColor: '#16A34A' }]}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={[styles.container, { borderLeftColor: '#2563EB' }]}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[styles.container, { borderLeftColor: '#DC2626' }]}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
    />
  ),
}

const normalizeAuthErrorMessage = (message: string) => {
  const clean = message.replace(/^\[?AuthApiError:?\]?\s*/i, '').trim()
  const lower = clean.toLowerCase()

  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.'
  }

  return clean || 'Something went wrong. Please try again.'
}

export const showSuccessToast = (title: string, message: string) => {
  Toast.show({
    type: 'success',
    position: 'top',
    text1: title,
    text2: message,
    visibilityTime: 3200,
    autoHide: true,
  })
}

export const showInfoToast = (title: string, message: string) => {
  Toast.show({
    type: 'info',
    position: 'top',
    text1: title,
    text2: message,
    visibilityTime: 3200,
    autoHide: true,
  })
}

export const showAuthErrorToast = (title: string, message: string) => {
  Toast.show({
    type: 'error',
    position: 'top',
    text1: title,
    text2: normalizeAuthErrorMessage(message),
    visibilityTime: 3800,
    autoHide: true,
  })
}
