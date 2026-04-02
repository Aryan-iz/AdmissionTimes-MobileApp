import apiClient from './apiClient'
import type { ApiResponse } from './types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../store/authStore'

const STUDENT_EVENT_CAP_STORAGE_KEY = 'admissionTimes.mobile.student.eventCaps.v1'

type CappedStudentEventKind = 'view' | 'click'

export type ActivityType =
  | 'viewed'
  | 'searched'
  | 'compared'
  | 'watchlisted'
  | 'saved'
  | 'alert'
  | 'deadline'
  | 'notification'

interface TrackActivityPayload {
  activity_type: ActivityType
  entity_type: string
  entity_id: string
  metadata?: Record<string, unknown>
}

const toCappedStudentEventKind = (activityType: ActivityType): CappedStudentEventKind | null => {
  if (activityType === 'viewed') return 'view'
  if (['searched', 'compared', 'alert'].includes(activityType)) return 'click'
  return null
}

const shouldTrackCappedStudentEvent = async (payload: TrackActivityPayload): Promise<boolean> => {
  if (payload.entity_type !== 'admission') return true

  const user = useAuthStore.getState().user
  if (!user || user.role !== 'student') return true

  const eventKind = toCappedStudentEventKind(payload.activity_type)
  if (!eventKind) return true

  try {
    const raw = await AsyncStorage.getItem(STUDENT_EVENT_CAP_STORAGE_KEY)
    const store: Record<string, string> = raw ? JSON.parse(raw) : {}
    const capKey = `${user.id}:${payload.entity_id}:${eventKind}`

    if (store[capKey]) {
      return false
    }

    store[capKey] = new Date().toISOString()
    await AsyncStorage.setItem(STUDENT_EVENT_CAP_STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    // If storage is unavailable, allow event to avoid data loss.
    return true
  }
}

interface ActivityRecord {
  id: string
  user_id: string
  user_type: 'student' | 'university' | 'admin'
  activity_type: ActivityType
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export const activityService = {
  track: async (payload: TrackActivityPayload): Promise<ApiResponse<ActivityRecord>> => {
    const response = await apiClient.post('/activity', payload)
    return response.data
  },
}

export const trackActivitySafe = async (payload: TrackActivityPayload): Promise<void> => {
  try {
    await activityService.track(payload)
  } catch (error) {
    if (__DEV__) {
      console.warn('⚠️ [activityService] Failed to track activity:', payload.activity_type, payload.entity_id, error)
    }
  }
}

export const trackCappedStudentActivitySafe = async (payload: TrackActivityPayload): Promise<void> => {
  try {
    const shouldTrack = await shouldTrackCappedStudentEvent(payload)
    if (!shouldTrack) return

    await activityService.track(payload)
  } catch (error) {
    if (__DEV__) {
      console.warn('⚠️ [activityService] Failed to track capped activity:', payload.activity_type, payload.entity_id, error)
    }
  }
}