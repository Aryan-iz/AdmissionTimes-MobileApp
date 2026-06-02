/**
 * Breaks authStore <-> studentStore require cycle.
 * authStore calls resetStudentSession; studentStore registers its reset at load time.
 */

let resetStudentStore: (() => void) | null = null

export const registerStudentStoreReset = (reset: () => void): void => {
  resetStudentStore = reset
}

export const resetStudentSession = (): void => {
  resetStudentStore?.()
}

export const getAuthUserId = (): string | null => {
  const { useAuthStore } = require('./authStore') as typeof import('./authStore')
  return useAuthStore.getState().user?.id || null
}
