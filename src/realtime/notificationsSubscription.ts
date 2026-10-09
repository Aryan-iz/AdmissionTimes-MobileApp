import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

interface RealtimeNotificationPayload {
  id: string
  title?: string
  message?: string
  related_entity_id?: string | null
  related_entity_type?: string | null
  action_url?: string | null
}

interface SubscribeOptions {
  userId: string
  onInsert: (payload: RealtimeNotificationPayload) => void
  onError?: (error: string) => void
}

export const subscribeToStudentNotificationInserts = ({
  userId,
  onInsert,
  onError,
}: SubscribeOptions): (() => Promise<void>) => {
  const channelName = `student-notifications-${userId}-${Date.now()}`

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onInsert(payload.new as RealtimeNotificationPayload)
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(status)
      }
    })

  return async () => {
    await supabase.removeChannel(channel)
  }
}
