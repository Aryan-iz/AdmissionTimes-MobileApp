/**
 * Student-facing admission model.
 *
 * `toStudentAdmission` maps the API's admission contract 1:1. The backend owns
 * every derived value (status, fee text, degree, location, links), so web and
 * mobile show the same thing and nothing is guessed here. Fields that are
 * unknown stay null and screens say "Not specified" instead of inventing data.
 */

import type { Admission } from '../services/types'
import { daysUntil, formatDate } from './dates'

export type ProgramStatus = 'Open' | 'Closing Soon' | 'Closed'

/** university = entered by the university's representative; scraper = public announcement. */
export type DataSource = 'university' | 'scraper'

export interface StudentAdmission {
  id: string
  universityId: string | null
  university: string
  program: string
  description: string | null
  degree: string | null
  programType: string | null
  fieldOfStudy: string | null
  duration: string | null
  deliveryMode: string | null

  deadlineIso: string | null
  hasDeadline: boolean
  deadlineDisplay: string
  daysRemaining: number
  programStatus: ProgramStatus

  fee: string
  feeAmount: number | null
  location: string | null
  city: string | null
  eligibility: string | null

  applyUrl: string | null
  websiteUrl: string | null
  portalUrl: string | null
  announcementUrl: string | null
  /** Programs listed by a multi-program announcement (scraped). */
  programsOffered: string[]

  source: DataSource
  updatedAt: string
  createdAt: string

  matchScore: number | null
  matchReason: string | null
  matchLabel: string | null

  saved: boolean
  alertEnabled: boolean
  watchlistId?: string
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null

const deriveStatus = (days: number, hasDeadline: boolean): ProgramStatus => {
  if (!hasDeadline) return 'Open'
  if (days < 0) return 'Closed'
  return days <= 7 ? 'Closing Soon' : 'Open'
}

export const toStudentAdmission = (admission: Admission): StudentAdmission => {
  const deadlineIso = text(admission.deadline_iso) ?? text(admission.deadline)
  const hasDeadline = admission.has_deadline ?? deadlineIso !== null
  // Recomputed from the deadline (same rule as the backend) so the count stays
  // right if the app is left open past midnight.
  const daysRemaining = daysUntil(deadlineIso)
  const degree = text(admission.degree_label)

  return {
    id: String(admission.id),
    universityId: admission.university_id ? String(admission.university_id) : null,
    university: text(admission.university_name) ?? 'Unknown university',
    program: admission.title,
    description: text(admission.description),
    degree: degree && degree !== 'Not specified' ? degree : null,
    programType: text(admission.program_type),
    fieldOfStudy: text(admission.field_of_study),
    duration: text(admission.duration),
    deliveryMode: text(admission.delivery_mode),

    deadlineIso,
    hasDeadline,
    deadlineDisplay: formatDate(deadlineIso),
    daysRemaining,
    programStatus: deriveStatus(daysRemaining, hasDeadline),

    fee: text(admission.fee_display) ?? 'Not specified',
    feeAmount: typeof admission.fee_amount === 'number' ? admission.fee_amount : null,
    location: text(admission.location_display) ?? text(admission.location) ?? text(admission.university_city),
    city: text(admission.university_city),
    eligibility: text(admission.eligibility_text),

    applyUrl: text(admission.primary_apply_url),
    websiteUrl: text(admission.university_website_url),
    portalUrl: text(admission.admission_portal_url),
    announcementUrl: text(admission.source_announcement_url),
    programsOffered: Array.isArray(admission.programs_offered) ? admission.programs_offered : [],

    source: admission.source ?? (String(admission.data_origin || '').toLowerCase() === 'scraper' ? 'scraper' : 'university'),
    updatedAt: admission.updated_at,
    createdAt: admission.created_at,

    matchScore: typeof admission.match_score === 'number' ? admission.match_score : null,
    matchReason: text(admission.match_reason),
    matchLabel: text(admission.match_label),

    saved: admission.saved === true,
    alertEnabled: admission.alert_enabled === true,
  }
}

export const isOpen = (admission: Pick<StudentAdmission, 'programStatus'>): boolean => admission.programStatus !== 'Closed'

/** Open programs first (soonest deadline first), then closed ones (most recent first). */
export const sortByDeadline = (admissions: StudentAdmission[]): StudentAdmission[] => {
  const key = (a: StudentAdmission) => (a.deadlineIso ? new Date(a.deadlineIso).getTime() : Number.MAX_SAFE_INTEGER)
  const open = admissions.filter(isOpen).sort((a, b) => key(a) - key(b))
  const closed = admissions.filter((a) => !isOpen(a)).sort((a, b) => key(b) - key(a))
  return [...open, ...closed]
}

export const SOURCE_LABEL: Record<DataSource, string> = {
  university: 'From university',
  scraper: 'Public listing',
}

export const SOURCE_HINT: Record<DataSource, string> = {
  university: 'Entered and maintained by the university, then reviewed by AdmissionTimes.',
  scraper: "Collected automatically from the university's public announcement and reviewed by AdmissionTimes. Check the official announcement for full details.",
}
