import type { StudentAdmission } from '../data/studentData'

export type WatchlistEntry = {
  watchlistId: string
  alertOptIn: boolean
}

export type WatchlistIndex = Record<string, WatchlistEntry>

export const getBackendAdmissionId = (admission: Pick<StudentAdmission, 'id' | 'sourceAdmissionId'>): string =>
  admission.sourceAdmissionId || admission.id.split('::program::')[0] || admission.id

export const getSavedGroupKey = (admission: Pick<StudentAdmission, 'id' | 'sourceAdmissionId'>): string =>
  getBackendAdmissionId(admission)

export const resolveWatchlistEntry = (
  admission: Pick<StudentAdmission, 'id' | 'sourceAdmissionId'>,
  watchlistIndex: WatchlistIndex
): WatchlistEntry | undefined =>
  watchlistIndex[admission.id] ||
  (admission.sourceAdmissionId ? watchlistIndex[admission.sourceAdmissionId] : undefined) ||
  watchlistIndex[getBackendAdmissionId(admission)]

export const isAdmissionSaved = (
  admission: StudentAdmission,
  watchlistIndex?: WatchlistIndex
): boolean => Boolean(admission.saved || (watchlistIndex && resolveWatchlistEntry(admission, watchlistIndex)))

export const countUniqueSavedAdmissions = (admissions: StudentAdmission[]): number => {
  const keys = new Set<string>()
  admissions.forEach((admission) => {
    if (admission.saved) {
      keys.add(getSavedGroupKey(admission))
    }
  })
  return keys.size
}

export const applyWatchlistState = (
  admissions: StudentAdmission[],
  watchlistIndex: WatchlistIndex
): StudentAdmission[] =>
  admissions.map((admission) => {
    const entry = resolveWatchlistEntry(admission, watchlistIndex)
    return {
      ...admission,
      saved: Boolean(entry),
      alertEnabled: entry?.alertOptIn ?? false,
      watchlistId: entry?.watchlistId,
    }
  })

export const buildWatchlistIndex = (
  watchlists: Array<{ id: string; admission_id: string; alert_opt_in?: boolean | null }>
): WatchlistIndex =>
  watchlists.reduce<WatchlistIndex>((acc, item) => {
    acc[item.admission_id] = {
      watchlistId: item.id,
      alertOptIn: item.alert_opt_in === true,
    }
    return acc
  }, {})

export const setWatchlistIndexEntry = (
  index: WatchlistIndex,
  displayId: string,
  backendId: string,
  entry: WatchlistEntry
): WatchlistIndex => ({
  ...index,
  [displayId]: entry,
  [backendId]: entry,
})

export const removeWatchlistIndexEntry = (
  index: WatchlistIndex,
  displayId: string,
  backendId: string
): WatchlistIndex => {
  const next = { ...index }
  delete next[displayId]
  delete next[backendId]
  return next
}

/** Deduplicate saved rows (one card per backend admission / scraper parent). */
export const dedupeSavedAdmissions = (admissions: StudentAdmission[]): StudentAdmission[] => {
  const grouped = new Map<string, StudentAdmission>()
  admissions.forEach((admission) => {
    if (!admission.saved) return
    const key = getSavedGroupKey(admission)
    if (!grouped.has(key)) {
      grouped.set(key, admission)
    }
  })
  return Array.from(grouped.values())
}
