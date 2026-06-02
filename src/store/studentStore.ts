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
import { calculateDaysRemaining, formatDeadlineDisplay, isAdmissionActiveByPolicy } from '../data/studentData'
import { admissionsService } from '../services/admissionsService'
import { dashboardService } from '../services/dashboardService'
import { notificationsService } from '../services/notificationsService'
import { watchlistsService } from '../services/watchlistsService'
import { recommendationsService } from '../services/recommendationsService'
import { getAuthUserId, registerStudentStoreReset } from './sessionCleanup'
import type { Admission, Notification, Watchlist } from '../services/types'
import {
  extractScraperFee,
  extractScraperOfficialUrl,
  inferScraperDegreeLabelFromTitle,
  isScraperAdmission,
  flattenProgramAdmissions,
  resolveScraperAdmissionLocation,
  shouldHideGenericScraperAnnouncement,
} from '../utils/scraperAdmissionAdapter'
import {
  applyWatchlistState,
  buildWatchlistIndex,
  countUniqueSavedAdmissions,
  getBackendAdmissionId,
  removeWatchlistIndexEntry,
  resolveWatchlistEntry,
  setWatchlistIndexEntry,
  type WatchlistEntry,
  type WatchlistIndex,
} from '../utils/watchlistUtils'

import {
  RECOMMENDATION_COUNT_LIMIT,
  RECOMMENDATION_MIN_SCORE,
  limitRecommendations,
  resolveRecommendationCountStat,
} from '../utils/recommendationUtils'
import {
  resolveUpcomingDeadlineStat,
  resolveUrgentDeadlineStat,
} from '../utils/studentStatsUtils'

interface StudentStats {
  active_admissions: number
  saved_count: number
  upcoming_deadlines: number
  recommendations_count: number
  unread_notifications: number
  urgent_deadlines: number
}

interface StudentStore {
  // State
  admissions: StudentAdmission[]
  notifications: StudentNotification[]
  watchlistIndex: WatchlistIndex
  fetchedUserId: string | null
  loading: boolean
  error: string | null
  stats: StudentStats | null
  
  // Actions
  setAdmissions: (admissions: StudentAdmission[]) => void
  setNotifications: (notifications: StudentNotification[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setStats: (stats: StudentStats | null) => void
  
  // API Actions
  fetchStats: () => Promise<void>
  fetchDashboardData: (options?: { showError?: (msg: string) => void; force?: boolean }) => Promise<void>
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
  watchlistIndex: {},
  fetchedUserId: null,
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

const buildDashboardStats = (
  admissions: Admission[],
  visibleAdmissions: StudentAdmission[],
  notifications: StudentNotification[],
  backendStats?: StudentStats | null
): StudentStats => {
  const activeAdmissions = admissions
    .map((admission) => toStudentAdmission(admission))
    .filter(isAdmissionActiveByPolicy).length

  const savedCount = countUniqueSavedAdmissions(visibleAdmissions)
  const unreadNotifications = notifications.filter((notification) => !notification.read).length

  return {
    active_admissions: activeAdmissions,
    saved_count: savedCount,
    upcoming_deadlines: resolveUpcomingDeadlineStat(visibleAdmissions, backendStats?.upcoming_deadlines),
    recommendations_count: resolveRecommendationCountStat(visibleAdmissions, backendStats?.recommendations_count),
    unread_notifications: backendStats?.unread_notifications ?? unreadNotifications,
    urgent_deadlines: resolveUrgentDeadlineStat(visibleAdmissions, backendStats?.urgent_deadlines),
  }
}

const mergeWatchlistAdmissions = (
  admissionsMap: Map<string, Admission>,
  watchlists: Watchlist[]
) => {
  watchlists.forEach((watchlist) => {
    if (!watchlist.admission) {
      return
    }

    const admissionId = String(watchlist.admission.id)
    if (!admissionsMap.has(admissionId)) {
      admissionsMap.set(admissionId, watchlist.admission)
    }
  })
}

const getWatchlistEntryForAdmission = (admission: Admission, watchlistIndex: WatchlistIndex): WatchlistEntry | undefined =>
  resolveWatchlistEntry(
    {
      id: String(admission.id),
      sourceAdmissionId: admission.source_admission_id || admission.parent_admission_id || undefined,
    },
    watchlistIndex
  )

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
  const isScraper = isScraperAdmission(admission)
  const deadlineStr = admission.deadline_iso || admission.deadline || ''
  const daysRemaining = calculateDaysRemaining(deadlineStr)

  let programStatus: 'Open' | 'Closing Soon' | 'Closed' = 'Open'
  if (daysRemaining < 0) programStatus = 'Closed'
  else if (daysRemaining <= 7) programStatus = 'Closing Soon'

  const inferredScraperDegree = isScraper ? inferScraperDegreeLabelFromTitle(admission.title) : null
  const resolvedDegreeLabel =
    admission.degree_label ||
    admission.degree_level ||
    inferredScraperDegree ||
    (isScraper ? 'BS' : 'Unknown')

  const degreeKey = resolvedDegreeLabel.trim()
  const degreeType = degreeTypeMap[degreeKey] || 'BS'
  const degree = resolvedDegreeLabel || 'Unknown'
  const scraperResolvedLocation = isScraper ? resolveScraperAdmissionLocation(admission) : null
  const location = scraperResolvedLocation || admission.location || 'Location not specified'
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

  const scraperOfficialUrl = isScraper ? extractScraperOfficialUrl(admission) : undefined
  const officialUrl = scraperOfficialUrl || admissionPortalLink || universityWebsiteUrl || officialLinks[0] || undefined

  const scraperFee = isScraper ? extractScraperFee(admission) : { feeNumeric: null as number | null, feeDisplay: undefined as string | undefined }
  const feeNumeric = Number.isFinite(Number(admission.fee_amount))
    ? Number(admission.fee_amount)
    : Number.isFinite(Number(admission.application_fee))
      ? Number(admission.application_fee)
      : (typeof scraperFee.feeNumeric === 'number' ? scraperFee.feeNumeric : 0)

  const feeDisplay =
    (typeof admission.fee_display === 'string' && admission.fee_display.trim().length > 0 ? admission.fee_display.trim() : undefined) ||
    (typeof scraperFee.feeDisplay === 'string' ? scraperFee.feeDisplay : undefined) ||
    (feeNumeric > 0 ? `PKR ${feeNumeric.toLocaleString()}` : 'Not specified')

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

  const inferUniversityName = (ad: Admission): string | null => {
    const text = [ad.university_name, (ad as any).source_university_name, (ad as any).university, ad.universities?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!text) return null
    if (/\bfast\b|\bnuces\b|national\s+university\s+of\s+computer/i.test(text)) return 'FAST University'
    if (/\bgiki\b|gha?ulam\s+ishaq\s+khan/i.test(text)) return 'Ghulam Ishaq Khan Institute (GIKI)'
    if (/\bmohammad\s+ali\s+jinnah|maju|jinnah\b/i.test(text)) return 'Muhammad Ali Jinnah University'
    if (/\biba\b|institute\s+of\s+business\s+administration/i.test(text)) return 'Institute of Business Administration (IBA)'
    if (/\bnu\b|national\s+university\b/i.test(text)) return 'National University'
    return null
  }

  return {
    id: admission.id.toString(),
    sourceAdmissionId: admission.source_admission_id || admission.parent_admission_id || undefined,
    dataOrigin: isScraper ? 'scraper' : (admission.data_origin || undefined),
    university: admission.university_name || inferUniversityName(admission) || admission.city || admission.location || 'University',
    program: admission.title,
    degree,
    degreeType,
    startDate: admission.start_date || admission.created_at || '',
    deadline: deadlineStr,
    deadlineDisplay: formatDeadlineDisplay(deadlineStr),
    daysRemaining,
    fee: feeDisplay,
    feeNumeric,
    location,
    city,
    status,
    programStatus,
    updated: admission.updated_at || admission.created_at,
    alertEnabled: watchlistEntry?.alertOptIn ?? admission.alert_enabled ?? false,
    saved: Boolean(watchlistEntry || admission.saved),
    watchlistId: watchlistEntry?.watchlistId,
    matchNumeric: admission.match_score || 0,
    logoBg: '#2563EB',
    officialUrl,
    universityWebsiteUrl,
    admissionPortalLink,
    eligibility,
    aiSummary: admission.match_reason || undefined,
  }
}

const deriveStats = (admissions: StudentAdmission[], notifications: StudentNotification[]): StudentStats => {
  const active = admissions.filter(isAdmissionActiveByPolicy).length
  const saved = countUniqueSavedAdmissions(admissions)
  const upcoming = resolveUpcomingDeadlineStat(admissions)
  const recommendations = resolveRecommendationCountStat(admissions)
  const unread = notifications.filter(n => !n.read).length
  const urgent = resolveUrgentDeadlineStat(admissions)

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
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStats: (stats) => set({ stats }),
  
  // Fetch Stats
  fetchStats: async () => {
    try {
      const response = await dashboardService.getStudentDashboard()
      set({ stats: response.data.stats })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  },
  
  // Fetch Dashboard Data
  fetchDashboardData: async (options) => {
    if (options?.force) {
      lastDashboardFetchAt = 0
    }

    if (fetchDashboardInFlight) {
      return fetchDashboardInFlight
    }

    const currentUserId = getAuthUserId()
    const { admissions: existingAdmissions, fetchedUserId } = get()
    const hasExistingData = existingAdmissions.length > 0
    const now = Date.now()

    if (
      !options?.force &&
      currentUserId &&
      fetchedUserId === currentUserId &&
      hasExistingData &&
      now - lastDashboardFetchAt < DASHBOARD_REFRESH_THROTTLE_MS
    ) {
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

        let recommendations = (dashboardResponse.data.recommended_programs || [])
          .slice()
          .sort((a, b) => (Number(b.match_score) || 0) - (Number(a.match_score) || 0))
          .slice(0, RECOMMENDATION_COUNT_LIMIT)

        // Avoid unnecessary recommendation endpoint load: only fetch direct recommendations
        // if dashboard aggregate currently has none.
        if (recommendations.length === 0) {
          try {
            const recommendationResponse = await recommendationsService.getRecommendations(
              RECOMMENDATION_COUNT_LIMIT,
              RECOMMENDATION_MIN_SCORE
            )
            const recommendationMap = new Map(
              (recommendationResponse.data.recommendations || []).map((item) => [item.admission_id, item])
            )

            if (recommendationMap.size > 0) {
              const candidateAdmissions = Array.from(admissionsData.values())
              recommendations = candidateAdmissions
                .filter((admission: Admission) => recommendationMap.has(admission.id))
                .map((admission: Admission) => {
                  const rec = recommendationMap.get(admission.id)
                  const recommendedAdmission = rec?.admission
                  const recommendedLocation = recommendedAdmission?.university_city
                    ? [recommendedAdmission.university_city, recommendedAdmission.university_country].filter(Boolean).join(', ')
                    : undefined
                  return {
                    ...admission,
                    university_name: recommendedAdmission?.university_name ?? admission.university_name,
                    location: recommendedLocation ?? admission.location,
                    city: recommendedAdmission?.university_city ?? admission.city,
                    match_score: rec?.score ?? admission.match_score,
                    match_reason: rec?.reason ?? admission.match_reason,
                  }
                })
            }
          } catch (recommendationError) {
            console.warn('⚠️ [studentStore] Fallback recommendations fetch failed:', recommendationError)
          }
        }

        const userWatchlists = watchlistsResponse.data
        const watchlistIndex = buildWatchlistIndex(userWatchlists)
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

        mergeWatchlistAdmissions(admissionsMap, userWatchlists)

        const admissionSource = flattenProgramAdmissions(Array.from(admissionsMap.values()))
          .filter((admission) => !shouldHideGenericScraperAnnouncement(admission))
        const allAdmissions = admissionSource.map((admission) =>
          toStudentAdmission(admission, getWatchlistEntryForAdmission(admission, watchlistIndex))
        )
        const notifications = notificationsResponse.data.map(toStudentNotification)
        const backendStats = dashboardResponse.data.stats
        
        // Always use backend stats - never compute locally
        if (!backendStats) {
          console.warn('⚠️ [studentStore] Backend dashboard response missing stats field:', dashboardResponse.data)
        }
        console.log('📊 [studentStore] Backend stats received:', backendStats)
        
        const stats = buildDashboardStats(Array.from(admissionsMap.values()), allAdmissions, notifications, backendStats)

        lastDashboardFetchAt = Date.now()

        set({
          admissions: applyWatchlistState(allAdmissions, watchlistIndex),
          notifications,
          watchlistIndex,
          fetchedUserId: currentUserId,
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
  
  // Toggle Saved (aligned with web studentStore)
  toggleSaved: async (id, options) => {
    const { admissions, watchlistIndex } = get()
    const admission = admissions.find((a) => a.id === id)
    if (!admission) return

    const backendId = getBackendAdmissionId(admission)
    const wasSaved = admission.saved
    const entry = resolveWatchlistEntry(admission, watchlistIndex)

    set({
      admissions: admissions.map((a) =>
        a.id === id
          ? {
              ...a,
              saved: !wasSaved,
              alertEnabled: !wasSaved ? true : false,
              watchlistId: !wasSaved ? a.watchlistId : undefined,
            }
          : a
      ),
    })

    try {
      let updatedWatchlistIndex = { ...watchlistIndex }

      if (wasSaved) {
        const watchlistId = admission.watchlistId || entry?.watchlistId
        if (watchlistId) {
          await watchlistsService.remove(watchlistId)
        } else {
          await watchlistsService.removeByAdmissionId(backendId)
        }
        updatedWatchlistIndex = removeWatchlistIndexEntry(updatedWatchlistIndex, id, backendId)
      } else {
        const response = await watchlistsService.add(backendId, true)
        if (response.data?.id) {
          const indexEntry: WatchlistEntry = {
            watchlistId: response.data.id,
            alertOptIn: response.data.alert_opt_in === true,
          }
          updatedWatchlistIndex = setWatchlistIndexEntry(updatedWatchlistIndex, id, backendId, indexEntry)
        }
      }

      const admissionsWithWatchlistState = applyWatchlistState(get().admissions, updatedWatchlistIndex)
      set({
        admissions: admissionsWithWatchlistState,
        watchlistIndex: updatedWatchlistIndex,
      })
      await get().fetchStats()
    } catch (err: any) {
      console.error('❌ [studentStore] Failed to toggle saved:', err)

      set({
        admissions: admissions.map((a) =>
          a.id === id
            ? {
                ...a,
                saved: wasSaved,
                alertEnabled: wasSaved ? a.alertEnabled : false,
                watchlistId: wasSaved ? a.watchlistId : undefined,
              }
            : a
        ),
        watchlistIndex,
      })

      if (options?.showError) {
        options.showError('Failed to update saved programs. Please try again.')
      }
    }
  },
  
  // Toggle Alert (aligned with web studentStore)
  toggleAlert: async (id, options) => {
    const { admissions, watchlistIndex } = get()
    const admission = admissions.find((a) => a.id === id)
    if (!admission) return

    const backendId = getBackendAdmissionId(admission)
    const wasAlertEnabled = admission.alertEnabled
    const wasSaved = admission.saved
    const entry = resolveWatchlistEntry(admission, watchlistIndex)
    const watchlistId = admission.watchlistId || entry?.watchlistId

    set({
      admissions: admissions.map((a) =>
        a.id === id
          ? {
              ...a,
              alertEnabled: !wasAlertEnabled,
              saved: true,
            }
          : a
      ),
    })

    try {
      let updatedWatchlistIndex = { ...watchlistIndex }

      if (!wasSaved && !wasAlertEnabled) {
        const response = await watchlistsService.add(backendId, true)
        if (response.data?.id) {
          const indexEntry: WatchlistEntry = {
            watchlistId: response.data.id,
            alertOptIn: response.data.alert_opt_in === true,
          }
          updatedWatchlistIndex = setWatchlistIndexEntry(updatedWatchlistIndex, id, backendId, indexEntry)
        }
      } else if (watchlistId) {
        const response = await watchlistsService.toggleAlert(watchlistId)
        if (response.data) {
          const indexEntry: WatchlistEntry = {
            watchlistId: response.data.id,
            alertOptIn: response.data.alert_opt_in === true,
          }
          updatedWatchlistIndex = setWatchlistIndexEntry(updatedWatchlistIndex, id, backendId, indexEntry)
        }
      } else {
        const response = await watchlistsService.add(backendId, !wasAlertEnabled)
        if (response.data?.id) {
          const indexEntry: WatchlistEntry = {
            watchlistId: response.data.id,
            alertOptIn: response.data.alert_opt_in === true,
          }
          updatedWatchlistIndex = setWatchlistIndexEntry(updatedWatchlistIndex, id, backendId, indexEntry)
        }
      }

      const admissionsWithWatchlistState = applyWatchlistState(get().admissions, updatedWatchlistIndex)
      set({
        admissions: admissionsWithWatchlistState,
        watchlistIndex: updatedWatchlistIndex,
      })
      await get().fetchStats()

      if (options?.showSuccess) {
        options.showSuccess(`Alert ${!wasAlertEnabled ? 'enabled' : 'disabled'}`)
      }
    } catch (err: any) {
      console.error('❌ [studentStore] Failed to toggle alert:', err)

      set({
        admissions: admissions.map((a) =>
          a.id === id
            ? {
                ...a,
                alertEnabled: wasAlertEnabled,
                saved: wasSaved,
              }
            : a
        ),
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
        const normalizedAdmissions = flattenProgramAdmissions(Array.from(mergedAdmissions.values()))
        .filter((admission) => !shouldHideGenericScraperAnnouncement(admission))

      const mapped = normalizedAdmissions.map((admission) =>
        toStudentAdmission(admission, getWatchlistEntryForAdmission(admission, watchlistIndex))
      )
      return applyWatchlistState(mapped, watchlistIndex)
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
    lastDashboardFetchAt = 0
    lastNotificationsRefreshAt = 0
    fetchDashboardInFlight = null
    refreshNotificationsInFlight = null
  },
}))

registerStudentStoreReset(() => {
  useStudentStore.getState().reset()
})

/** Same semantics as web `savedAdmissions()` getter. */
export const selectSavedAdmissions = (state: StudentStore): StudentAdmission[] =>
  state.admissions.filter((admission) => admission.saved)
