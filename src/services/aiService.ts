import apiClient from './apiClient';
import type { ApiResponse } from './types';
import type { ChatHistoryMessage } from '../utils/aiChatUtils';

export interface ChatHistoryEntry {
  role: 'user' | 'assistant' | 'ai'
  text: string
}

export interface AiChatResponse {
  intent: 'search_admissions' | 'guidance' | 'clarification' | 'unsupported';
  extracted_filters: {
    search?: string;
    degree_level?: string;
    field_of_study?: string;
    location?: string;
    program_type?: string;
    delivery_mode?: string;
    deadline_within_days?: number;
  };
  clarification_needed: boolean;
  clarification_question?: string;
  answer: string;
  result_count: number;
  results: Array<{
    id: string;
    title: string;
    degree_level: string | null;
    location: string | null;
    deadline: string | null;
    verification_status: string;
    university_id: string | null;
  }>;
}

/** POST /ai/compare: a short comparison written from the programs' real data. */
export interface AiCompareResponse {
  summary: string;
  highlights: string[];
  method: 'ai' | 'fallback';
  provider: 'gemini' | 'rules';
  model?: string;
}

interface AiHealthResponse {
  enabled: boolean;
  provider: string;
  model: string;
  ready: boolean;
}

/** Same request shape as the web app: page context + conversation_history (each sent once). */
export const aiService = {
  chat: async (
    message: string,
    conversationContext?: string,
    history?: ChatHistoryEntry[] | ChatHistoryMessage[]
  ): Promise<ApiResponse<AiChatResponse>> => {
    // The backend merges the page context with the history; pasting the
    // history into the context as well made the model see every message twice.
    const normalizedHistory = (history || [])
      .map((entry) => ({
        role: entry.role === 'user' ? ('user' as const) : ('assistant' as const),
        text: entry.text.trim().slice(0, 500),
      }))
      .filter((entry) => entry.text)
      .slice(-8);

    const response = await apiClient.post(
      '/ai/chat',
      {
        message,
        conversation_context: conversationContext?.trim().slice(0, 3000) || undefined,
        conversation_history: normalizedHistory.length ? normalizedHistory : undefined,
      },
      { timeout: 60000 }
    );
    return response.data;
  },

  compare: async (admissionIds: string[], focus?: string): Promise<ApiResponse<AiCompareResponse>> => {
    const response = await apiClient.post(
      '/ai/compare',
      { admission_ids: admissionIds, focus: focus?.trim() || undefined },
      { timeout: 60000 }
    );
    return response.data;
  },

  health: async (): Promise<ApiResponse<AiHealthResponse>> => {
    const response = await apiClient.get('/ai/health', { timeout: 15000 });
    return response.data;
  },
};

export default aiService;
