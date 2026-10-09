import { describe, expect, it } from 'vitest'
import { daysUntil, formatDate, daysLeftLabel, dayKey } from './dates'
import { toStudentAdmission, sortByDeadline } from './admission'
import { admissionIdOf, toStudentNotification } from './notification'
import type { Admission, Notification } from '../services/types'

// 2026-10-08 10:00 in Pakistan (05:00 UTC)
const NOW = Date.parse('2026-10-08T05:00:00Z')

describe('dates (Pakistan calendar days)', () => {
  it('counts calendar days, not 24h blocks', () => {
    // Deadline 2026-10-12 23:59:59 PKT
    expect(daysUntil('2026-10-12T18:59:59Z', NOW)).toBe(4)
    // Old scraped rows stored at 00:00 UTC on the 12th = 05:00 PKT on the 12th
    expect(daysUntil('2026-10-12T00:00:00Z', NOW)).toBe(4)
  })

  it('is 0 on the deadline day and -1 once passed', () => {
    expect(daysUntil('2026-10-08T18:59:59Z', NOW)).toBe(0)
    expect(daysUntil('2026-10-08T04:00:00Z', NOW)).toBe(-1)
    expect(daysUntil(null, NOW)).toBe(-1)
  })

  it('formats in Pakistan time regardless of device timezone', () => {
    // 21:00 UTC on Oct 11 is already Oct 12 in Pakistan
    expect(formatDate('2026-10-11T21:00:00Z')).toBe('October 12, 2026')
    expect(dayKey('2026-10-11T21:00:00Z')).toBe('2026-10-12')
    expect(formatDate(null)).toBe('No deadline')
  })

  it('labels days left', () => {
    expect(daysLeftLabel(0, true)).toBe('Closes today')
    expect(daysLeftLabel(1, true)).toBe('1 day left')
    expect(daysLeftLabel(5, true)).toBe('5 days left')
    expect(daysLeftLabel(-1, true)).toBe('Deadline passed')
    expect(daysLeftLabel(-1, false)).toBe('No deadline')
  })
})

const base: Admission = {
  id: 'a1',
  title: 'BS Computer Science',
  verification_status: 'verified',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
}

describe('toStudentAdmission', () => {
  it('maps a university-entered admission from the contract', () => {
    const a = toStudentAdmission({
      ...base,
      university_name: 'Aror University',
      description: 'Real description',
      deadline_iso: '2099-03-09T23:59:59Z',
      has_deadline: true,
      degree_label: 'BS',
      fee_display: 'PKR 85,000',
      fee_amount: 85000,
      location_display: 'Sukkur',
      source: 'university',
      admission_portal_url: 'https://portal.example.edu',
    })
    expect(a.source).toBe('university')
    expect(a.description).toBe('Real description')
    expect(a.fee).toBe('PKR 85,000')
    expect(a.location).toBe('Sukkur')
    expect(a.portalUrl).toBe('https://portal.example.edu')
    expect(a.programStatus).toBe('Open')
  })

  it('never invents data for a scraped admission', () => {
    const a = toStudentAdmission({
      ...base,
      title: 'Admissions 2026 Undergraduate Programs',
      university_name: 'GIKI',
      data_origin: 'scraper',
      source: 'scraper',
      degree_label: 'Not specified',
      fee_display: 'Not specified',
      fee_amount: null,
      location_display: 'Topi, Pakistan',
      source_announcement_url: 'https://giki.edu.pk/admissions',
      programs_offered: ['Computer Science', 'Data Science'],
      deadline_iso: '2099-11-10T19:00:00Z',
    })
    expect(a.id).toBe('a1') // real id: no "::program::" children
    expect(a.description).toBeNull()
    expect(a.degree).toBeNull()
    expect(a.fee).toBe('Not specified')
    expect(a.feeAmount).toBeNull()
    expect(a.programsOffered).toEqual(['Computer Science', 'Data Science'])
    expect(a.announcementUrl).toBe('https://giki.edu.pk/admissions')
  })

  it('treats a missing deadline as open, and a passed one as closed', () => {
    expect(toStudentAdmission({ ...base, has_deadline: false }).programStatus).toBe('Open')
    expect(toStudentAdmission({ ...base, deadline_iso: '2000-01-01T00:00:00Z', has_deadline: true }).programStatus).toBe('Closed')
  })

  it('sorts open programs by deadline, closed ones last', () => {
    const list = [
      toStudentAdmission({ ...base, id: 'late', deadline_iso: '2099-12-01T00:00:00Z' }),
      toStudentAdmission({ ...base, id: 'closed', deadline_iso: '2000-01-01T00:00:00Z' }),
      toStudentAdmission({ ...base, id: 'soon', deadline_iso: '2099-01-01T00:00:00Z' }),
    ]
    expect(sortByDeadline(list).map((a) => a.id)).toEqual(['soon', 'late', 'closed'])
  })
})

describe('notifications', () => {
  const n: Notification = {
    id: 'n1',
    role_type: 'student',
    notification_type: 'deadline_near',
    priority: 'high',
    title: 'Deadline approaching',
    message: 'Closes in 3 days',
    related_entity_type: 'deadline',
    related_entity_id: '11111111-1111-1111-1111-111111111111',
    is_read: false,
    action_url: '/program/459862f2-3a29-455a-873b-d790a5f6e920',
    created_at: '2026-10-08T00:00:00Z',
  }

  it('opens the admission from the link, not the deadline row id', () => {
    expect(admissionIdOf(n)).toBe('459862f2-3a29-455a-873b-d790a5f6e920')
    expect(toStudentNotification(n).kind).toBe('deadline')
  })

  it('falls back to the related admission and classifies broadcasts as system', () => {
    expect(
      admissionIdOf({ action_url: null, related_entity_type: 'admission', related_entity_id: 'adm-1' })
    ).toBe('adm-1')
    expect(toStudentNotification({ ...n, notification_type: 'system_broadcast', action_url: null, related_entity_type: null }).kind).toBe('system')
  })
})
