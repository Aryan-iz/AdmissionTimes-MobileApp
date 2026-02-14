/**
 * AiContext - AI Assistant state management
 * 
 * ACTIVE FEATURE: Manages the AI chat assistant modal state and context
 * for the Student module. Provides context-aware assistance throughout
 * the student journey.
 * 
 * Features:
 * - Chat modal open/close state
 * - Context tracking (which screen the user is on)
 * - Global access to AI assistant
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface AiContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  context: string
  setContext: (context: string) => void
}

const AiContext = createContext<AiContextType | undefined>(undefined)

export function AiProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState('Student Dashboard')

  const openChat = () => setIsOpen(true)
  const closeChat = () => setIsOpen(false)
  const toggleChat = () => setIsOpen((prev) => !prev)

  return <AiContext.Provider value={{ isOpen, openChat, closeChat, toggleChat, context, setContext }}>{children}</AiContext.Provider>
}

export function useAi() {
  const context = useContext(AiContext)
  if (context === undefined) {
    throw new Error('useAi must be used within an AiProvider')
  }
  return context
}
