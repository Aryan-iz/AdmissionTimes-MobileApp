import { describe, expect, it } from 'vitest'

import type { Admission } from '../services/types'
import {
  extractScraperFee,
  inferScraperDegreeLabelFromTitle,
  isScraperAdmission,
  resolveScraperAdmissionLocation,
  shouldHideGenericScraperAnnouncement,
} from './scraperAdmissionAdapter'

type AdmissionTestSeed = Partial<Admission> & Record<string, unknown>

const createAdmission = (overrides: AdmissionTestSeed = {}): Admission => {
  return {
    id: 1,
    title: 'Sample Admission',
    requirements: {},
    university_name: 'Sample University',
    ...overrides,
  } as Admission
}

describe('scraperAdmissionAdapter', () => {
  it('detects scraper admissions from origin fields', () => {
    expect(isScraperAdmission(createAdmission({ data_origin: 'scraper' }))).toBe(true)
    expect(isScraperAdmission(createAdmission({ source_system: 'AdmissionTimes-Scrapers' }))).toBe(true)
    expect(isScraperAdmission(createAdmission())).toBe(false)
  })

  it('infers a fallback BS degree from scraper titles', () => {
    expect(inferScraperDegreeLabelFromTitle('BS Computer Science Admissions')).toBe('BS')
    expect(inferScraperDegreeLabelFromTitle('Bachelor of Science in Civil Engineering')).toBe('BS')
    expect(inferScraperDegreeLabelFromTitle('Master of Business Administration')).toBe('MBA')
  })

  it('resolves known scraper locations when direct values are missing', () => {
    expect(
      resolveScraperAdmissionLocation(
        createAdmission({
          data_origin: 'scraper',
          university_name: 'National University of Computer and Emerging Sciences',
          location: '',
          requirements: {},
        })
      )
    ).toBe('Islamabad (Main Campus), Multiple campuses in Pakistan')

    expect(
      resolveScraperAdmissionLocation(
        createAdmission({
          data_origin: 'scraper',
          university_name: 'Ghulam Ishaq Khan Institute of Engineering Sciences and Technology',
          requirements: {},
        })
      )
    ).toBe('Topi, KPK, Pakistan')
  })

  it('extracts fee data from scraper payload text', () => {
    const result = extractScraperFee(
      createAdmission({
        data_origin: 'scraper',
        title: 'Admissions for Spring 2026',
        description: 'Application fee PKR 2500 for all programs',
      })
    )

    expect(result.feeNumeric).toBe(2500)
    expect(result.feeDisplay).toContain('2,500')
  })

  it('hides generic scraper announcements with multiple offered programs', () => {
    expect(
      shouldHideGenericScraperAnnouncement(
        createAdmission({
          data_origin: 'scraper',
          title: 'Admissions 2026',
          programs_offered_count: 3,
        })
      )
    ).toBe(true)

    expect(
      shouldHideGenericScraperAnnouncement(
        createAdmission({
          data_origin: 'scraper',
          title: 'BS Computer Science',
          programs_offered_count: 1,
        })
      )
    ).toBe(false)
  })
})