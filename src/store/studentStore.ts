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
import { sharedAdmissions, sharedNotifications } from '../data/studentData'
import { dashboardService } from '../services/dashboardService'
import { watchlistsService } from '../services/watchlistsService'
import type { Admission } from '../services/types'

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
  savedAdmissions: string[]  // Array of admission IDs
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
  
  // API Actions (mock implementations)
  fetchStats: () => Promise<void>
  fetchDashboardData: (options?: { showError?: (msg: string) => void }) => Promise<void>
  toggleSaved: (id: string, options?: { showError?: (msg: string) => void }) => Promise<void>
  toggleAlert: (id: string, options?: { showError?: (msg: string) => void; showSuccess?: (msg: string) => void }) => Promise<void>
  updateAdmission: (id: string, updates: Partial<StudentAdmission>) => void
  getAdmissionById: (id: string) => StudentAdmission | undefined
  getAdmissionsByIds: (ids: string[]) => StudentAdmission[]
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
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

const initialState = {
  admissions: [],
  notifications: [],
  savedAdmissions: [],
  loading: false,
  error: null,
  stats: null,
}

// Clone data to avoid mutations
const cloneAdmissions = () => sharedAdmissions.map(a => ({ ...a }))
const cloneNotifications = () => sharedNotifications.map(n => ({ ...n }))

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
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const { admissions, notifications } = get()
      
      const active = admissions.filter(a => a.programStatus === 'Open' || a.programStatus === 'Closing Soon').length
      const saved = admissions.filter(a => a.saved).length
      const upcoming = admissions.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 7).length
      const recommendations = admissions.filter(a => a.matchNumeric && a.matchNumeric >= 85).length
      const unread = notifications.filter(n => !n.read).length
      const urgent = admissions.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 7 && a.programStatus !== 'Closed').length
      
      const stats: StudentStats = {
        active_admissions: active,
        saved_count: saved,
        upcoming_deadlines: upcoming,
        recommendations_count: recommendations,
        unread_notifications: unread,
        urgent_deadlines: urgent,
      }
      
      set({ stats })
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  },
  
  // Fetch Dashboard Data
  fetchDashboardData: async (options) => {
    console.log('📊 [studentStore] Starting dashboard data fetch...')
    set({ loading: true, error: null })
    
    try {
      console.log('📊 [studentStore] Calling dashboardService.getStudentDashboard()')
      
      // Call backend API
      const response = await dashboardService.getStudentDashboard()
      
      console.log('✅ [studentStore] Dashboard API response received')
      console.log('📊 [studentStore] Stats:', response.data.stats)
      console.log('📊 [studentStore] Recommended programs count:', response.data.recommended_programs?.length || 0)
      console.log('📊 [studentStore] Upcoming deadlines count:', response.data.upcoming_deadlines?.length || 0)
      
      // Transform backend admissions to StudentAdmission format
      const transformAdmission = (admission: Admission, isSaved: boolean = false): StudentAdmission => {
        // Calculate days remaining from deadline (handle null/undefined)
        const deadlineStr = admission.deadline || ''
        const deadline = deadlineStr ? new Date(deadlineStr) : new Date()
        const today = new Date()
        const diffTime = deadline.getTime() - today.getTime()
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        // Determine program status
        let programStatus: 'Open' | 'Closing Soon' | 'Closed' = 'Open'
        if (daysRemaining < 0) {
          programStatus = 'Closed'
        } else if (daysRemaining <= 7) {
          programStatus = 'Closing Soon'
        }
        
        // Extract location parts
        const locationParts = (admission.location || '').split(',')
        const city = locationParts[0]?.trim() || 'Unknown'
        const fullLocation = admission.location || 'Unknown Location'
        
        // Format deadline display
        const deadlineDate = deadlineStr ? new Date(deadlineStr) : new Date()
        const deadlineDisplay = deadlineDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
        
        return {
          id: admission.id.toString(),
          university: admission.university_name || `University ${admission.university_id}`,
          program: admission.title,
          degree: admission.degree_level || 'Unknown',
          degreeType: admission.degree_level as any || 'BS',
          startDate: admission.start_date || '',
          deadline: deadlineStr || new Date().toISOString(),
          deadlineDisplay,
          daysRemaining,
          fee: admission.application_fee?.toString() || '0',
          feeNumeric: admission.application_fee || 0,
          location: fullLocation,
          city,
          status: admission.verification_status === 'verified' ? 'Verified' as AdmissionStatus : 'Pending' as AdmissionStatus,
          programStatus,
          updated: admission.updated_at || admission.created_at,
          alertEnabled: admission.alert_enabled || false, // Use backend value
          saved: isSaved,
          matchNumeric: 0,
          logoBg: '#2563EB',
        }
      }
      
      // Transform all admissions from recommended_programs
      // NOTE: Backend returns both saved and unsaved in recommended_programs
      const allAdmissions: StudentAdmission[] = (response.data.recommended_programs || []).map(a => transformAdmission(a, a.saved))
      
      // Extract saved IDs from admissions marked as saved
      const savedIds = allAdmissions.filter(a => a.saved).map(a => a.id)
      
      // Transform notifications (use mock for now since backend doesn't return them in dashboard)
      const notifications = cloneNotifications()
      
      // Build stats from backend response
      // Backend returns stats object with all needed counts
      const stats: StudentStats = {
        active_admissions: response.data.stats?.active_admissions || 0,
        saved_count: response.data.stats?.saved_count || 0,
        upcoming_deadlines: response.data.stats?.upcoming_deadlines || 0,
        recommendations_count: response.data.stats?.recommendations_count || 0,
        unread_notifications: response.data.stats?.unread_notifications || 0,
        urgent_deadlines: response.data.stats?.urgent_deadlines || 0,
      }
      
      console.log('✅ [studentStore] Transformed data:')
      console.log('   - Admissions:', allAdmissions.length)
      console.log('   - Saved IDs:', savedIds.length)
      console.log('   - Notifications:', notifications.length)
      console.log('   - Stats:', stats)
      
      set({
        admissions: allAdmissions,
        notifications,
        savedAdmissions: savedIds,
        stats,
        loading: false,
        error: null,
      })
      
      console.log('✅ [studentStore] Dashboard data loaded successfully')
    } catch (err: any) {
      console.error('❌ [studentStore] Failed to fetch dashboard data:', err)
      console.error('❌ [studentStore] Error details:', err.message)
      console.error('❌ [studentStore] Error response:', err.response?.data)
      
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch dashboard data'
      
      set({ 
        error: errorMsg,
        loading: false,
      })
      
      if (options?.showError) {
        options.showError('Failed to load dashboard data. Please try again.')
      }
    }
  },
  
  // Toggle Saved
  toggleSaved: async (id, options) => {
    const { admissions, savedAdmissions } = get()
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
              // CRITICAL: Saving or unsaving should NEVER enable alerts
              // Alerts can ONLY be enabled via toggleAlert()
              alertEnabled: false,
            }
          : a
      ),
      savedAdmissions: updatedSavedIds,
    })
    
    try {
      // Call backend API to persist change
      if (wasSaved) {
        // Remove from watchlist
        console.log('🔖 [studentStore] Removing from watchlist:', id)
        await watchlistsService.removeByAdmissionId(id)
        console.log('✅ [studentStore] Removed from watchlist:', id)
      } else {
        // Add to watchlist (with alert disabled)
        console.log('🔖 [studentStore] Adding to watchlist:', id)
        const response = await watchlistsService.add(id, false) // alert_opt_in = false
        console.log('✅ [studentStore] Added to watchlist:', id, 'Watchlist ID:', response.data?.id)
      }
      
      console.log('✅ Watchlist updated:', id, 'Saved:', !wasSaved)
      
      // Update stats
      await get().fetchStats()
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
      })
      
      if (options?.showError) {
        options.showError('Failed to update saved programs. Please try again.')
      }
    }
  },
  
  // Toggle Alert
  toggleAlert: async (id, options) => {
    const { admissions, savedAdmissions } = get()
    const admission = admissions.find(a => a.id === id)
    if (!admission) return
    
    const wasAlertEnabled = admission.alertEnabled
    const wasSaved = admission.saved
    
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
      
      // First ensure item is in watchlist
      if (!wasSaved) {
        console.log('🔖 [studentStore] Adding to watchlist first (for alert):', id)
        await watchlistsService.add(id, !wasAlertEnabled)
      } else {
        // Get watchlist to find the watchlist ID
        // Note: We need to find the watchlist entry by admission ID
        // For now, we'll need to list watchlists and find it
        console.log('🔖 [studentStore] Fetching watchlist to toggle alert...')
        const watchlistResponse = await watchlistsService.list()
        const watchlistItem = watchlistResponse.data.find(w => w.admission_id === id)
        
        if (watchlistItem) {
          console.log('🔔 [studentStore] Toggling alert for watchlist ID:', watchlistItem.id)
          await watchlistsService.toggleAlert(watchlistItem.id)
        } else {
          throw new Error('Watchlist item not found')
        }
      }
      
      console.log('✅ Alert updated:', id, 'Enabled:', !wasAlertEnabled)
      
      if (options?.showSuccess) {
        options.showSuccess(`Alert ${!wasAlertEnabled ? 'enabled' : 'disabled'}`)
      }
      
      // Update stats
      await get().fetchStats()
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
    set({
      notifications: get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    })
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Update stats
    await get().fetchStats()
  },
  
  // Mark All Notifications Read
  markAllNotificationsRead: async () => {
    set({
      notifications: get().notifications.map(n => ({ ...n, read: true })),
    })
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Update stats
    await get().fetchStats()
  },
  
  // Search Admissions
  searchAdmissions: async (filters, options) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let results = cloneAdmissions()
      
      // Apply filters
      if (filters?.search) {
        const query = filters.search.toLowerCase()
        results = results.filter(a =>
          a.program.toLowerCase().includes(query) ||
          a.university.toLowerCase().includes(query) ||
          a.degree.toLowerCase().includes(query)
        )
      }
      
      if (filters?.city) {
        results = results.filter(a => a.city === filters.city)
      }
      
      if (filters?.degreeLevel) {
        results = results.filter(a => a.degreeType === filters.degreeLevel)
      }
      
      if (filters?.minFee !== undefined) {
        results = results.filter(a => a.feeNumeric >= filters.minFee!)
      }
      
      if (filters?.maxFee !== undefined) {
        results = results.filter(a => a.feeNumeric <= filters.maxFee!)
      }
      
      return results
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
