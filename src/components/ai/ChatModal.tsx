import { Modal, View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { AxiosError } from 'axios'
import { useAi } from '../../contexts/AiContext'
import { useAuthStore } from '../../store'
import aiService, { type AiChatResponse } from '../../services/aiService'
import { navigationRef } from '../../navigation/navigationRef'
import { formatShortDate } from '../../domain/dates'
import {
  buildGuidanceResponse,
  buildHistoryFromModalMessages,
  formatAiChatAnswer,
  getAiErrorMessage,
  getQuickActionsForContext,
  isRefusalReply,
  isTransientStatus,
} from '../../utils/aiChatUtils'

type AiAvailability = 'checking' | 'online' | 'offline'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  /** Programs the assistant found; shown as tappable links to the program page. */
  results?: AiChatResponse['results']
}

const MAX_RESULT_LINKS = 5

export default function ChatModal() {
  const { isOpen, closeChat, context } = useAi()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI assistant. I can help you find admission programs, compare universities, check deadlines, and answer questions about admissions. How can I help you today?`,
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [availability, setAvailability] = useState<AiAvailability>('checking')
  const scrollViewRef = useRef<ScrollView>(null)

  const quickActions = useMemo(() => getQuickActionsForContext(context), [context])

  const subtitleStatus =
    availability === 'online' ? 'Online' : availability === 'checking' ? 'Checking' : 'Offline'

  const resolveAssistantReply = (query: string, answer: string | undefined, data?: { results?: unknown[]; result_count?: number }): string => {
    if (!answer) {
      if (data && (data.result_count ?? 0) > 0) {
        return formatAiChatAnswer({
          intent: 'search_admissions',
          extracted_filters: {},
          clarification_needed: false,
          answer: '',
          result_count: data.result_count ?? 0,
          results: (data.results || []) as AiChatResponse['results'],
        })
      }
      return 'I could not generate a response right now. Please try again with a more specific question.'
    }
    if (isRefusalReply(answer)) return buildGuidanceResponse(query)
    return answer
  }

  const handleSend = async (quickMessage?: string) => {
    const userText = quickMessage || inputText.trim()
    if (!userText) return

    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Please sign in to use the AI assistant.',
          timestamp: new Date(),
        },
      ])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }

    const historySnapshot = buildHistoryFromModalMessages(messages)

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    const requestWithRetry = async () => {
      try {
        return await aiService.chat(userText, context, historySnapshot)
      } catch (firstError) {
        const axiosError = firstError as AxiosError<{ message?: string }>
        const status = axiosError.response?.status
        if (!isTransientStatus(status)) throw firstError
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 500)
        })
        return await aiService.chat(userText, context, historySnapshot)
      }
    }

    try {
      const response = await requestWithRetry()
      setAvailability('online')

      const formatted = formatAiChatAnswer(response.data)
      const finalText = resolveAssistantReply(userText, formatted, response.data)

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalText,
        timestamp: new Date(),
        results: (response.data.results || []).slice(0, MAX_RESULT_LINKS),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      setAvailability('offline')
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAiErrorMessage(error),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const openProgram = (id: string) => {
    closeChat()
    if (navigationRef.isReady()) navigationRef.navigate('ProgramDetail', { id })
  }

  const handleQuickAction = (action: string) => {
    void handleSend(action)
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true })
    }
  }, [messages])

  useEffect(() => {
    if (!isOpen || !isAuthenticated) {
      return
    }

    let isMounted = true
    setAvailability('checking')

    aiService
      .health()
      .then((response) => {
        if (!isMounted) return
        setAvailability(response.data.ready ? 'online' : 'offline')
      })
      .catch(() => {
        if (!isMounted) return
        setAvailability('offline')
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, isAuthenticated])

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeChat}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.chatContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatarContainer}>
                <Text style={styles.aiAvatar}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <View style={styles.subtitleRow}>
                  <View
                    style={[
                      styles.statusDot,
                      availability === 'online'
                        ? styles.statusOnline
                        : availability === 'checking'
                        ? styles.statusChecking
                        : styles.statusOffline,
                    ]}
                  />
                  <Text style={styles.headerSubtitle}>{context} • {subtitleStatus}</Text>
                </View>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={closeChat}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {availability === 'offline' && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>
                AI service is unavailable. Check your connection or sign in again.
              </Text>
            </View>
          )}

          <View style={styles.quickActionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
              {quickActions.map((action, index) => (
                <Pressable key={index} style={styles.quickActionChip} onPress={() => handleQuickAction(action)}>
                  <Text style={styles.quickActionText}>{action}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
            {messages.map((message) => (
              <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                {message.role === 'assistant' && (
                  <View style={styles.aiAvatarSmall}>
                    <Text style={styles.aiAvatarSmallText}>🤖</Text>
                  </View>
                )}
                <View style={[styles.messageContent, message.role === 'user' ? styles.userMessageContent : styles.aiMessageContent]}>
                  <Text style={[styles.messageText, message.role === 'user' ? styles.userMessageText : styles.aiMessageText]}>
                    {message.content}
                  </Text>
                  {message.results && message.results.length > 0 ? (
                    <View style={styles.resultList}>
                      {message.results.map((result) => (
                        <Pressable
                          key={result.id}
                          style={styles.resultLink}
                          onPress={() => openProgram(result.id)}
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${result.title}`}
                        >
                          <Text style={styles.resultTitle} numberOfLines={2}>
                            {result.title}
                          </Text>
                          <Text style={styles.resultMeta} numberOfLines={1}>
                            {[result.degree_level, result.location, result.deadline ? `Deadline ${formatShortDate(result.deadline)}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  <Text style={[styles.timestamp, message.role === 'user' ? styles.userTimestamp : styles.aiTimestamp]}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
            {isTyping && (
              <View style={[styles.messageBubble, styles.aiBubble]}>
                <View style={styles.aiAvatarSmall}>
                  <Text style={styles.aiAvatarSmallText}>🤖</Text>
                </View>
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingDot}>●</Text>
                  <Text style={styles.typingDot}>●</Text>
                  <Text style={styles.typingDot}>●</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about admissions..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => {
                void handleSend()
              }}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={() => {
                void handleSend()
              }}
              disabled={!inputText.trim() || isTyping}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendIcon}>➤</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  resultList: {
    marginTop: 8,
    gap: 6,
  },
  resultLink: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  resultMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiAvatar: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusChecking: {
    backgroundColor: '#F59E0B',
  },
  statusOffline: {
    backgroundColor: '#EF4444',
  },
  statusBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusBannerText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActionsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickActionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiAvatarSmallText: {
    fontSize: 14,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userMessageContent: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#DBEAFE',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  typingIndicator: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  typingDot: {
    fontSize: 8,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 14,
    color: '#111827',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
})
