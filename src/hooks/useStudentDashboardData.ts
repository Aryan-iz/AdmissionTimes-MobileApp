/**
 * Mirrors web useStudentDashboardData — loads student catalog + watchlist for current user.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useStudentStore } from '../store/studentStore'

export function useStudentDashboardData(options?: { refreshOnMount?: boolean }) {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const admissions = useStudentStore((state) => state.admissions)
  const loading = useStudentStore((state) => state.loading)
  const error = useStudentStore((state) => state.error)
  const fetchDashboardData = useStudentStore((state) => state.fetchDashboardData)

  const userId = user?.id || null
  const fetchTriggeredRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      fetchTriggeredRef.current = null
      return
    }

    if (!options?.refreshOnMount && fetchTriggeredRef.current === userId) {
      return
    }

    const storeState = useStudentStore.getState()
    if (storeState.loading && !options?.refreshOnMount) {
      return
    }

    if (!options?.refreshOnMount && storeState.fetchedUserId === userId && storeState.admissions.length > 0) {
      fetchTriggeredRef.current = userId
      return
    }

    fetchTriggeredRef.current = userId
    void fetchDashboardData()
  }, [fetchDashboardData, isAuthenticated, options?.refreshOnMount, userId])

  const refetch = () => fetchDashboardData({ force: true })

  return { admissions, loading, error, refetch }
}
