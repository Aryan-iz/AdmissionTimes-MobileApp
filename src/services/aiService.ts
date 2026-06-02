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

interface AiHealthResponse {
  enabled: boolean;
  provider: string;
  model: string;
  ready: boolean;
}

/** Align request shape with web frontend (history in context + conversation_history). */
export const aiService = {
  chat: async (
    message: string,
    conversationContext?: string,
    history?: ChatHistoryEntry[] | ChatHistoryMessage[]
  ): Promise<ApiResponse<AiChatResponse>> => {
    let fullContext = conversationContext || '';
    const normalizedHistory = (history || []).map((entry) => ({
      role: entry.role === 'ai' ? ('assistant' as const) : entry.role === 'user' ? ('user' as const) : ('assistant' as const),
      text: entry.text.slice(0, 500),
    }));

    if (normalizedHistory.length > 0) {
      const historyStr = normalizedHistory
        .slice(-8)
        .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text.slice(0, 200)}`)
        .join('\n');
      fullContext = fullContext
        ? `${fullContext}\nRecent messages:\n${historyStr}`
        : `Recent messages:\n${historyStr}`;
    }

    const response = await apiClient.post(
      '/ai/chat',
      {
        message,
        conversation_context: fullContext.slice(0, 3000) || undefined,
        conversation_history: normalizedHistory.slice(-8),
      },
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
