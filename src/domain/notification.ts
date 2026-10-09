/**
 * Student notification model, mapped from GET /notifications.
 */

import type { Notification } from '../services/types'
import { timeAgo } from './dates'

/** Tabs on the notifications screen. */
export type NotificationKind = 'deadline' | 'admission' | 'system'

export interface StudentNotification {
  id: string
  kind: NotificationKind
  title: string
  description: string
  createdAt: string
  timeAgo: string
  read: boolean
  priority: Notification['priority']
  /** Admission to open when tapped (from action_url `/program/:id`). */
  admissionId?: string
}

const PROGRAM_URL = /^\/program\/([0-9a-f-]{36})/i

const KIND_BY_TYPE: Record<string, NotificationKind> = {
  deadline_near: 'deadline',
  admission_updated_saved: 'admission',
  admission_verified: 'admission',
  admission_rejected: 'admission',
  admission_submitted: 'admission',
  admission_resubmitted: 'admission',
  admission_revision_required: 'admission',
}

/** The admission a notification is about, if any. Deadline reminders reference the deadline row, so prefer the link. */
export const admissionIdOf = (notification: Pick<Notification, 'action_url' | 'related_entity_type' | 'related_entity_id'>): string | undefined => {
  const fromUrl = PROGRAM_URL.exec(notification.action_url || '')?.[1]
  if (fromUrl) return fromUrl
  return notification.related_entity_type === 'admission' && notification.related_entity_id ? notification.related_entity_id : undefined
}

export const toStudentNotification = (notification: Notification): StudentNotification => ({
  id: notification.id,
  kind: KIND_BY_TYPE[notification.notification_type] ?? 'system',
  title: notification.title,
  description: notification.message,
  createdAt: notification.created_at,
  timeAgo: timeAgo(notification.created_at),
  read: notification.is_read,
  priority: notification.priority,
  admissionId: admissionIdOf(notification),
})
