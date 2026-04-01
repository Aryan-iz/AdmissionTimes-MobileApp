/**
 * Recommendations Service (Mobile)
 *
 * Thin API client for student recommendation endpoints.
 * Uses existing JWT-authenticated apiClient.
 */

import apiClient from './apiClient'
import type { ApiResponse, Admission } from './types'

export interface RecommendationItem {
  id: string
  user_id: string
  admission_id: string
  score: number
  reason: string
  factors: Record<string, unknown>
  generated_at: string
  expires_at: string
  admission?: Admission
}

export interface RecommendationsPayload {
  recommendations: RecommendationItem[]
  count: number
}

export const recommendationsService = {
  getRecommendations: async (
    limit: number = 10,
    minScore: number = 50
  ): Promise<ApiResponse<RecommendationsPayload>> => {
    const response = await apiClient.get('/recommendations', {
      params: { limit, min_score: minScore },
    })
    return response.data
  },

  getRecommendationCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get('/recommendations/count')
    return response.data
  },

  refreshRecommendations: async (): Promise<ApiResponse<{ message: string; count: number }>> => {
    const response = await apiClient.post('/recommendations/refresh')
    return response.data
  },
}

export default recommendationsService
