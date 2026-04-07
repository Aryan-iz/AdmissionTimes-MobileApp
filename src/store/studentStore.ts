/**
 * Student Store (Zustand) - Mobile App
 * 
 * Student-specific state management matching web frontend
 * Connected to backend API via dashboardService
 * 
 * @module store/studentStore
 */

import { create } from 'zustand'
import type { StudentAdmission, StudentNotification, AdmissionStatus } from '../data/studentData'
import type { NotificationType } from '../data/studentData'
import { admissionsService } from '../services/admissionsService'
import { dashboardService } from '../services/dashboardService'
import { notificationsService } from '../services/notificationsService'
import { watchlistsService } from '../services/watchlistsService'
import { recommendationsService } from '../services/recommendationsService'
import type { Admission, Notification, Watchlist } from '../services/types'

const RECOMMENDATION_MIN_SCORE = 50

interface StudentStats {
  active_admissions: number
  saved_count: number
  upcoming_deadlines: number
  recommendations_count: number
  unread_notifications: number
  urgent_deadlines: number
}

interface WatchlistEntry {
  watchlistId: string
  alertOptIn: boolean
}

type WatchlistIndex = Record<string, WatchlistEntry>

interface StudentStore {
  // State
  admissions: StudentAdmission[]
  notifications: StudentNotification[]
  savedAdmissions: string[]  // Array of admission IDs
  watchlistIndex: WatchlistIndex
  loading: boolean
  error: string | null
  stats: StudentStats | null
  
  // Actions
  setAdmissions: (admissions: StudentAdmission[]) => void
  setNotifications: (notifications: StudentNotification[]) => void
  setSavedAdmissions: (ids: string[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setStats: (stats: StudentStats | null) => void
  
  // API Actions
  fetchStats: () => Promise<void>
  fetchDashboardData: (options?: { showError?: (msg: string) => void }) => Promise<void>
  toggleSaved: (id: string, options?: { showError?: (msg: string) => void }) => Promise<void>
  toggleAlert: (id: string, options?: { showError?: (msg: string) => void; showSuccess?: (msg: string) => void }) => Promise<void>
  updateAdmission: (id: string, updates: Partial<StudentAdmission>) => void
  getAdmissionById: (id: string) => StudentAdmission | undefined
  getAdmissionsByIds: (ids: string[]) => StudentAdmission[]
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  searchAdmissions: (filters?: {
    search?: string
    country?: string
    city?: string
    degreeLevel?: string
    fieldOfStudy?: string
    minFee?: number
    maxFee?: number
    deadline?: string
    deliveryMode?: string
    page?: number
    limit?: number
  }, options?: { showError?: (msg: string) => void }) => Promise<StudentAdmission[]>
  
  // Cleanup
  reset: () => void
}

const DASHBOARD_REFRESH_THROTTLE_MS = 15000
const NOTIFICATIONS_REFRESH_THROTTLE_MS = 8000

let fetchDashboardInFlight: Promise<void> | null = null
let lastDashboardFetchAt = 0
let refreshNotificationsInFlight: Promise<void> | null = null
let lastNotificationsRefreshAt = 0

const initialState = {
  admissions: [],
  notifications: [],
  savedAdmissions: [],
  watchlistIndex: {},
  loading: false,
  error: null,
  stats: null,
}

const degreeTypeMap: Record<string, StudentAdmission['degreeType']> = {
  BS: 'BS',
  BSc: 'BS',
  Bachelor: 'BS',
  BBA: 'BBA',
  MS: 'MS',
  MSc: 'MS',
  Master: 'MS',
  MBA: 'MBA',
  PhD: 'PhD',
  MD: 'MD',
  MPhil: 'MPhil',
}

const readString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

const toNotificationType = (notification: Notification): NotificationType => {
  const category = String(notification.category || '').toLowerCase()
  const title = String(notification.title || '').toLowerCase()
  const message = String(notification.message || '').toLowerCase()
  const relatedType = String(notification.related_entity_type || '').toLowerCase()
  const combined = `${category} ${title} ${message} ${relatedType}`

  if (
    category === 'deadline' ||
    combined.includes('deadline') ||
    combined.includes('reminder') ||
    combined.includes('closing soon') ||
    combined.includes('due') ||
    combined.includes('alert')
  ) {
    return 'alert'
  }

  if (
    category === 'verification' ||
    category === 'update' ||
    relatedType === 'admission' ||
    combined.includes('admission') ||
    combined.includes('program') ||
    combined.includes('verification') ||
    combined.includes('updated')
  ) {
    return 'admission'
  }

  return 'system'
}

const toTimeAgo = (createdAt: string): string => {
  const created = new Date(createdAt).getTime()
  const now = Date.now()
  const diffMinutes = Math.max(1, Math.floor((now - created) / (1000 * 60)))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

const buildWatchlistIndex = (watchlists: Watchlist[]): WatchlistIndex => {
  return watchlists.reduce<WatchlistIndex>((acc, item) => {
    acc[item.admission_id] = {
      watchlistId: item.id,
      alertOptIn: item.alert_opt_in === true,
    }
    return acc
  }, {})
}

const toStudentNotification = (notification: Notification): StudentNotification => {
  const type = toNotificationType(notification)
  const color =
    notification.priority === 'urgent' || notification.priority === 'high'
      ? '#EF4444'
      : notification.priority === 'medium'
        ? '#F59E0B'
        : '#2563EB'

  return {
    id: notification.id,
    type,
    title: notification.title,
    description: notification.message,
    time: notification.created_at,
    timeAgo: toTimeAgo(notification.created_at),
    read: notification.is_read,
    icon: '',
    iconColor: color,
    admissionId: notification.related_entity_type === 'admission' ? (notification.related_entity_id || undefined) : undefined,
  }
}

const toStudentAdmission = (admission: Admission, watchlistEntry?: WatchlistEntry): StudentAdmission => {
  const deadlineStr = admission.deadline || ''
  const deadlineDate = deadlineStr ? new Date(deadlineStr) : new Date()
  const daysRemaining = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  let programStatus: 'Open' | 'Closing Soon' | 'Closed' = 'Open'
  if (daysRemaining < 0) programStatus = 'Closed'
  else if (daysRemaining <= 7) programStatus = 'Closing Soon'

  const degreeKey = (admission.degree_level || 'BS').trim()
  const degreeType = degreeTypeMap[degreeKey] || 'BS'
  const degree = admission.degree_level || 'Unknown'
  const location = admission.location || 'Unknown Location'
  const city = location.split(',')[0]?.trim() || 'Unknown'
  const requirements =
    admission.requirements && typeof admission.requirements === 'object' && !Array.isArray(admission.requirements)
      ? (admission.requirements as Record<string, any>)
      : {}
  const requirementLinks =
    requirements.links && typeof requirements.links === 'object' && !Array.isArray(requirements.links)
      ? (requirements.links as Record<string, any>)
      : {}

  const officialLinks = [
    ...readStringArray(requirements.officialLinks),
    ...readStringArray(requirementLinks.officialLinks),
  ]

  const admissionPortalLink =
    readString(requirements.admissionPortalLink) ||
    readString(requirements.admission_portal_link) ||
    readString(requirements.portalLink) ||
    readString(requirementLinks.admissionPortalLink) ||
    readString(requirementLinks.admission_portal_link) ||
    readString(requirementLinks.portalLink)

  const universityWebsiteUrl =
    readString(requirements.websiteUrl) ||
    readString(requirements.website_url) ||
    readString(requirements.officialWebsite) ||
    readString(requirementLinks.websiteUrl) ||
    readString(requirementLinks.website_url) ||
    readString(requirementLinks.officialWebsite)

  const officialUrl = admissionPortalLink || universityWebsiteUrl || officialLinks[0] || undefined

  const eligibilityRecord =
    requirements.eligibility && typeof requirements.eligibility === 'object' && !Array.isArray(requirements.eligibility)
      ? (requirements.eligibility as Record<string, any>)
      : {}
  const criteriaRecord =
    requirements.criteria && typeof requirements.criteria === 'object' && !Array.isArray(requirements.criteria)
      ? (requirements.criteria as Record<string, any>)
      : {}

  const eligibility =
    readString(requirements.eligibility) ||
    readString(eligibilityRecord.text) ||
    readString(eligibilityRecord.description) ||
    readString(eligibilityRecord.value) ||
    readString(requirements.eligibilityCriteria) ||
    readString(requirements.eligibility_criteria) ||
    readString(requirements.generalRequirements) ||
    readString(requirements.criteria) ||
    readString(criteriaRecord.text) ||
    readString(criteriaRecord.description) ||
    readString(criteriaRecord.value) ||
    readString(requirements.requirements) ||
    admission.eligibility ||
    undefined

  const rawStatus = String(admission.verification_status || '').toLowerCase()
  const status: AdmissionStatus =
    rawStatus === 'verified'
      ? 'Verified'
      : rawStatus === 'rejected'
        ? 'Closed'
        : rawStatus === 'pending' || rawStatus === 'draft'
          ? 'Pending'
          : 'Pending'

  return {
    id: admission.id.toString(),
    university: admission.university_name || `University ${admission.university_id || 'Unknown'}`,
    program: admission.title,
    degree,
    degreeType,
    startDate: admission.start_date || admission.created_at || '',
    deadline: deadlineStr || new Date().toISOString(),
    deadlineDisplay: deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    daysRemaining,
    fee: admission.application_fee ? `${admission.application_fee}` : '0',
    feeNumeric: admission.application_fee || 0,
    location,
    city,
    status,
    programStatus,
    updated: admission.updated_at || admission.created_at,
    alertEnabled: watchlistEntry?.alertOptIn ?? admission.alert_enabled ?? false,
    saved: Boolean(watchlistEntry || admission.saved),
    matchNumeric: admission.match_score || 0,
    logoBg: '#2563EB',
    officialUrl,
    universityWebsiteUrl,
    admissionPortalLink,
    eligibility,
    aiSummary: admission.match_reason || undefined,
  }
}

const applyWatchlistState = (
  admissions: StudentAdmission[],
  watchlistIndex: WatchlistIndex
): StudentAdmission[] => {
  return admissions.map((admission) => {
    const watchlistEntry = watchlistIndex[admission.id]

    return {
      ...admission,
      saved: Boolean(watchlistEntry),
      alertEnabled: watchlistEntry?.alertOptIn ?? false,
    }
  })
}

const deriveStats = (admissions: StudentAdmission[], notifications: StudentNotification[]): StudentStats => {
  const active = admissions.filter(a => a.programStatus === 'Open' || a.programStatus === 'Closing Soon').length
  const saved = admissions.filter(a => a.saved).length
  const upcoming = admissions.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 7).length
  const recommendations = admissions.filter(a => (a.matchNumeric || 0) >= RECOMMENDATION_MIN_SCORE).length
  const unread = notifications.filter(n => !n.read).length
  const urgent = admissions.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 3 && a.programStatus !== 'Closed').length

  return {
    active_admissions: active,
    saved_count: saved,
    upcoming_deadlines: upcoming,
    recommendations_count: recommendations,
    unread_notifications: unread,
    urgent_deadlines: urgent,
  }
}

export const useStudentStore = create<StudentStore>((set, get) => ({
  // Initial State
  ...initialState,
  
  // Basic Setters
  setAdmissions: (admissions) => set({ admissions }),
  setNotifications: (notifications) => set({ notifications }),
  setSavedAdmissions: (ids) => set({ savedAdmissions: ids }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStats: (stats) => set({ stats }),
  
  // Fetch Stats
  fetchStats: async () => {
    try {
      const { admissions, notifications } = get()

      set({ stats: deriveStats(admissions, notifications) })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  },
  
  // Fetch Dashboard Data
  fetchDashboardData: async (options) => {
    if (fetchDashboardInFlight) {
      return fetchDashboardInFlight
    }

    const { admissions: existingAdmissions } = get()
    const hasExistingData = existingAdmissions.length > 0
    const now = Date.now()

    if (hasExistingData && now - lastDashboardFetchAt < DASHBOARD_REFRESH_THROTTLE_MS) {
      return
    }

    const runFetch = async () => {
      console.log('📊 [studentStore] Starting dashboard data fetch...')
      set({ loading: !hasExistingData, error: null })

      try {
        const [dashboardResponse, admissionsResponse, watchlistsResponse, notificationsResponse] = await Promise.all([
          dashboardService.getStudentDashboard(),
          Promise.allSettled([
            admissionsService.list({ page: 1, limit: 100, verification_status: 'verified' }),
            admissionsService.list({ page: 1, limit: 100, verification_status: 'pending' }),
          ]),
          watchlistsService.list({ page: 1, limit: 100 }),
          notificationsService.list({ page: 1, limit: 50 }),
        ])

        const admissionsData = new Map<string, Admission>()
        const verifiedResult = admissionsResponse[0]
        const pendingResult = admissionsResponse[1]

        if (verifiedResult.status === 'fulfilled') {
          verifiedResult.value.data.forEach((admission) => {
            admissionsData.set(String(admission.id), admission)
          })
        }

        if (pendingResult.status === 'fulfilled') {
          pendingResult.value.data.forEach((admission) => {
            admissionsData.set(String(admission.id), admission)
          })
        }

        if (pendingResult.status === 'rejected') {
          console.warn('⚠️ [studentStore] Pending admissions fetch failed, continuing with verified admissions only')
        }

        let recommendations = dashboardResponse.data.recommended_programs || []

        // Avoid unnecessary recommendation endpoint load: only fetch direct recommendations
        // if dashboard aggregate currently has none.
        if (recommendations.length === 0) {
          try {
            const recommendationResponse = await recommendationsService.getRecommendations(10, RECOMMENDATION_MIN_SCORE)
            const recommendationMap = new Map(
              (recommendationResponse.data.recommendations || []).map((item) => [item.admission_id, item])
            )

            if (recommendationMap.size > 0) {
              const candidateAdmissions = Array.from(admissionsData.values())
              recommendations = candidateAdmissions
                .filter((admission: Admission) => recommendationMap.has(admission.id))
                .map((admission: Admission) => {
                  const rec = recommendationMap.get(admission.id)
                  return {
                    ...admission,
                    match_score: rec?.score ?? admission.match_score,
                    match_reason: rec?.reason ?? admission.match_reason,
                  }
                })
            }
          } catch (recommendationError) {
            console.warn('⚠️ [studentStore] Fallback recommendations fetch failed:', recommendationError)
          }
        }

        const watchlistIndex = buildWatchlistIndex(watchlistsResponse.data)
        const admissionsMap = new Map<string, Admission>()

        Array.from(admissionsData.values()).forEach((admission) => {
          admissionsMap.set(String(admission.id), admission)
        })

        recommendations.forEach((admission) => {
          const key = String(admission.id)
          const existing = admissionsMap.get(key)
          if (!existing) {
            admissionsMap.set(key, admission)
            return
          }

          // Preserve recommendation signals when the same admission already exists
          // in the base admission catalog response.
          admissionsMap.set(key, {
            ...existing,
            ...admission,
            match_score: admission.match_score ?? existing.match_score,
            match_reason: admission.match_reason ?? existing.match_reason,
          })
        })

        const admissionSource = Array.from(admissionsMap.values())
        const allAdmissions = admissionSource.map((admission) =>
          toStudentAdmission(admission, watchlistIndex[admission.id])
        )
        const notifications = notificationsResponse.data.map(toStudentNotification)
        const stats = deriveStats(allAdmissions, notifications)
        const savedIds = allAdmissions.filter(a => a.saved).map(a => a.id)

        lastDashboardFetchAt = Date.now()

        set({
          admissions: allAdmissions,
          notifications,
          savedAdmissions: savedIds,
          watchlistIndex,
          stats,
          loading: false,
          error: null,
        })
      } catch (err: any) {
        console.error('❌ [studentStore] Failed to fetch dashboard data:', err)

        const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch dashboard data'

        set({ 
          error: errorMsg,
          loading: false,
        })

        if (options?.showError) {
          options.showError('Failed to load dashboard data. Please try again.')
        }
      }
    }

    fetchDashboardInFlight = runFetch()

    try {
      await fetchDashboardInFlight
    } finally {
      fetchDashboardInFlight = null
    }
  },
  
  // Toggle Saved
  toggleSaved: async (id, options) => {
    const { admissions, savedAdmissions, watchlistIndex } = get()
    const admission = admissions.find(a => a.id === id)
    if (!admission) return
    
    const wasSaved = admission.saved
    const originalAlertEnabled = admission.alertEnabled // Capture for rollback
    
    // Optimistic update - update both admissions and savedAdmissions array
    const updatedSavedIds = wasSaved
      ? savedAdmissions.filter(savedId => savedId !== id)
      : [...savedAdmissions, id]
    
    set({
      admissions: admissions.map(a =>
        a.id === id
          ? {
              ...a,
              saved: !wasSaved,
              alertEnabled: false,
            }
          : a
      ),
      savedAdmissions: updatedSavedIds,
      watchlistIndex: wasSaved
        ? Object.fromEntries(Object.entries(watchlistIndex).filter(([admissionId]) => admissionId !== id))
        : watchlistIndex,
    })
    
    try {
      let updatedWatchlistIndex = watchlistIndex

      if (wasSaved) {
        console.log('🔖 [studentStore] Removing from watchlist:', id)
        await watchlistsService.removeByAdmissionId(id)
        console.log('✅ [studentStore] Removed from watchlist:', id)
        updatedWatchlistIndex = Object.fromEntries(
          Object.entries(updatedWatchlistIndex).filter(([admissionId]) => admissionId !== id)
        )
      } else {
        console.log('🔖 [studentStore] Adding to watchlist:', id)
        const response = await watchlistsService.add(id, false) // alert_opt_in = false
        console.log('✅ [studentStore] Added to watchlist:', id, 'Watchlist ID:', response.data?.id)
        if (response.data) {
          updatedWatchlistIndex = {
            ...updatedWatchlistIndex,
            [id]: {
              watchlistId: response.data.id,
              alertOptIn: response.data.alert_opt_in === true,
            },
          }
        }
      }
      
      console.log('✅ Watchlist updated:', id, 'Saved:', !wasSaved)
      const admissionsWithWatchlistState = applyWatchlistState(get().admissions, updatedWatchlistIndex)
      const nextSavedAdmissions = Object.keys(updatedWatchlistIndex)
      const nextStats = deriveStats(admissionsWithWatchlistState, get().notifications)

      set({
        admissions: admissionsWithWatchlistState,
        savedAdmissions: nextSavedAdmissions,
        watchlistIndex: updatedWatchlistIndex,
        stats: nextStats,
      })
    } catch (err: any) {
      console.error('❌ [studentStore] Failed to toggle saved:', err)
      console.error('   Error details:', err.response?.data || err.message)
      
      // Rollback both admissions and savedAdmissions to original state
      set({
        admissions: admissions.map(a =>
          a.id === id
            ? {
                ...a,
                saved: wasSaved,
                alertEnabled: originalAlertEnabled, // Restore original value
              }
            : a
        ),
        savedAdmissions: savedAdmissions,
        watchlistIndex,
      })
      
      if (options?.showError) {
        options.showError('Failed to update saved programs. Please try again.')
      }
    }
  },
  
  // Toggle Alert
  toggleAlert: async (id, options) => {
    const { admissions, savedAdmissions, watchlistIndex } = get()
    const admission = admissions.find(a => a.id === id)
    if (!admission) return
    
    const wasAlertEnabled = admission.alertEnabled
    const wasSaved = admission.saved
    const existingWatchlist = watchlistIndex[id]
    
    // Optimistic update
    set({
      admissions: admissions.map(a =>
        a.id === id
          ? {
              ...a,
              alertEnabled: !wasAlertEnabled,
              saved: true, // Alert implies saved
            }
          : a
      ),
      savedAdmissions: wasSaved ? savedAdmissions : [...savedAdmissions, id],
    })
    
    try {
      console.log('🔔 [studentStore] Toggling alert for:', id)

      let updatedWatchlistIndex = watchlistIndex

      if (!existingWatchlist) {
        console.log('🔖 [studentStore] Adding to watchlist first (for alert):', id)
        const response = await watchlistsService.add(id, !wasAlertEnabled)
        if (response.data) {
          updatedWatchlistIndex = {
            ...updatedWatchlistIndex,
            [id]: {
              watchlistId: response.data.id,
              alertOptIn: response.data.alert_opt_in === true,
            },
          }
        }
      } else {
        console.log('🔔 [studentStore] Toggling alert for watchlist ID:', existingWatchlist.watchlistId)
        const response = await watchlistsService.toggleAlert(existingWatchlist.watchlistId)
        if (response.data) {
          updatedWatchlistIndex = {
            ...updatedWatchlistIndex,
            [id]: {
              watchlistId: response.data.id,
              alertOptIn: response.data.alert_opt_in === true,
            },
          }
        }
      }
      
      console.log('✅ Alert updated:', id, 'Enabled:', !wasAlertEnabled)
      const admissionsWithWatchlistState = applyWatchlistState(get().admissions, updatedWatchlistIndex)
      const nextSavedAdmissions = Object.keys(updatedWatchlistIndex)
      const nextStats = deriveStats(admissionsWithWatchlistState, get().notifications)

      set({
        admissions: admissionsWithWatchlistState,
        savedAdmissions: nextSavedAdmissions,
        watchlistIndex: updatedWatchlistIndex,
        stats: nextStats,
      })
      
      if (options?.showSuccess) {
        options.showSuccess(`Alert ${!wasAlertEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch (err: any) {
      console.error('❌ [studentStore] Failed to toggle alert:', err)
      console.error('   Error details:', err.response?.data || err.message)
      
      // Rollback both admissions and savedAdmissions
      set({
        admissions: admissions.map(a =>
          a.id === id
            ? {
                ...a,
                alertEnabled: wasAlertEnabled,
                saved: wasSaved,
              }
            : a
        ),
        savedAdmissions: savedAdmissions,
        watchlistIndex,
      })
      
      if (options?.showError) {
        options.showError('Failed to update alert. Please try again.')
      }
    }
  },
  
  // Update Admission
  updateAdmission: (id, updates) => {
    set({
      admissions: get().admissions.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })
  },
  
  // Get Admission By ID
  getAdmissionById: (id) => {
    return get().admissions.find(a => a.id === id)
  },
  
  // Get Admissions By IDs
  getAdmissionsByIds: (ids) => {
    const idSet = new Set(ids)
    return get().admissions.filter(a => idSet.has(a.id))
  },
  
  // Mark Notification Read
  markNotificationRead: async (id) => {
    const previousNotifications = get().notifications

    set({
      notifications: get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    })

    try {
      await notificationsService.markAsRead(id)
    } catch (err) {
      set({ notifications: previousNotifications })
      throw err
    } finally {
      await get().fetchStats()
    }
  },

  // Mark All Notifications Read
  markAllNotificationsRead: async () => {
    const previousNotifications = get().notifications

    set({
      notifications: get().notifications.map(n => ({ ...n, read: true })),
    })

    try {
      await notificationsService.markAllAsRead()
    } catch (err) {
      set({ notifications: previousNotifications })
      throw err
    } finally {
      await get().fetchStats()
    }
  },

  refreshNotifications: async () => {
    if (refreshNotificationsInFlight) {
      return refreshNotificationsInFlight
    }

    const now = Date.now()
    if (now - lastNotificationsRefreshAt < NOTIFICATIONS_REFRESH_THROTTLE_MS) {
      return
    }

    const runRefresh = async () => {
      try {
        const response = await notificationsService.list({ page: 1, limit: 50 })
        const notifications = response.data.map(toStudentNotification)
        lastNotificationsRefreshAt = Date.now()
        set({ notifications, stats: deriveStats(get().admissions, notifications) })
      } catch (err) {
        console.error('Failed to refresh notifications:', err)
      }
    }

    refreshNotificationsInFlight = runRefresh()

    try {
      await refreshNotificationsInFlight
    } finally {
      refreshNotificationsInFlight = null
    }
  },

  // Search Admissions
  searchAdmissions: async (filters, options) => {
    try {
      const safeLimit = Math.min(filters?.limit || 100, 100)
      const [verifiedResult, pendingResult] = await Promise.allSettled([
        admissionsService.list({
          search: filters?.search,
          location: filters?.city,
          degree_level: filters?.degreeLevel,
          field_of_study: filters?.fieldOfStudy,
          verification_status: 'verified',
          page: filters?.page || 1,
          limit: safeLimit,
        }),
        admissionsService.list({
          search: filters?.search,
          location: filters?.city,
          degree_level: filters?.degreeLevel,
          field_of_study: filters?.fieldOfStudy,
          verification_status: 'pending',
          page: filters?.page || 1,
          limit: safeLimit,
        }),
      ])

      const mergedAdmissions = new Map<string, Admission>()
      if (verifiedResult.status === 'fulfilled') {
        verifiedResult.value.data.forEach((admission) => mergedAdmissions.set(String(admission.id), admission))
      }
      if (pendingResult.status === 'fulfilled') {
        pendingResult.value.data.forEach((admission) => mergedAdmissions.set(String(admission.id), admission))
      }

      const { watchlistIndex } = get()
      return Array.from(mergedAdmissions.values()).map((admission) =>
        toStudentAdmission(admission, watchlistIndex[admission.id])
      )
    } catch (err: any) {
      console.error('Failed to search admissions:', err)

      if (options?.showError) {
        options.showError('Failed to search admissions. Please try again.')
      }

      return []
    }
  },
  
  // Reset
  reset: () => {
    set(initialState)
  },
}))
