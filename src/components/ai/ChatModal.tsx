import { Modal, View, Text, TextInput, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useRef, useEffect } from 'react'
import { useAi } from '../../contexts/AiContext'
import aiService, { type ChatHistoryEntry } from '../../services/aiService'

type AiAvailability = 'checking' | 'online' | 'fallback'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickActions = [
  'Find CS programs in Karachi',
  'Show deadlines this week',
  'Compare my saved programs',
  'What does Verified status mean?',
]

export default function ChatModal() {
  const { isOpen, closeChat, context } = useAi()
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

  const subtitleStatus =
    availability === 'online'
      ? 'Online'
      : availability === 'checking'
      ? 'Checking'
      : 'Guided mode'

  const buildFallbackResponse = (query: string): string => {
    const lower = query.toLowerCase()
    const suggestions: string[] = []

    if (lower.includes('deadline') || lower.includes('reminder')) {
      suggestions.push('Open Deadlines to review due dates and urgent submissions.')
      suggestions.push('Enable alerts from your watchlist for upcoming program deadlines.')
    }

    if (lower.includes('compare') || lower.includes('university')) {
      suggestions.push('Use Compare to evaluate fee, deadline, and degree details side by side.')
      suggestions.push('Save programs first, then compare from your watchlist.')
    }

    if (lower.includes('requirement') || lower.includes('eligibility')) {
      suggestions.push('Open a program detail page to review official requirements and documents.')
      suggestions.push('Filter search by degree level and city to narrow matching programs.')
    }

    if (suggestions.length === 0) {
      suggestions.push('Try a shorter query, for example: "Show deadlines this week".')
      suggestions.push('You can also use quick actions below for common admission tasks.')
    }

    return [
      'AI is temporarily unavailable. You can continue with these steps:',
      ...suggestions.map((s) => `- ${s}`),
    ].join('\n')
  }

  const isRefusalReply = (text: string): boolean => {
    const lower = text.toLowerCase()
    return (
      lower.includes('i can only help with') ||
      lower.includes('i cannot assist') ||
      lower.includes('cannot manage') ||
      lower.includes('i cannot access')
    )
  }

  const buildGuidanceResponse = (query: string): string => {
    const lower = query.toLowerCase()

    if (lower.includes('compare')) {
      return [
        'To compare universities:',
        '- Save programs you like first.',
        '- Open Compare and select at least two programs.',
        '- Review fee, deadline, and eligibility side by side.',
      ].join('\n')
    }

    if (lower.includes('alert') || lower.includes('watchlist') || lower.includes('expired')) {
      return [
        'To manage watchlist and alerts:',
        '- Open Watchlist and enable reminders for important programs.',
        '- Check Deadlines for urgent items each week.',
        '- Remove expired entries to keep recommendations relevant.',
      ].join('\n')
    }

    if (lower.includes('status') || lower.includes('requirement') || lower.includes('eligibility')) {
      return [
        'Admissions help:',
        '- Verified means the listing is approved and trusted.',
        '- Pending means review is still in progress.',
        '- Open program details for exact eligibility and document requirements.',
      ].join('\n')
    }

    return [
      'I can help with student admissions tasks:',
      '- Find matching programs',
      '- Compare universities',
      '- Track deadlines and statuses',
    ].join('\n')
  }

  const resolveAssistantReply = (query: string, answer: string | undefined): string => {
    if (!answer) return buildFallbackResponse(query)
    if (isRefusalReply(answer)) return buildGuidanceResponse(query)
    return answer
  }

  const handleSend = async (quickMessage?: string) => {
    const userText = quickMessage || inputText.trim()
    if (!userText) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputText('')
    setIsTyping(true)

    const historySnapshot: ChatHistoryEntry[] = messages
      .filter((m) => m.id !== '1')
      .slice(-4)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.content }))

    try {
      const response = await aiService.chat(userText, context, historySnapshot)
      setAvailability('online')
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: resolveAssistantReply(userText, response.data.answer?.trim()),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
    } catch {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: buildFallbackResponse(userText),
        timestamp: new Date(),
      }

      setAvailability('fallback')

      setMessages((prev) => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
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
    if (!isOpen) {
      return
    }

    let isMounted = true
    setAvailability('checking')

    aiService
      .health()
      .then((response) => {
        if (!isMounted) return
        setAvailability(response.data.ready ? 'online' : 'fallback')
      })
      .catch(() => {
        if (!isMounted) return
        setAvailability('fallback')
      })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeChat}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.chatContainer}>
          {/* Header */}
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
                        : styles.statusFallback,
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

          {availability === 'fallback' && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>
                Live AI is unavailable right now. Guided mode is active.
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
              {quickActions.map((action, index) => (
                <Pressable key={index} style={styles.quickActionChip} onPress={() => handleQuickAction(action)}>
                  <Text style={styles.quickActionText}>{action}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Messages */}
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

          {/* Input */}
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
              disabled={!inputText.trim()}
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
  statusFallback: {
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
