import type { StudentAdmission } from '../data/studentData'

export const RECOMMENDATION_MIN_SCORE = 50
export const RECOMMENDATION_COUNT_LIMIT = 5
export const RECOMMENDATION_RENDER_LIMIT = 5

export const filterEligibleRecommendations = (admissions: StudentAdmission[]): StudentAdmission[] =>
  admissions
    .filter((admission) => admission.programStatus !== 'Closed' && admission.daysRemaining >= 0)
    .filter((admission) => (admission.matchNumeric || 0) >= RECOMMENDATION_MIN_SCORE)
    .sort((a, b) => (b.matchNumeric || 0) - (a.matchNumeric || 0))

export const limitRecommendations = (admissions: StudentAdmission[]): StudentAdmission[] =>
  filterEligibleRecommendations(admissions).slice(0, RECOMMENDATION_COUNT_LIMIT)

export const resolveRecommendationCountStat = (
  admissions: StudentAdmission[],
  backendValue?: unknown
): number => {
  const client = limitRecommendations(admissions).length
  const backend = Number(backendValue)
  if (!Number.isFinite(backend) || backend <= 0) {
    return client
  }
  return Math.min(RECOMMENDATION_COUNT_LIMIT, Math.max(backend, client))
}
