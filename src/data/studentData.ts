// Mobile Student Data - TypeScript

export type AdmissionStatus = 'Verified' | 'Pending' | 'Updated' | 'Closed'
export type ProgramStatus = 'Open' | 'Closing Soon' | 'Closed'
export type NotificationType = 'alert' | 'system' | 'admission'

export interface StudentAdmission {
  id: string
  university: string
  program: string
  degree: string
  degreeType: 'BS' | 'MS' | 'PhD' | 'MBA' | 'BBA' | 'MD' | 'MPhil'
  startDate: string // Admission start date
  deadline: string // Admission end/deadline date
  deadlineDisplay: string
  fee: string
  feeNumeric: number
  location: string
  city: string
  status: AdmissionStatus
  programStatus: ProgramStatus
  updated: string
  daysRemaining: number
  match?: string
  matchNumeric?: number
  logoBg: string
  aiSummary?: string
  eligibility?: string
  officialUrl?: string
  universityWebsiteUrl?: string
  admissionPortalLink?: string
  alertEnabled?: boolean
  saved?: boolean
  isNew?: boolean // For new admission slider
}

export interface StudentNotification {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  timeAgo: string
  read: boolean
  icon: string
  iconColor: string
  admissionId?: string
}

export const getStatusColor = (status: AdmissionStatus | ProgramStatus) => {
  switch (status) {
    case 'Verified':
    case 'Open':
      return { bg: '#D1FAE5', text: '#10B981' }
    case 'Pending':
    case 'Closing Soon':
      return { bg: '#FEF3C7', text: '#F59E0B' }
    case 'Updated':
      return { bg: '#DBEAFE', text: '#3B82F6' }
    case 'Closed':
      return { bg: '#FEE2E2', text: '#EF4444' }
    default:
      return { bg: '#F3F4F6', text: '#6B7280' }
  }
}

const DEADLINE_MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

const buildDeadlineDate = (year: number, monthIndex: number, day: number): Date => {
  return new Date(year, monthIndex, day, 12, 0, 0, 0)
}

const normalizeDeadlineDate = (deadline?: string | null): Date | null => {
  if (!deadline) return null

  const trimmed = deadline.trim()
  if (!trimmed) return null

  const normalized = trimmed.replace(/\s+/g, ' ')

  const isoDateOnly = normalized.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})(?:[T\s].*)?$/)
  if (isoDateOnly) {
    return buildDeadlineDate(
      Number(isoDateOnly[1]),
      Number(isoDateOnly[2]) - 1,
      Number(isoDateOnly[3])
    )
  }

  const dayMonthYear = normalized.match(/^(\d{1,2})\s+([A-Za-z]+)\s*,?\s+(\d{4})$/)
  if (dayMonthYear) {
    const monthKey = dayMonthYear[2].toLowerCase().replace(/\.$/, '')
    const monthIndex = DEADLINE_MONTHS[monthKey]

    if (monthIndex !== undefined) {
      return buildDeadlineDate(
        Number(dayMonthYear[3]),
        monthIndex,
        Number(dayMonthYear[1])
      )
    }
  }

  const monthDayYear = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})\s*,?\s+(\d{4})$/)
  if (monthDayYear) {
    const monthKey = monthDayYear[1].toLowerCase().replace(/\.$/, '')
    const monthIndex = DEADLINE_MONTHS[monthKey]

    if (monthIndex !== undefined) {
      return buildDeadlineDate(
        Number(monthDayYear[3]),
        monthIndex,
        Number(monthDayYear[2])
      )
    }
  }

  const slashDate = normalized.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (slashDate) {
    return buildDeadlineDate(
      Number(slashDate[3]),
      Number(slashDate[2]) - 1,
      Number(slashDate[1])
    )
  }

  const directParsed = new Date(normalized)
  if (!Number.isNaN(directParsed.getTime())) {
    return new Date(
      directParsed.getFullYear(),
      directParsed.getMonth(),
      directParsed.getDate(),
      12,
      0,
      0,
      0
    )
  }

  return null
}

export const formatDeadlineDisplay = (deadline?: string | null): string => {
  const rawDeadline = typeof deadline === 'string' ? deadline.trim() : ''
  const parsed = normalizeDeadlineDate(rawDeadline)

  if (!parsed) {
    return rawDeadline || 'No deadline'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed)
}

const normalizeDateTimeValue = (value?: string | null): Date | null => {
  if (!value) return null

  const raw = value.trim()
  if (!raw) return null

  const normalizedWhitespace = raw.replace(/\s+/g, ' ')
  let candidate = normalizedWhitespace

  // Backend sometimes sends timestamps like "2026-08-15 23:59:59+00"; convert to ISO-like form.
  if (/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2})$/.test(candidate)) {
    candidate = candidate.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  } else if (/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}:\d{2}(?:\.\d+)?$/.test(candidate)) {
    candidate = candidate.replace(' ', 'T')
  }

  const parsed = new Date(candidate)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return normalizeDeadlineDate(raw)
}

export const formatDateTimeDisplay = (value?: string | null): string => {
  const raw = typeof value === 'string' ? value.trim() : ''
  const parsed = normalizeDateTimeValue(raw)

  if (!parsed) {
    return raw || 'Not available'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

const startOfDay = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const calculateDaysRemaining = (deadline: string): number => {
  if (!deadline || !deadline.trim()) {
    return -1
  }

  const deadlineDate = normalizeDeadlineDate(deadline)
  if (!deadlineDate) {
    return -1
  }

  if (Number.isNaN(deadlineDate.getTime())) {
    return -1
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isAdmissionActive = (admission: StudentAdmission): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = normalizeDeadlineDate(admission.deadline)

  if (!endDate) {
    return admission.programStatus !== 'Closed'
  }

  endDate.setHours(23, 59, 59, 999)

  if (!admission.startDate) {
    return today <= endDate && admission.programStatus !== 'Closed'
  }

  const startDate = new Date(admission.startDate)
  if (Number.isNaN(startDate.getTime())) {
    return today <= endDate && admission.programStatus !== 'Closed'
  }

  startDate.setHours(0, 0, 0, 0)

  return today >= startDate && today <= endDate && admission.programStatus !== 'Closed'
}

export const isAdmissionActiveByPolicy = (admission: StudentAdmission): boolean => {
  const statusEligible = admission.status === 'Verified' || admission.status === 'Pending'
  const isOpenByDeadline = admission.daysRemaining >= 0 && admission.programStatus !== 'Closed'
  return statusEligible && isOpenByDeadline
}

