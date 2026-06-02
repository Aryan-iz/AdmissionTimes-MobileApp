/**
 * Global student AI assistant — visible on all authenticated student screens.
 * Route context is synced from NavigationContainer (not useNavigationState).
 */

import { useEffect } from 'react'
import { useAi } from '../../contexts/AiContext'
import { useAuthStore } from '../../store'
import AiAssistantButton from './AiAssistantButton'
import ChatModal from './ChatModal'

const ROUTE_CONTEXT: Record<string, string> = {
  StudentDashboard: 'Student Dashboard',
  StudentSearch: 'Search Admissions',
  StudentCompare: 'Compare Programs',
  StudentDeadlines: 'Deadlines',
  StudentWatchlist: 'Watchlist',
  StudentNotifications: 'Notifications',
  ProgramDetail: 'Program Details',
}

export default function StudentAiOverlay() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { setContext, activeRouteName } = useAi()

  useEffect(() => {
    if (activeRouteName && ROUTE_CONTEXT[activeRouteName]) {
      setContext(ROUTE_CONTEXT[activeRouteName])
    }
  }, [activeRouteName, setContext])

  if (!isAuthenticated || user?.role !== 'student') {
    return null
  }

  return (
    <>
      <AiAssistantButton />
      <ChatModal />
    </>
  )
}
