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
  officialUrl?: string
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

export const sharedAdmissions: StudentAdmission[] = [
  // Active Admissions (currently open)
  {
    id: '1',
    university: 'FAST University',
    program: 'BS Computer Science',
    degree: 'Bachelor of Science',
    degreeType: 'BS',
    startDate: '2026-01-01',
    deadline: '2026-07-30',
    deadlineDisplay: 'July 30, 2026',
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
    isNew: true,
  },
  {
    id: '2',
    university: 'NUST',
    program: 'MS Data Science',
    degree: 'Master of Science',
    degreeType: 'MS',
    startDate: '2026-01-01',
    deadline: '2026-02-28',
    deadlineDisplay: 'February 28, 2026',
    fee: 'PKR 120,000',
    feeNumeric: 120000,
    location: 'Islamabad, Pakistan',
    city: 'Islamabad',
    status: 'Verified',
    programStatus: 'Closing Soon',
    updated: 'Updated 1 day ago',
    daysRemaining: 14,
    match: '88%',
    matchNumeric: 88,
    logoBg: '#3B82F6',
    aiSummary: 'A rigorous graduate program focusing on advanced data analytics and machine learning.',
    officialUrl: '/program/2',
    alertEnabled: true,
    saved: true,
    isNew: true,
  },
  {
    id: '3',
    university: 'LUMS',
    program: 'MBA',
    degree: 'Master of Business Administration',
    degreeType: 'MBA',
    startDate: '2026-02-01',
    deadline: '2026-04-15',
    deadlineDisplay: 'April 15, 2026',
    fee: 'PKR 250,000',
    feeNumeric: 250000,
    location: 'Lahore, Pakistan',
    city: 'Lahore',
    status: 'Verified',
    programStatus: 'Open',
    updated: 'Updated 3 days ago',
    daysRemaining: 60,
    match: '82%',
    matchNumeric: 82,
    logoBg: '#8B5CF6',
    aiSummary: 'Premier business education with focus on entrepreneurship and leadership.',
    officialUrl: '/program/3',
    alertEnabled: false,
    saved: false,
  },
  {
    id: '4',
    university: 'IBA Karachi',
    program: 'BBA',
    degree: 'Bachelor of Business Administration',
    degreeType: 'BBA',
    startDate: '2026-01-15',
    deadline: '2026-03-20',
    deadlineDisplay: 'March 20, 2026',
    fee: 'PKR 95,000',
    feeNumeric: 95000,
    location: 'Karachi, Pakistan',
    city: 'Karachi',
    status: 'Verified',
    programStatus: 'Open',
    updated: 'Updated 1 week ago',
    daysRemaining: 34,
    match: '78%',
    matchNumeric: 78,
    logoBg: '#EF4444',
    aiSummary: 'Comprehensive business foundation with practical industry exposure.',
    officialUrl: '/program/4',
    alertEnabled: false,
    saved: true,
    isNew: false,
  },
  {
    id: '5',
    university: 'UET Lahore',
    program: 'BS Electrical Engineering',
    degree: 'Bachelor of Science',
    degreeType: 'BS',
    startDate: '2026-02-01',
    deadline: '2026-03-01',
    deadlineDisplay: 'March 1, 2026',
    fee: 'PKR 68,000',
    feeNumeric: 68000,
    location: 'Lahore, Pakistan',
    city: 'Lahore',
    status: 'Verified',
    programStatus: 'Closing Soon',
    updated: 'Updated 2 days ago',
    daysRemaining: 15,
    match: '85%',
    matchNumeric: 85,
    logoBg: '#10B981',
    aiSummary: 'Traditional engineering program with modern laboratory facilities.',
    officialUrl: '/program/5',
    alertEnabled: true,
    saved: false,
  },
  // Closed Admissions (past deadline)
  {
    id: '6',
    university: 'COMSATS',
    program: 'BS Software Engineering',
    degree: 'Bachelor of Science',
    degreeType: 'BS',
    startDate: '2025-10-01',
    deadline: '2026-01-10',
    deadlineDisplay: 'January 10, 2026',
    fee: 'PKR 72,000',
    feeNumeric: 72000,
    location: 'Islamabad, Pakistan',
    city: 'Islamabad',
    status: 'Verified',
    programStatus: 'Closed',
    updated: 'Closed',
    daysRemaining: -34,
    match: '90%',
    matchNumeric: 90,
    logoBg: '#6B7280',
    aiSummary: 'Software engineering with focus on modern development practices.',
    officialUrl: '/program/6',
    alertEnabled: false,
    saved: false,
  },
  {
    id: '7',
    university: 'Air University',
    program: 'MS Cyber Security',
    degree: 'Master of Science',
    degreeType: 'MS',
    startDate: '2025-11-01',
    deadline: '2025-12-31',
    deadlineDisplay: 'December 31, 2025',
    fee: 'PKR 110,000',
    feeNumeric: 110000,
    location: 'Islamabad, Pakistan',
    city: 'Islamabad',
    status: 'Verified',
    programStatus: 'Closed',
    updated: 'Closed',
    daysRemaining: -45,
    logoBg: '#F59E0B',
    aiSummary: 'Advanced cybersecurity program with hands-on labs.',
    officialUrl: '/program/7',
    alertEnabled: false,
    saved: false,
  },
  // Future Admissions (not yet started)
  {
    id: '8',
    university: 'Punjab University',
    program: 'BS Psychology',
    degree: 'Bachelor of Science',
    degreeType: 'BS',
    startDate: '2026-04-01',
    deadline: '2026-08-30',
    deadlineDisplay: 'August 30, 2026',
    fee: 'PKR 55,000',
    feeNumeric: 55000,
    location: 'Lahore, Pakistan',
    city: 'Lahore',
    status: 'Pending',
    programStatus: 'Open',
    updated: 'Coming Soon',
    daysRemaining: 197,
    match: '75%',
    matchNumeric: 75,
    logoBg: '#EC4899',
    aiSummary: 'Comprehensive psychology program with clinical practice opportunities.',
    officialUrl: '/program/8',
    alertEnabled: false,
    saved: false,
    isNew: true,
  },
  {
    id: '9',
    university: 'Karachi University',
    program: 'MS Economics',
    degree: 'Master of Science',
    degreeType: 'MS',
    startDate: '2026-05-01',
    deadline: '2026-09-15',
    deadlineDisplay: 'September 15, 2026',
    fee: 'PKR 85,000',
    feeNumeric: 85000,
    location: 'Karachi, Pakistan',
    city: 'Karachi',
    status: 'Pending',
    programStatus: 'Open',
    updated: 'Opening Soon',
    daysRemaining: 213,
    match: '80%',
    matchNumeric: 80,
    logoBg: '#06B6D4',
    aiSummary: 'Economic theory and policy analysis with research focus.',
    officialUrl: '/program/9',
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

export const isAdmissionActive = (admission: StudentAdmission): boolean => {
  const today = new Date()
  const startDate = new Date(admission.startDate)
  const endDate = new Date(admission.deadline)
  return today >= startDate && today <= endDate
}

export const getActiveAdmissions = (): StudentAdmission[] => {
  return sharedAdmissions.filter(isAdmissionActive)
}

export const getUpcomingDeadlines = (): StudentAdmission[] => {
  return sharedAdmissions
    .filter(a => {
      const daysRemaining = calculateDaysRemaining(a.deadline)
      return daysRemaining >= 0 && isAdmissionActive(a)
    })
    .sort((a, b) => calculateDaysRemaining(a.deadline) - calculateDaysRemaining(b.deadline))
}

export const getNewAdmissions = (): StudentAdmission[] => {
  return sharedAdmissions.filter(a => a.isNew === true)
}

