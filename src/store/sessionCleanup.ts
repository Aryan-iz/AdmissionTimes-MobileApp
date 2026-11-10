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
  // Lazy require breaks the authStore <-> studentStore import cycle (see top of file).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require('./authStore') as typeof import('./authStore')
  return useAuthStore.getState().user?.id || null
}
