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

export const calculateDaysRemaining = (deadline: string): number => {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isAdmissionActive = (admission: StudentAdmission): boolean => {
  const today = new Date()
  const endDate = new Date(admission.deadline)

  if (Number.isNaN(endDate.getTime())) {
    return admission.programStatus !== 'Closed'
  }

  if (!admission.startDate) {
    return today <= endDate && admission.programStatus !== 'Closed'
  }

  const startDate = new Date(admission.startDate)
  if (Number.isNaN(startDate.getTime())) {
    return today <= endDate && admission.programStatus !== 'Closed'
  }

  return today >= startDate && today <= endDate && admission.programStatus !== 'Closed'
}

