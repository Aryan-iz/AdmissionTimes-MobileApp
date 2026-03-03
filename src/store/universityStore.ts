/**
 * University Store (Zustand) - Mobile App
 * 
 * University-specific state management matching web frontend
 * Uses mock data for demonstration purposes (no backend integration)
 * 
 * @module store/universityStore
 */

import { create } from 'zustand'
import type {
  Admission,
  AuditItem,
  AuditStatus,
  ChangeLogItem,
  NotificationItem,
} from '../data/universityData'
import {
  sharedAdmissions,
  sharedChangeLogs,
  sharedNotifications,
} from '../data/universityData'

interface UniversityStoreState {
  // State
  admissions: Admission[]
  changeLogs: ChangeLogItem[]
  notifications: NotificationItem[]
  audits: AuditItem[]
  stats: {
    total_admissions: number
    pending_verification: number
    verified_admissions: number
    recent_changes: number
    unread_notifications: number
  } | null
  loading: boolean
  error: string | null

  // Actions
  fetchDashboardData: (options?: { showError?: (msg: string) => void }) => Promise<void>
  createOrUpdateAdmission: (
    admission: Admission,
    options?: { 
      diff?: ChangeLogItem['diff']
      modifiedBy?: string
      showError?: (msg: string) => void
      showSuccess?: (msg: string) => void
    }
  ) => Promise<{ success: boolean; data?: Admission; error?: string }>
  deleteAdmission: (id: string) => Promise<{ success: boolean; error?: string }>
  getAdmissionById: (id: string) => Admission | undefined
  markNotificationRead: (id: number) => void
  markAllNotificationsRead: () => void
  refreshNotifications: () => void
  appendChangeLog: (entry: Omit<ChangeLogItem, 'id'>) => void
  reset: () => void
}

const initialState = {
  admissions: [],
  changeLogs: [],
  notifications: [],
  audits: [],
  stats: null,
  loading: false,
  error: null,
}

// Clone data to avoid mutations
const cloneAdmissions = () => sharedAdmissions.map(a => ({ ...a }))
const cloneChangeLogs = () => sharedChangeLogs.map(c => ({
  ...c,
  diff: c.diff.map(d => ({ ...d })),
}))
const cloneNotifications = () => sharedNotifications.map(n => ({ ...n }))

// Derive audits from admissions
const deriveAudits = (admissions: Admission[]): AuditItem[] =>
  admissions
    .filter(a => ['Pending Audit', 'Verified', 'Rejected', 'Disputed'].includes(a.status))
    .map((a, index) => ({
      id: index + 1,
      title: a.title,
      status: (a.status === 'Pending Audit' ? 'Pending' : a.status) as AuditStatus,
      verifiedBy: a.verifiedBy,
      lastAction: a.lastAction || '',
      remarks: a.remarks || '',
    }))

// Calculate stats
const deriveStats = (
  admissions: Admission[],
  changeLogs: ChangeLogItem[],
  notifications: NotificationItem[]
) => {
  const pending = admissions.filter(a => a.status === 'Pending Audit').length
  const verified = admissions.filter(a => a.status === 'Verified').length
  const unread = notifications.filter(n => !n.read).length
  
  return {
    total_admissions: admissions.length,
    pending_verification: pending,
    verified_admissions: verified,
    recent_changes: changeLogs.length,
    unread_notifications: unread,
  }
}

export const useUniversityStore = create<UniversityStoreState>((set, get) => ({
  // Initial State
  ...initialState,
  
  // Fetch Dashboard Data
  fetchDashboardData: async (options) => {
    set({ loading: true, error: null })
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const admissions = cloneAdmissions()
      const changeLogs = cloneChangeLogs()
      const notifications = cloneNotifications()
      const audits = deriveAudits(admissions)
      const stats = deriveStats(admissions, changeLogs, notifications)
      
      set({
        admissions,
        changeLogs,
        notifications,
        audits,
        stats,
        loading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      const errorMsg = err.message || 'Failed to fetch dashboard data'
      
      set({ 
        error: errorMsg,
        loading: false,
      })
      
      if (options?.showError) {
        options.showError('Failed to load dashboard data. Please try again.')
      }
    }
  },
  
  // Create or Update Admission
  createOrUpdateAdmission: async (admission, options) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { admissions } = get()
      const existingIndex = admissions.findIndex(a => a.id === admission.id)
      
      let updatedAdmissions: Admission[]
      
      if (existingIndex >= 0) {
        // Update existing
        updatedAdmissions = admissions.map(a =>
          a.id === admission.id ? { ...a, ...admission } : a
        )
        
        // Add to change log if provided
        if (options?.diff && options?.modifiedBy) {
          const newChangeLog: Omit<ChangeLogItem, 'id'> = {
            admission: admission.title,
            modifiedBy: options.modifiedBy,
            date: new Date().toISOString(),
            diff: options.diff,
          }
          get().appendChangeLog(newChangeLog)
        }
      } else {
        // Create new
        updatedAdmissions = [...admissions, admission]
      }
      
      // Update admissions
      set({ admissions: updatedAdmissions })
      
      // Recalculate audits and stats
      const audits = deriveAudits(updatedAdmissions)
      const stats = deriveStats(updatedAdmissions, get().changeLogs, get().notifications)
      
      set({ audits, stats })
      
      if (options?.showSuccess) {
        options.showSuccess(existingIndex >= 0 ? 'Admission updated successfully' : 'Admission created successfully')
      }
      
      return { success: true, data: admission }
    } catch (err: any) {
      console.error('Failed to create/update admission:', err)
      const errorMsg = err.message || 'Failed to save admission'
      
      if (options?.showError) {
        options.showError(errorMsg)
      }
      
      return { success: false, error: errorMsg }
    }
  },
  
  // Delete Admission
  deleteAdmission: async (id) => {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const { admissions } = get()
      const updatedAdmissions = admissions.filter(a => a.id !== id)
      
      set({ admissions: updatedAdmissions })
      
      // Recalculate audits and stats
      const audits = deriveAudits(updatedAdmissions)
      const stats = deriveStats(updatedAdmissions, get().changeLogs, get().notifications)
      
      set({ audits, stats })
      
      return { success: true }
    } catch (err: any) {
      console.error('Failed to delete admission:', err)
      return { success: false, error: err.message || 'Failed to delete admission' }
    }
  },
  
  // Get Admission By ID
  getAdmissionById: (id) => {
    return get().admissions.find(a => a.id === id)
  },
  
  // Mark Notification Read
  markNotificationRead: (id) => {
    const { notifications } = get()
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    
    set({ notifications: updatedNotifications })
    
    // Update stats
    const stats = deriveStats(get().admissions, get().changeLogs, updatedNotifications)
    set({ stats })
  },
  
  // Mark All Notifications Read
  markAllNotificationsRead: () => {
    const { notifications } = get()
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    
    set({ notifications: updatedNotifications })
    
    // Update stats
    const stats = deriveStats(get().admissions, get().changeLogs, updatedNotifications)
    set({ stats })
  },
  
  // Refresh Notifications
  refreshNotifications: () => {
    const notifications = cloneNotifications()
    set({ notifications })
    
    // Update stats
    const stats = deriveStats(get().admissions, get().changeLogs, notifications)
    set({ stats })
  },
  
  // Append Change Log
  appendChangeLog: (entry) => {
    const { changeLogs } = get()
    const newId = changeLogs.length > 0 
      ? Math.max(...changeLogs.map(c => c.id)) + 1 
      : 1
    
    const newChangeLog: ChangeLogItem = {
      ...entry,
      id: newId,
    }
    
    set({ changeLogs: [...changeLogs, newChangeLog] })
    
    // Update stats
    const stats = deriveStats(get().admissions, [...changeLogs, newChangeLog], get().notifications)
    set({ stats })
  },
  
  // Reset
  reset: () => {
    set(initialState)
  },
}))
