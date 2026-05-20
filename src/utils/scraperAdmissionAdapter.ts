import type { Admission } from '../services/types'

type AnyRecord = Record<string, unknown>

const PROGRAM_COLLECTION_KEYS = [
  'programs',
  'sub_programs',
  'subPrograms',
  'program_list',
  'programList',
  'program_details',
  'programDetails',
  'variants',
  'tracks',
]

const PROGRAM_REQUIREMENT_COLLECTION_KEYS = [
  'programs_offered',
  'programs',
  'program_list',
  'programList',
  'sub_programs',
  'subPrograms',
  'tracks',
  'majors',
]

const readString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

const toObject = (value: unknown): AnyRecord => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as AnyRecord
  }
  return {}
}

const readProgramName = (entry: AnyRecord): string | null => {
  const candidate =
    entry.program_name ||
    entry.program_title ||
    entry.sub_program_title ||
    entry.title ||
    entry.name ||
    entry.label

  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate.trim()
    : null
}

const getProgramCollection = (admission: AnyRecord): unknown[] => {
  for (const key of PROGRAM_COLLECTION_KEYS) {
    const value = admission?.[key]
    if (Array.isArray(value) && value.length > 0) {
      return value
    }
  }

  const requirements = toObject(admission?.requirements)
  for (const key of PROGRAM_REQUIREMENT_COLLECTION_KEYS) {
    const value = requirements?.[key]
    if (Array.isArray(value) && value.length > 0) {
      return value
    }
  }

  const offeredPrograms = requirements?.programs_offered
  if (typeof offeredPrograms === 'string' && offeredPrograms.trim().length > 0) {
    const programNames = offeredPrograms
      .split(',')
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0)

    if (programNames.length > 0) {
      return programNames
    }
  }

  return []
}

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const isLikelyNonLocationText = (value: string): boolean => {
  return /(admission|program|deadline|apply|university|institute|faculty|department)/i.test(value)
}

const parseCurrencyAmount = (text: string): number | null => {
  if (!text) return null

  const normalized = text.replace(/,/g, '')
  const labeledMatch = normalized.match(/(?:pkr|rs\.?|rupees?)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i)
  if (labeledMatch?.[1]) return Number(labeledMatch[1])

  const anyAmountMatch = normalized.match(/\b(\d{4,7}(?:\.\d+)?)\b/)
  if (!anyAmountMatch?.[1]) return null

  const value = Number(anyAmountMatch[1])
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

const formatPkr = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const inferUniversityLocationFallback = (admission: Admission): string | null => {
  const universityText = [
    normalizeString(admission.university_name),
    normalizeString((admission as Admission & { source_university_name?: string }).source_university_name),
    normalizeString((admission as Admission & { university?: string }).university),
    normalizeString(admission.universities?.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (!universityText) return null

  if (/(giki|gha?ulam\s+ishaq\s+khan)/i.test(universityText)) return 'Topi, KPK, Pakistan'
  if (/(mohammad\s+ali\s+jinnah|\bmaju\b)/i.test(universityText)) return 'Karachi, Sindh, Pakistan'
  if (/(national\s+university\s+of\s+technology|\bnutech\b)/i.test(universityText)) return 'Islamabad, Pakistan'
  if (/(\bfast\b|\bnuces\b|national\s+university\s+of\s+computer\s+and\s+emerging\s+sciences)/i.test(universityText)) {
    return 'Islamabad (Main Campus), Multiple campuses in Pakistan'
  }
  if (/(\biba\b.*sukkur|sukkur.*\biba\b|institute\s+of\s+business\s+administration\s+sukkur)/i.test(universityText)) {
    return 'Sukkur, Sindh, Pakistan'
  }
  if (/(\biba\b.*karachi|karachi.*\biba\b|institute\s+of\s+business\s+administration\s+karachi)/i.test(universityText)) {
    return 'Karachi, Sindh, Pakistan'
  }

  return null
}

export const isScraperAdmission = (admission: Admission): boolean => {
  const dataOrigin = String(admission.data_origin || '').toLowerCase()
  const sourceSystem = String(admission.source_system || '').toLowerCase()
  return dataOrigin === 'scraper' || sourceSystem.includes('scraper')
}

export const shouldHideGenericScraperAnnouncement = (admission: Admission): boolean => {
  if (!isScraperAdmission(admission)) return false

  const title = String(admission.title || '').toLowerCase()
  const requirements = toObject(admission.requirements)
  const programsOfferedCount = Number(
    (admission as Admission & { programs_offered_count?: number }).programs_offered_count ??
      requirements.programs_offered_count ??
      0
  )

  if (programsOfferedCount <= 1) return false

  return /(admission|admissions|programs?|undergraduate|graduate|postgraduate|round|round\s*\d+)/i.test(title)
}

export const flattenProgramAdmissions = <T extends Record<string, any>>(admissions: T[]): T[] => {
  return admissions.flatMap((admission) => {
    const programCollection = getProgramCollection(admission)
    if (programCollection.length === 0) {
      return [admission]
    }

    const parentId = String(admission.id || admission.admission_id || '')

    return programCollection.map((entry, index) => {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const normalizedEntry = { ...entry } as AnyRecord
        const normalizedProgramName = readProgramName(normalizedEntry)
        const childId = String(
          normalizedEntry.id ||
          normalizedEntry.admission_id ||
          normalizedEntry.program_id ||
          `${parentId || 'program'}::program::${index + 1}`,
        )

        return {
          ...admission,
          ...normalizedEntry,
          id: childId,
          source_admission_id: parentId || normalizedEntry.source_admission_id || normalizedEntry.parent_admission_id || null,
          parent_admission_id: parentId || normalizedEntry.parent_admission_id || null,
          program_index: index,
          title: normalizedProgramName || admission.title,
          program_title: normalizedProgramName || admission.program_type || admission.title,
        }
      }

      if (typeof entry === 'string') {
        return {
          ...admission,
          id: `${parentId || 'program'}::program::${index + 1}`,
          source_admission_id: parentId || null,
          parent_admission_id: parentId || null,
          program_index: index,
          title: entry,
          program_title: entry,
        }
      }

      return {
        ...admission,
        id: `${parentId || 'program'}::program::${index + 1}`,
        source_admission_id: parentId || null,
        parent_admission_id: parentId || null,
        program_index: index,
      }
    })
  })
}

export const inferScraperDegreeLabelFromTitle = (title: string | null | undefined): string | null => {
  if (!title) return null
  const text = String(title).toLowerCase()

  if (/\bbba\b|bachelor of business administration/.test(text)) return 'BBA'
  if (/\bmba\b|master of business administration/.test(text)) return 'MBA'
  if (/\bphd\b|doctor of philosophy|doctorate/.test(text)) return 'PhD'
  if (/\bmd\b|doctor of medicine/.test(text)) return 'MD'
  if (/\bmphil\b|master of philosophy/.test(text)) return 'MPhil'
  if (/\bbs\b|bachelor of science|\bbe\b|bachelor|undergraduate|under-graduate/.test(text)) return 'BS'
  if (/\bms\b|master of science|\bmaster\b|postgraduate|post-graduate|\bgraduate\b/.test(text)) return 'MS'

  return null
}

export const resolveScraperAdmissionLocation = (admission: Admission): string | null => {
  const requirements = toObject(admission.requirements)
  const links = toObject(requirements.links)

  const locationCandidates = [
    normalizeString((admission as Admission & { source_location?: string }).source_location),
    normalizeString(requirements.source_location),
    normalizeString((admission as Admission & { campus?: string }).campus),
    normalizeString(requirements.campus),
    normalizeString((admission as Admission & { city?: string }).city),
    normalizeString(requirements.city),
    normalizeString(admission.location),
    normalizeString(requirements.location),
    normalizeString(links.location),
  ]

  const specificLocation = locationCandidates.find((candidate) => {
    if (!candidate) return false
    if (candidate.length < 3) return false
    return !isLikelyNonLocationText(candidate)
  })
  if (specificLocation) return specificLocation

  const mappedFallback = inferUniversityLocationFallback(admission)
  if (mappedFallback) return mappedFallback

  return null
}

export const extractScraperOfficialUrl = (admission: Admission): string | undefined => {
  const requirements = toObject(admission.requirements)
  const links = toObject(requirements.links)

  const directCandidates = [
    normalizeString(admission.source_url),
    normalizeString(admission.source_details_link),
    normalizeString(admission.primary_apply_url),
    normalizeString(admission.admission_portal_url),
    normalizeString(admission.university_website_url),
    normalizeString(requirements.source_details_link),
    normalizeString(requirements.admissionPortalLink),
    normalizeString(requirements.websiteUrl),
    normalizeString(links.admissionPortalLink),
    normalizeString(links.websiteUrl),
  ]

  return directCandidates.find((candidate) => /^https?:\/\//i.test(candidate))
}

export const extractScraperFee = (admission: Admission): { feeNumeric: number | null; feeDisplay?: string } => {
  const directNumericCandidates = [
    Number(admission.fee_amount),
    Number(admission.application_fee),
  ]

  const directNumeric = directNumericCandidates.find((value) => Number.isFinite(value) && value > 0)
  if (typeof directNumeric === 'number') {
    return { feeNumeric: directNumeric, feeDisplay: formatPkr(directNumeric) }
  }

  const requirements = toObject(admission.requirements)
  const links = toObject(requirements.links)
  const blob = [
    normalizeString(admission.title),
    normalizeString(admission.description),
    normalizeString(admission.fee_display),
    normalizeString(requirements.fee),
    normalizeString(requirements.fee_display),
    normalizeString(requirements.application_fee),
    normalizeString(admission.location),
    normalizeString(requirements.location),
    normalizeString(links.websiteUrl),
  ]
    .filter(Boolean)
    .join(' | ')

  const amount = parseCurrencyAmount(blob)
  if (!amount) return { feeNumeric: null }

  return { feeNumeric: amount, feeDisplay: formatPkr(amount) }
}
