import apiClient from './apiClient';
import type { ApiResponse } from './types';

export interface ChatHistoryEntry {
  role: 'user' | 'assistant' | 'ai'
  text: string
}

interface AiHealthResponse {
  enabled: boolean;
  provider: string;
  model: string;
  ready: boolean;
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

export const aiService = {
  chat: async (
    message: string,
    conversationContext?: string,
    history?: ChatHistoryEntry[]
  ): Promise<ApiResponse<AiChatResponse>> => {
    const response = await apiClient.post('/ai/chat', {
      message,
      conversation_context: conversationContext?.slice(0, 3000) || undefined,
      conversation_history: history?.slice(-8).map((entry) => ({
        role: entry.role === 'ai' ? 'assistant' : entry.role,
        text: entry.text.slice(0, 500),
      })),
    });
    return response.data;
  },

  health: async (): Promise<ApiResponse<AiHealthResponse>> => {
    const response = await apiClient.get('/ai/health');
    return response.data;
  },
};

export default aiService;
