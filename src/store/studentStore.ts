/**
 * Student store (Zustand).
 *
 * Holds the student's view of the catalog: verified admissions (open and closed),
 * dashboard recommendations, watchlist state and notifications. All values come
 * from the API contract via `toStudentAdmission`; nothing is inferred here.
 *
 * Every admission id is a real database id, so detail, save, reminder and
 * compare actions always address an existing record.
 *
 * @module store/studentStore
 */

import { useMemo } from 'react'
import { create } from 'zustand'
import { toStudentAdmission, sortByDeadline, type StudentAdmission } from '../domain/admission'
import { toStudentNotification, type StudentNotification } from '../domain/notification'
import { admissionsService } from '../services/admissionsService'
import { dashboardService } from '../services/dashboardService'
import { notificationsService } from '../services/notificationsService'
import { watchlistsService } from '../services/watchlistsService'
import type { Admission, StudentDashboard, Watchlist } from '../services/types'
import { getAuthUserId, registerStudentStoreReset } from './sessionCleanup'

type WatchEntry = { watchlistId: string; alertOptIn: boolean }
type WatchIndex = Record<string, WatchEntry>

export type StudentStats = StudentDashboard['stats']

export interface SearchFilters {
  search?: string
  location?: string
  degreeLevel?: string
}

interface StudentStore {
  admissions: StudentAdmission[]
  recommendations: StudentAdmission[]
  notifications: StudentNotification[]
  watchlist: WatchIndex
  stats: StudentStats | null
  fetchedUserId: string | null
  loading: boolean
  error: string | null

  fetchDashboardData: (options?: { force?: boolean }) => Promise<void>
  /** `force` skips the throttle (realtime inserts must always show up). */
  refreshNotifications: (options?: { force?: boolean }) => Promise<void>
  searchAdmissions: (filters: SearchFilters) => Promise<StudentAdmission[]>
  /** Return the admission from the store, loading it from the API if needed (deep links, notifications). */
  ensureAdmission: (id: string) => Promise<StudentAdmission | null>
  /** Save or unsave. Resolves to false (and rolls back) when the API call fails. */
  setSaved: (id: string, saved: boolean) => Promise<boolean>
  /** Turn deadline reminders on/off; enabling also saves the program. */
  setAlert: (id: string, enabled: boolean) => Promise<boolean>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  reset: () => void
}

const DASHBOARD_REFRESH_THROTTLE_MS = 15000
const NOTIFICATIONS_REFRESH_THROTTLE_MS = 8000
const PAGE_SIZE = 100
const MAX_PAGES = 5

let dashboardInFlight: Promise<void> | null = null
let lastDashboardFetchAt = 0
let notificationsInFlight: Promise<void> | null = null
let lastNotificationsRefreshAt = 0

const initialState = {
  admissions: [] as StudentAdmission[],
  recommendations: [] as StudentAdmission[],
  notifications: [] as StudentNotification[],
  watchlist: {} as WatchIndex,
  stats: null as StudentStats | null,
  fetchedUserId: null as string | null,
  loading: false,
  error: null as string | null,
}

const errorMessage = (error: unknown, fallback: string): string => {
  const maybe = error as { response?: { data?: { message?: string } }; message?: string }
  return maybe?.response?.data?.message || maybe?.message || fallback
}

const indexWatchlist = (rows: Watchlist[]): WatchIndex =>
  rows.reduce<WatchIndex>((acc, row) => {
    acc[String(row.admission_id)] = { watchlistId: String(row.id), alertOptIn: row.alert_opt_in === true }
    return acc
  }, {})

const withWatchState = (admission: StudentAdmission, watchlist: WatchIndex): StudentAdmission => {
  const entry = watchlist[admission.id]
  return { ...admission, saved: Boolean(entry), alertEnabled: entry?.alertOptIn ?? false, watchlistId: entry?.watchlistId }
}

const applyWatch = (admissions: StudentAdmission[], watchlist: WatchIndex) => admissions.map((a) => withWatchState(a, watchlist))

/** All verified admissions (students only ever receive verified ones), open and closed. */
const fetchCatalog = async (): Promise<Admission[]> => {
  const rows: Admission[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await admissionsService.list({ page, limit: PAGE_SIZE, include_closed: true })
    rows.push(...response.data)
    if (!response.pagination?.hasNext) break
  }
  return rows
}

const fetchWatchlist = async (): Promise<Watchlist[]> => {
  const response = await watchlistsService.list({ page: 1, limit: 100 })
  return response.data
}

export const useStudentStore = create<StudentStore>((set, get) => {
  /** Apply a watchlist change to every list that shows admissions. */
  const commitWatchlist = (watchlist: WatchIndex) =>
    set((state) => ({
      watchlist,
      admissions: applyWatch(state.admissions, watchlist),
      recommendations: applyWatch(state.recommendations, watchlist),
    }))

  const refreshStats = async () => {
    try {
      const response = await dashboardService.getStudentDashboard()
      set({ stats: response.data.stats })
    } catch {
      // Stats are informational; keep the previous values.
    }
  }

  return {
    ...initialState,

    fetchDashboardData: async (options) => {
      if (dashboardInFlight) return dashboardInFlight

      const userId = getAuthUserId()
      const state = get()
      if (
        !options?.force &&
        userId &&
        state.fetchedUserId === userId &&
        state.admissions.length > 0 &&
        Date.now() - lastDashboardFetchAt < DASHBOARD_REFRESH_THROTTLE_MS
      ) {
        return
      }

      const run = async () => {
        set({ loading: get().admissions.length === 0, error: null })
        try {
          const [dashboard, catalog, watchRows, notifications] = await Promise.all([
            dashboardService.getStudentDashboard(),
            fetchCatalog(),
            fetchWatchlist(),
            notificationsService.list({ page: 1, limit: 50 }),
          ])

          const watchlist = indexWatchlist(watchRows)
          const byId = new Map<string, StudentAdmission>()
          catalog.forEach((row) => byId.set(String(row.id), toStudentAdmission(row)))
          // Saved programs that are no longer in the public catalog stay visible on the watchlist.
          watchRows.forEach((row) => {
            if (row.admission && !byId.has(String(row.admission_id))) {
              byId.set(String(row.admission_id), toStudentAdmission(row.admission))
            }
          })

          lastDashboardFetchAt = Date.now()
          lastNotificationsRefreshAt = Date.now()
          set({
            admissions: applyWatch(sortByDeadline(Array.from(byId.values())), watchlist),
            recommendations: applyWatch((dashboard.data.recommended_programs || []).map(toStudentAdmission), watchlist),
            notifications: notifications.data.map(toStudentNotification),
            watchlist,
            stats: dashboard.data.stats,
            fetchedUserId: userId,
            loading: false,
            error: null,
          })
        } catch (error) {
          set({ loading: false, error: errorMessage(error, 'Could not load your dashboard. Pull to retry.') })
        }
      }

      dashboardInFlight = run()
      try {
        await dashboardInFlight
      } finally {
        dashboardInFlight = null
      }
    },

    refreshNotifications: async (options) => {
      if (notificationsInFlight && !options?.force) return notificationsInFlight
      if (!options?.force && Date.now() - lastNotificationsRefreshAt < NOTIFICATIONS_REFRESH_THROTTLE_MS) return

      const run = async () => {
        try {
          const response = await notificationsService.list({ page: 1, limit: 50 })
          lastNotificationsRefreshAt = Date.now()
          set({ notifications: response.data.map(toStudentNotification) })
        } catch {
          // Keep the current list; the next poll or realtime event retries.
        }
      }

      notificationsInFlight = run()
      try {
        await notificationsInFlight
      } finally {
        notificationsInFlight = null
      }
    },

    searchAdmissions: async (filters) => {
      const response = await admissionsService.list({
        search: filters.search || undefined,
        location: filters.location || undefined,
        degree_level: filters.degreeLevel || undefined,
        include_closed: true,
        page: 1,
        limit: PAGE_SIZE,
      })
      return applyWatch(sortByDeadline(response.data.map(toStudentAdmission)), get().watchlist)
    },

    ensureAdmission: async (id) => {
      const existing = get().admissions.find((a) => a.id === id)
      if (existing) return existing
      try {
        const response = await admissionsService.getById(id)
        if (!response.data) return null
        const admission = withWatchState(toStudentAdmission(response.data), get().watchlist)
        set((state) => (state.admissions.some((a) => a.id === id) ? state : { admissions: [...state.admissions, admission] }))
        return admission
      } catch {
        return null
      }
    },

    setSaved: async (id, saved) => {
      const before = get().watchlist
      const entry = before[id]
      if (Boolean(entry) === saved) return true

      // Optimistic update, rolled back on failure.
      const optimistic = { ...before }
      if (saved) optimistic[id] = { watchlistId: '', alertOptIn: true }
      else delete optimistic[id]
      commitWatchlist(optimistic)

      try {
        const next = { ...get().watchlist }
        if (saved) {
          // Saving turns reminders on by default, like the web app.
          const response = await watchlistsService.add(id, true)
          next[id] = { watchlistId: String(response.data.id), alertOptIn: response.data.alert_opt_in === true }
        } else if (entry?.watchlistId) {
          await watchlistsService.remove(entry.watchlistId)
          delete next[id]
        } else {
          await watchlistsService.removeByAdmissionId(id)
          delete next[id]
        }
        commitWatchlist(next)
        void refreshStats()
        return true
      } catch {
        commitWatchlist(before)
        return false
      }
    },

    setAlert: async (id, enabled) => {
      const before = get().watchlist
      const entry = before[id]
      if (entry && entry.alertOptIn === enabled) return true

      commitWatchlist({ ...before, [id]: { watchlistId: entry?.watchlistId ?? '', alertOptIn: enabled } })

      try {
        const response = entry?.watchlistId
          ? await watchlistsService.update(entry.watchlistId, { alert_opt_in: enabled })
          : await watchlistsService.add(id, enabled)
        commitWatchlist({
          ...get().watchlist,
          [id]: { watchlistId: String(response.data.id), alertOptIn: response.data.alert_opt_in === true },
        })
        void refreshStats()
        return true
      } catch {
        commitWatchlist(before)
        return false
      }
    },

    markNotificationRead: async (id) => {
      const before = get().notifications
      set({ notifications: before.map((n) => (n.id === id ? { ...n, read: true } : n)) })
      try {
        await notificationsService.markAsRead(id)
      } catch (error) {
        set({ notifications: before })
        throw error
      }
    },

    markAllNotificationsRead: async () => {
      const before = get().notifications
      set({ notifications: before.map((n) => ({ ...n, read: true })) })
      try {
        await notificationsService.markAllAsRead()
      } catch (error) {
        set({ notifications: before })
        throw error
      }
    },

    reset: () => {
      set(initialState)
      lastDashboardFetchAt = 0
      lastNotificationsRefreshAt = 0
      dashboardInFlight = null
      notificationsInFlight = null
    },
  }
})

registerStudentStoreReset(() => {
  useStudentStore.getState().reset()
})

/** Saved programs (stable across renders; selectors that build arrays loop forever in zustand 5). */
export const useSavedAdmissions = (): StudentAdmission[] => {
  const admissions = useStudentStore((state) => state.admissions)
  return useMemo(() => admissions.filter((a) => a.saved), [admissions])
}

export const useUnreadCount = (): number => useStudentStore((state) => state.notifications.filter((n) => !n.read).length)
