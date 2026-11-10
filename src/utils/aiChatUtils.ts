import type { AxiosError } from 'axios'
import type { AiChatResponse } from '../services/aiService'

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  text: string
}

export function buildHistoryFromModalMessages(
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>,
  maxEntries = 6
): ChatHistoryMessage[] {
  return messages
    .filter((m) => m.id !== '1')
    .slice(-maxEntries)
    .map((m) => ({
      role: m.role,
      text: m.content.slice(0, 500),
    }))
}

export function formatAiChatAnswer(data: AiChatResponse): string {
  if (data.clarification_needed && data.clarification_question?.trim()) {
    return data.clarification_question.trim()
  }
  const answer = data.answer?.trim()
  if (answer) return answer
  if (data.result_count === 0) {
    return 'I could not find matching admissions. Try rephrasing your question or broadening the deadline range.'
  }
  return 'No response was generated. Please try again.'
}

export function getAiErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>
  const status = axiosError.response?.status
  const apiMessage = axiosError.response?.data?.message

  if (status === 401) {
    return 'Your session has expired. Please sign in again, then retry your request.'
  }
  if (status === 503 || apiMessage?.toLowerCase().includes('not configured')) {
    return apiMessage || 'AI is not configured on the server. Please try again later.'
  }
  if (status === 502 || status === 504 || status === 429) {
    return apiMessage || 'The AI service is temporarily busy. Please try again in a moment.'
  }
  if (apiMessage) return apiMessage
  if (axiosError.message?.includes('timeout')) {
    return 'The request timed out. Please try a shorter question or retry.'
  }
  if (axiosError.message) return axiosError.message
  return 'I could not reach the AI assistant. Check your connection and try again.'
}

/** Worth one retry. 429 is our own per-user rate limit: retrying only hits it again. */
export function isTransientStatus(status?: number): boolean {
  return status === 502 || status === 503 || status === 504
}

export function getQuickActionsForContext(context: string): string[] {
  if (context.includes('Dashboard')) {
    return [
      'Show deadlines this month',
      'Compare saved programs',
      'Any new verified programs?',
      'Explain application statuses',
    ]
  }
  if (context.includes('Search')) {
    return [
      'Show programs closing this month',
      'Show verified programs only',
      'How do I compare programs?',
      'How do I save a program?',
    ]
  }
  if (context.includes('Compare')) {
    return [
      'Which program has a lower fee?',
      'Compare deadlines',
      'Explain the differences',
      'How do I add more programs?',
    ]
  }
  if (context.includes('Deadline')) {
    return [
      'Show urgent deadlines',
      'How do alerts work?',
      'What deadlines expire this week?',
      'How do I set a reminder?',
    ]
  }
  if (context.includes('Watchlist')) {
    return [
      'How do I enable all alerts?',
      'How do I compare saved programs?',
      'Which programs have passed deadline?',
      'How do I manage my watchlist?',
    ]
  }
  if (context.includes('Notification')) {
    return [
      'What do notifications mean?',
      'How do I manage alert settings?',
      'Why am I not getting alerts?',
      'Explain status change notifications',
    ]
  }
  return [
    'Help me find programs',
    'Show deadlines this month',
    'How do I compare programs?',
    'Explain admission statuses',
  ]
}
