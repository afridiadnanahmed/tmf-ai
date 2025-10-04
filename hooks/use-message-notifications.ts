import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface UseMessageNotificationsProps {
  userId?: string
  userEmail?: string
  enabled?: boolean
  pollInterval?: number
}

export function useMessageNotifications({
  userId,
  userEmail,
  enabled = true,
  pollInterval = 30000, // Poll every 30 seconds by default
}: UseMessageNotificationsProps) {
  const lastCheckRef = useRef<Date>(new Date())
  const notifiedMessagesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled || !userEmail) return

    const checkForNewMessages = async () => {
      try {
        const response = await fetch('/api/messages/unread', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.unreadMessages && data.unreadMessages.length > 0) {
            // Filter out messages we've already notified about
            const newUnreadMessages = data.unreadMessages.filter(
              (msg: any) => !notifiedMessagesRef.current.has(msg.id)
            )

            // Show notifications for new messages
            newUnreadMessages.forEach((msg: any) => {
              const senderName = msg.senderName || msg.senderEmail || 'Unknown sender'
              const messagePreview = msg.content.length > 50 
                ? msg.content.substring(0, 50) + '...' 
                : msg.content

              toast.success(`New message from ${senderName}`, {
                description: messagePreview,
                duration: 5000,
                action: {
                  label: 'View',
                  onClick: () => {
                    // Navigate to messages screen
                    window.location.href = '/dashboard?tab=messages'
                  },
                },
              })

              // Mark this message as notified
              notifiedMessagesRef.current.add(msg.id)
            })

            // Update the last check time
            lastCheckRef.current = new Date()
          }
        }
      } catch (error) {
        console.error('Error checking for new messages:', error)
      }
    }

    // Initial check
    checkForNewMessages()

    // Set up polling interval
    const interval = setInterval(checkForNewMessages, pollInterval)

    return () => clearInterval(interval)
  }, [enabled, userEmail, pollInterval])

  // Function to manually check for new messages
  const checkNow = async () => {
    if (!userEmail) return

    try {
      const response = await fetch('/api/messages/unread', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        return data.unreadMessages || []
      }
    } catch (error) {
      console.error('Error checking for new messages:', error)
    }

    return []
  }

  // Function to mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    try {
      const response = await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ messageIds }),
      })

      if (response.ok) {
        // Remove these messages from the notified set so they can be re-notified if needed
        messageIds.forEach(id => notifiedMessagesRef.current.delete(id))
        return true
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }

    return false
  }

  return {
    checkNow,
    markAsRead,
  }
}