import apiClient from './apiClient'

type University = {
  id: string | number
  name?: string
  logo_url?: string
  city?: string
  country?: string
}

const cache: Record<string, University | null> = {}

export const getUniversityById = async (id: string | number): Promise<University | null> => {
  const key = String(id)
  if (cache.hasOwnProperty(key)) return cache[key]

  try {
    const resp = await apiClient.get(`/universities/${key}`)
    const data = resp.data
    const result: University = {
      id: data.id ?? key,
      name: data.name ?? data.university_name ?? undefined,
      logo_url: (data.logo_url ?? data.logo) || undefined,
      city: data.city ?? undefined,
      country: data.country ?? undefined,
    }
    cache[key] = result
    return result
  } catch (err) {
    cache[key] = null
    return null
  }
}

export default {
  getUniversityById,
}
