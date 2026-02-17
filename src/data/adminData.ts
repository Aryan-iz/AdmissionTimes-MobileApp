// Mobile Admin Data - TypeScript

export interface PendingVerification {
  id: string
  admissionTitle: string
  university: string
  submittedBy: string
  submittedOn: string
  status: "Pending Audit"
}

export interface AdminAction {
  id: number
  admission: string
  action: "Verified" | "Rejected" | "Disputed"
  admin: string
  timestamp: string
  remarks: string
}

export type NotificationType = "verification_update" | "university_upload" | "system_alert" | "scraper_alert"

export interface AdminNotification {
  id: number
  title: string
  message: string
  type: NotificationType
  timestamp: string
  timeAgo: string
  unread: boolean
  admissionId?: string
  university?: string
}

export interface ScraperActivity {
  id: number
  university: string
  lastRun: string
  status: "Success" | "No Change" | "Error"
  changesDetected: number
}

export type ScraperJobStatus = "Success" | "Failed" | "No Changes" | "Changes Detected"

export interface ScraperJob {
  id: string
  jobId: string
  university: string
  universityId: string
  startedAt: string
  finishedAt: string
  status: ScraperJobStatus
  sourceUrl: string
  duration: string
  schedulerTriggered: boolean
  logs?: string
  errorLog?: string
  changesDetected?: Array<{
    admissionId: string
    admissionTitle: string
    fields: string[]
  }>
}

export interface SystemMetrics {
  totalUsers: number
  totalAdmissions: number
  totalAlertsSent: number
  aiSummary?: string
}

export type VerificationStatus = "Pending" | "Verified" | "Rejected" | "Disputed"

export interface VerificationItem {
  id: string
  admissionTitle: string
  university: string
  submittedBy: string
  submittedOn: string
  status: VerificationStatus
}

export type ChangeType = "Manual Edit" | "Scraper Update" | "Admin Edit"

export interface AdminChangeLog {
  id: number
  admissionId: string
  admissionTitle: string
  modifiedBy: string
  modifiedByUserId: string
  changeType: ChangeType
  timestamp: string
  summary: string
  diff: Array<{
    field: string
    oldValue: string
    newValue: string
  }>
  reasonForChange?: string
}

export interface AdmissionAnalytics {
  statusBreakdown: {
    status: VerificationStatus
    count: number
    percentage: number
  }[]
  universityDistribution: {
    university: string
    count: number
  }[]
  monthlyTrend: {
    month: string
    count: number
  }[]
  degreeTypeDistribution: {
    degreeType: string
    count: number
  }[]
}

export const pendingVerifications: PendingVerification[] = [
  {
    id: "1",
    admissionTitle: "BSCS Fall 2025",
    university: "FAST University",
    submittedBy: "Rep_01",
    submittedOn: "2025-02-07",
    status: "Pending Audit",
  },
]

export const recentAdminActions: AdminAction[] = [
  {
    id: 1,
    admission: "BSCS Fall 2025",
    action: "Verified",
    admin: "Admin",
    timestamp: "2025-02-08 10:30",
    remarks: "All documents verified.",
  },
]

export const adminNotifications: AdminNotification[] = [
  {
    id: 1,
    title: "Admission Verified",
    message: "Admission 'BSCS Fall 2025' from FAST University has been verified.",
    type: "verification_update",
    timestamp: "2025-02-08T10:30:00Z",
    timeAgo: "2 hours ago",
    unread: true,
    admissionId: "1",
    university: "FAST University",
  },
]

export const scraperActivities: ScraperActivity[] = [
  {
    id: 1,
    university: "FAST University",
    lastRun: "2025-02-08 09:00",
    status: "Success",
    changesDetected: 3,
  },
]

export const verificationItems: VerificationItem[] = [
  {
    id: "1",
    admissionTitle: "BSCS Fall 2025",
    university: "FAST University",
    submittedBy: "Rep_01",
    submittedOn: "2025-02-07",
    status: "Pending",
  },
]

export const adminChangeLogs: AdminChangeLog[] = [
  {
    id: 1,
    admissionId: "1",
    admissionTitle: "BSCS Fall 2025",
    modifiedBy: "Rep_01",
    modifiedByUserId: "user_1",
    changeType: "Manual Edit",
    timestamp: "2025-02-08T10:15:00Z",
    summary: "Deadline, Fee",
    diff: [
      { field: "Deadline", oldValue: "2025-07-10", newValue: "2025-07-15" },
      { field: "Fee", oldValue: "4500", newValue: "5000" },
    ],
    reasonForChange: "Updated deadline and fee.",
  },
]

export const systemMetrics: SystemMetrics = {
  totalUsers: 1234,
  totalAdmissions: 567,
  totalAlertsSent: 8901,
}

export const admissionAnalytics: AdmissionAnalytics = {
  statusBreakdown: [
    { status: "Verified", count: 245, percentage: 43.2 },
    { status: "Pending", count: 189, percentage: 33.3 },
    { status: "Rejected", count: 89, percentage: 15.7 },
    { status: "Disputed", count: 44, percentage: 7.8 },
  ],
  universityDistribution: [
    { university: "FAST University", count: 125 },
    { university: "NUST", count: 98 },
    { university: "LUMS", count: 87 },
  ],
  monthlyTrend: [
    { month: "Aug 2024", count: 42 },
    { month: "Sep 2024", count: 58 },
    { month: "Oct 2024", count: 65 },
    { month: "Nov 2024", count: 71 },
    { month: "Dec 2024", count: 68 },
    { month: "Jan 2025", count: 89 },
    { month: "Feb 2025", count: 174 },
  ],
  degreeTypeDistribution: [
    { degreeType: "BS", count: 198 },
    { degreeType: "MS", count: 156 },
    { degreeType: "MBA", count: 98 },
    { degreeType: "PhD", count: 67 },
    { degreeType: "BBA", count: 48 },
  ],
}

export const scraperJobs: ScraperJob[] = [
  {
    id: "1",
    jobId: "SCR-2025-02-08-001",
    university: "FAST University",
    universityId: "1",
    startedAt: "2025-02-08T09:00:00Z",
    finishedAt: "2025-02-08T09:02:15Z",
    status: "Changes Detected",
    sourceUrl: "https://www.nu.edu.pk/admissions",
    duration: "2m 15s",
    schedulerTriggered: true,
    changesDetected: [
      {
        admissionId: "1",
        admissionTitle: "BSCS Fall 2025",
        fields: ["deadline"],
      },
    ],
  },
]

export const getActionColor = (action: AdminAction["action"]) => {
  switch (action) {
    case "Verified":
      return { bg: "#D1FAE5", text: "#10B981" }
    case "Rejected":
      return { bg: "#FEE2E2", text: "#EF4444" }
    case "Disputed":
      return { bg: "#FED7AA", text: "#EA580C" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

export const getScraperStatusColor = (status: ScraperActivity["status"]) => {
  switch (status) {
    case "Success":
      return { bg: "#D1FAE5", text: "#10B981" }
    case "No Change":
      return { bg: "#DBEAFE", text: "#2563EB" }
    case "Error":
      return { bg: "#FEE2E2", text: "#EF4444" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

export const getScraperJobStatusColor = (status: ScraperJobStatus) => {
  switch (status) {
    case "Success":
      return { bg: "#D1FAE5", text: "#10B981" }
    case "No Changes":
      return { bg: "#FEF3C7", text: "#F59E0B" }
    case "Changes Detected":
      return { bg: "#DBEAFE", text: "#2563EB" }
    case "Failed":
      return { bg: "#FEE2E2", text: "#EF4444" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

export const getChangeTypeColor = (type: ChangeType) => {
  switch (type) {
    case "Scraper Update":
      return { bg: "#DBEAFE", text: "#2563EB" }
    case "Manual Edit":
      return { bg: "#FEF3C7", text: "#F59E0B" }
    case "Admin Edit":
      return { bg: "#E9D5FF", text: "#9333EA" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

export const getVerificationStatusColor = (status: VerificationStatus) => {
  switch (status) {
    case "Pending":
      return { bg: "#FEF3C7", text: "#F59E0B" }
    case "Verified":
      return { bg: "#D1FAE5", text: "#10B981" }
    case "Rejected":
      return { bg: "#FEE2E2", text: "#EF4444" }
    case "Disputed":
      return { bg: "#FED7AA", text: "#EA580C" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

// Helper function to get unique universities from verification items
export const getUniqueUniversities = (): string[] => {
  const universities = verificationItems.map(item => item.university)
  return ['All', ...Array.from(new Set(universities))]
}

// Scraper summary data
export const scraperSummary = {
  totalJobs: scraperJobs.length,
  successCount: scraperJobs.filter(job => job.status === 'Success').length,
  failedCount: scraperJobs.filter(job => job.status === 'Failed').length,
  changesDetected: scraperJobs.filter(job => job.status === 'Changes Detected').length,
}

// Analytics types and data
export type AnalyticsEventType = 
  | "Login"
  | "Logout"
  | "View Admission"
  | "Save Admission"
  | "Compare"
  | "Export Data"
  | "Upload Admission"
  | "Edit Admission"
  | "Admin Action"

export interface AnalyticsEvent {
  id: number
  userId: string
  userName: string
  userRole: "Student" | "UniversityRep" | "Admin"
  eventType: AnalyticsEventType
  timestamp: string
  details: string
  ipAddress: string
}

export const analyticsEvents: AnalyticsEvent[] = [
  {
    id: 1,
    userId: "user_001",
    userName: "John Doe",
    userRole: "Student",
    eventType: "Login",
    timestamp: "2025-02-10T10:00:00Z",
    details: "Successful login",
    ipAddress: "192.168.1.1"
  },
  {
    id: 2,
    userId: "user_002",
    userName: "Jane Smith",
    userRole: "UniversityRep",
    eventType: "Upload Admission",
    timestamp: "2025-02-10T10:15:00Z",
    details: "Uploaded BSCS Fall 2025 admission",
    ipAddress: "192.168.1.2"
  },
]

export const getUniqueAnalyticsUsers = (): string[] => {
  const users = analyticsEvents.map(event => event.userName)
  return ['All', ...Array.from(new Set(users))]
}

export const getUniqueEventTypes = (): AnalyticsEventType[] => {
  const types = analyticsEvents.map(event => event.eventType)
  return Array.from(new Set(types))
}
