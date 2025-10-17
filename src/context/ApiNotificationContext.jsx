import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getApiUrl } from '../utils/api'

const ApiNotificationContext = createContext()

export const useApiNotifications = () => {
  const context = useContext(ApiNotificationContext)
  if (!context) {
    throw new Error('useApiNotifications must be used within an ApiNotificationProvider')
  }
  return context
}

export const ApiNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  // Fetch notifications from API with robust error handling
  const fetchNotifications = async () => {
    try {
      console.log('🔄 Fetching notifications from API...')
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${getApiUrl()}/notifications`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`📖 Fetched ${data.notifications.length} notifications from API`)
      
      // Check if there are new notifications
      const hasNewNotifications = data.notifications.length !== notifications.length ||
        (data.notifications.length > 0 && notifications.length > 0 && 
         data.notifications[0]?.id !== notifications[0]?.id)
      
      if (hasNewNotifications) {
        console.log('🚀 New notifications detected!')
        setNotifications(data.notifications)
        
        // Show toast for new notifications
        const newNotifications = data.notifications.filter(n => 
          n.timestamp > lastFetch && !n.read
        )
        
        newNotifications.forEach(notification => {
          toast.success(`New notification: ${notification.title}`, {
            duration: 4000,
            icon: '🔔'
          })
        })
      }
      
      setLastFetch(Date.now())
      setErrorCount(0) // Reset error count on success
      return data.notifications
    } catch (error) {
      console.warn('⚠️ API fetch failed, using fallback:', error.message)
      setErrorCount(prev => prev + 1)
      
      // Fallback to localStorage - this ensures app doesn't break
      try {
        const stored = localStorage.getItem('notifications') || localStorage.getItem('notifications-backup')
        if (stored) {
          const backup = JSON.parse(stored)
          console.log(`💾 Using localStorage fallback with ${backup.length} notifications`)
          setNotifications(backup)
          return backup
        } else {
          console.log('💾 No localStorage backup found, using empty array')
          setNotifications([])
          return []
        }
      } catch (backupError) {
        console.error('❌ Backup fallback failed:', backupError)
        setNotifications([])
        return []
      }
    }
  }

  // Add new notification with fallback
  const addNotification = async (notificationData) => {
    setLoading(true)
    try {
      console.log('🚀 Adding notification via API:', notificationData)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${getApiUrl()}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Notification added successfully:', result.notification)
      
      // Immediately refresh to get updated list
      await fetchNotifications()
      
      // Save to localStorage as backup
      localStorage.setItem('notifications-backup', JSON.stringify(notifications))
      
      toast.success(`Notification sent: ${result.notification.title}`, {
        duration: 3000,
        icon: '✅'
      })
      
      return result.notification
    } catch (error) {
      console.warn('⚠️ API add failed, using localStorage fallback:', error.message)
      
      // Fallback to localStorage if API fails
      try {
        const newNotification = {
          id: Date.now() + Math.random(),
          ...notificationData,
          timestamp: Date.now(),
          date: new Date().toISOString(),
          read: false,
          author: notificationData.author || 'Building Management'
        }
        
        const current = JSON.parse(localStorage.getItem('notifications') || '[]')
        const updated = [newNotification, ...current]
        localStorage.setItem('notifications', JSON.stringify(updated))
        localStorage.setItem('notifications-backup', JSON.stringify(updated))
        
        setNotifications(updated)
        
        toast.success(`Notification sent: ${newNotification.title} (offline mode)`, {
          duration: 3000,
          icon: '✅'
        })
        
        return newNotification
      } catch (fallbackError) {
        console.error('❌ Fallback notification creation failed:', fallbackError)
        toast.error('Failed to send notification - please check your connection')
        throw fallbackError
      }
    } finally {
      setLoading(false)
    }
  }

  // Get notifications for specific tenant
  const getNotificationsForTenant = (tenantId) => {
    const filtered = notifications.filter(notification => {
      const isCommon = notification.type === 'common'
      const isPersonal = notification.type === 'personal' && (
        notification.tenantId === tenantId || 
        notification.tenantId == tenantId ||
        (notification.tenantIds && notification.tenantIds.includes(tenantId))
      )
      return isCommon || isPersonal
    })

    console.log(`🔍 Filtered ${filtered.length} notifications for tenant ${tenantId}`)
    return filtered
  }

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log(`✅ Marking notification ${notificationId} as read`)
      
      const response = await fetch(`${getApiUrl()}/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(n => n.id == notificationId ? { ...n, read: true } : n)
      )
      
      console.log(`✅ Notification ${notificationId} marked as read`)
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      console.log(`🗑️ Deleting notification ${notificationId}`)
      
      const response = await fetch(`${getApiUrl()}/notifications/${notificationId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Update local state immediately
      setNotifications(prev => prev.filter(n => n.id != notificationId))
      
      console.log(`✅ Notification ${notificationId} deleted`)
    } catch (error) {
      console.error('❌ Error deleting notification:', error)
    }
  }

  // Force refresh
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing notifications...')
    await fetchNotifications()
  }

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Adaptive polling based on error count
  useEffect(() => {
    const getPollingInterval = () => {
      if (errorCount === 0) return 3000 // 3 seconds when working
      if (errorCount < 3) return 5000   // 5 seconds with few errors
      return 10000                      // 10 seconds with many errors
    }
    
    const pollInterval = setInterval(() => {
      fetchNotifications()
    }, getPollingInterval())

    return () => clearInterval(pollInterval)
  }, [errorCount])

  // Listen for visibility change to refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible - fetching latest notifications')
        fetchNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    getNotificationsForTenant,
    markAsRead,
    deleteNotification,
    forceRefresh,
    fetchNotifications
  }

  return (
    <ApiNotificationContext.Provider value={value}>
      {children}
    </ApiNotificationContext.Provider>
  )
}

export default ApiNotificationContext