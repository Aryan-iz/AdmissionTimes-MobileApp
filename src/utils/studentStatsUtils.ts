import type { StudentAdmission } from '../data/studentData'

/** Dashboard "Upcoming Deadlines" — programs closing within this many days (matches web). */
export const UPCOMING_DEADLINE_STAT_WINDOW_DAYS = 7

/** Sidebar preview uses the same window as the stat card. */
export const UPCOMING_DEADLINE_SIDEBAR_WINDOW_DAYS = UPCOMING_DEADLINE_STAT_WINDOW_DAYS

export const URGENT_DEADLINE_WINDOW_DAYS = 3

export const parseDashboardStat = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const isClosingSoonAdmission = (admission: StudentAdmission, windowDays: number): boolean =>
  admission.programStatus !== 'Closed' &&
  admission.daysRemaining >= 0 &&
  admission.daysRemaining <= windowDays

/** Programs closing within N days (default: 7). */
export const countUpcomingDeadlinesInWindow = (
  admissions: StudentAdmission[],
  windowDays: number = UPCOMING_DEADLINE_STAT_WINDOW_DAYS
): number => admissions.filter((admission) => isClosingSoonAdmission(admission, windowDays)).length

/** Upcoming stat: catalog only, closing within 7 days (not all open programs). */
export const resolveUpcomingDeadlineStat = (
  admissions: StudentAdmission[],
  _backendValue?: unknown
): number => countUpcomingDeadlinesInWindow(admissions, UPCOMING_DEADLINE_STAT_WINDOW_DAYS)

export const countUrgentDeadlines = (admissions: StudentAdmission[]): number =>
  admissions.filter((admission) => isClosingSoonAdmission(admission, URGENT_DEADLINE_WINDOW_DAYS)).length

export const resolveUrgentDeadlineStat = (
  admissions: StudentAdmission[],
  backendValue?: unknown
): number => {
  const client = countUrgentDeadlines(admissions)
  const backend = parseDashboardStat(backendValue)
  return backend > 0 ? Math.max(backend, client) : client
}
