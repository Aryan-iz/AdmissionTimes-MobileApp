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
  deadline: string
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
  officialUrl?: string
  alertEnabled?: boolean
  saved?: boolean
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

export const sharedAdmissions: StudentAdmission[] = [
  {
    id: '1',
    university: 'FAST University',
    program: 'BS Computer Science',
    degree: 'Bachelor of Science',
    degreeType: 'BS',
    deadline: '2025-07-30',
    deadlineDisplay: 'July 30, 2025',
    fee: 'PKR 75,000',
    feeNumeric: 75000,
    location: 'Islamabad, Pakistan',
    city: 'Islamabad',
    status: 'Verified',
    programStatus: 'Open',
    updated: 'Updated 2 days ago',
    daysRemaining: 180,
    match: '95%',
    matchNumeric: 95,
    logoBg: '#1F2937',
    aiSummary: 'This program offers a comprehensive curriculum in computer science fundamentals with strong industry connections.',
    officialUrl: '/program/1',
    alertEnabled: true,
    saved: true,
  },
  {
    id: '2',
    university: 'NUST',
    program: 'MS Data Science',
    degree: 'Master of Science',
    degreeType: 'MS',
    deadline: '2025-01-20',
    deadlineDisplay: 'January 20, 2025',
    fee: 'PKR 120,000',
    feeNumeric: 120000,
    location: 'Islamabad, Pakistan',
    city: 'Islamabad',
    status: 'Pending',
    programStatus: 'Closing Soon',
    updated: 'Updated 5 days ago',
    daysRemaining: 3,
    match: '88%',
    matchNumeric: 88,
    logoBg: '#3B82F6',
    aiSummary: 'A rigorous graduate program focusing on advanced data analytics and machine learning.',
    officialUrl: '/program/2',
    alertEnabled: false,
    saved: true,
  },
]

export const sharedNotifications: StudentNotification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Application Deadline Approaching',
    description: 'Your application for NUST MS Data Science is due in 3 days.',
    time: '2025-01-17T10:00:00Z',
    timeAgo: '2 hours ago',
    read: false,
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: '#FACC15',
    admissionId: '2',
  },
]

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

export const getAdmissionById = (id: string): StudentAdmission | undefined => {
  return sharedAdmissions.find(admission => admission.id === id)
}

export const getSavedAdmissions = (): StudentAdmission[] => {
  return sharedAdmissions.filter(a => a.saved)
}

export const calculateDaysRemaining = (deadline: string): number => {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

