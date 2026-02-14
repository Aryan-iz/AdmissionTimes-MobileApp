// Mobile University Data - TypeScript

export type AdmissionStatus = "Active" | "Closing Soon" | "Draft" | "Closed" | "Pending Audit" | "Verified" | "Rejected" | "Disputed"
export type AuditStatus = "Pending" | "Verified" | "Rejected" | "Disputed"

export interface Admission {
  id: string
  title: string
  deadline: string
  status: AdmissionStatus
  views: string
  verifiedBy?: string
  lastAction?: string
  remarks?: string
  degreeType?: string
  department?: string
  academicYear?: string
  fee?: string
  overview?: string
  eligibility?: string
  websiteUrl?: string
  admissionPortalLink?: string
}

export interface AuditItem {
  id: number
  title: string
  status: AuditStatus
  verifiedBy?: string
  lastAction: string
  remarks?: string
}

export interface ChangeLogItem {
  id: number
  admission: string
  modifiedBy: string
  date: string
  diff: Array<{ field: string; old: string; new: string }>
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: "Admin Feedback" | "System Alert" | "Data Update"
  time: string
  read: boolean
  admissionId?: string
}

export const sharedAdmissions: Admission[] = [
  {
    id: "1",
    title: "BSCS Fall 2025",
    deadline: "2025-07-15",
    status: "Pending Audit",
    views: "1.2k",
    verifiedBy: "Admin",
    lastAction: "2025-02-07",
    remarks: "Under review",
    degreeType: "BS",
    department: "School of Engineering",
    academicYear: "2025-2026",
    fee: "5000",
  },
  {
    id: "2",
    title: "MBA Executive",
    deadline: "2025-08-10",
    status: "Verified",
    views: "890",
    verifiedBy: "Admin",
    lastAction: "2025-02-05",
    remarks: "Data validated successfully",
    degreeType: "MBA",
    department: "Business School",
    academicYear: "2025-2026",
    fee: "7500",
  },
]

export const sharedAudits: AuditItem[] = [
  {
    id: 1,
    title: "BSCS Fall 2025",
    status: "Pending",
    verifiedBy: "Admin",
    lastAction: "2025-02-07",
    remarks: "Under review",
  },
]

export const sharedChangeLogs: ChangeLogItem[] = [
  {
    id: 1,
    admission: "BSCS Fall 2025",
    modifiedBy: "Rep_01",
    date: "2025-02-07 13:45",
    diff: [
      { field: "Deadline", old: "2025-07-10", new: "2025-07-15" },
      { field: "Fee", old: "5000", new: "5500" },
    ],
  },
]

export const sharedNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Audit Update",
    message: "Your admission 'BSCS Fall 2025' is under review.",
    type: "Admin Feedback",
    time: "2025-02-08T10:00:00Z",
    read: false,
    admissionId: "1",
  },
]

export const getStatusColor = (status: AdmissionStatus | AuditStatus) => {
  switch (status) {
    case "Active":
    case "Verified":
      return { bg: "#D1FAE5", text: "#10B981" }
    case "Closing Soon":
      return { bg: "#FEF3C7", text: "#F59E0B" }
    case "Draft":
    case "Pending":
    case "Pending Audit":
      return { bg: "#DBEAFE", text: "#2563EB" }
    case "Closed":
    case "Rejected":
      return { bg: "#FEE2E2", text: "#EF4444" }
    case "Disputed":
      return { bg: "#FED7AA", text: "#EA580C" }
    default:
      return { bg: "#F3F4F6", text: "#6B7280" }
  }
}

export const getAdmissionById = (id: string): Admission | undefined => {
  return sharedAdmissions.find((a) => a.id === id)
}

