import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

const SimpleNotificationContext = createContext()

export const useSimpleNotifications = () => {
  const context = useContext(SimpleNotificationContext)
  if (!context) {
    throw new Error('useSimpleNotifications must be used within a SimpleNotificationProvider')
  }
  return context
}

export const SimpleNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  // Load notifications from localStorage
  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('simpleNotifications')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
    return []
  }

  // Save notifications to localStorage
  const saveNotifications = (notifs) => {
    try {
      localStorage.setItem('simpleNotifications', JSON.stringify(notifs))
      localStorage.setItem('simpleNotificationsLastUpdate', Date.now().toString())
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  // Add new notification
  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notificationData,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      read: false,
      author: 'Building Management'
    }

    // Update state
    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      saveNotifications(updated)
      return updated
    })

    // Show success toast
    toast.success(`Notification sent: ${newNotification.title}`)

    // Try to trigger cross-browser sync by making a simple HTTP request
    // This will help with cross-browser communication
    try {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      }).catch(() => {
        // Ignore errors - this is just for triggering sync
      })
    } catch (error) {
      // Ignore errors - this is optional
    }

    return newNotification
  }

  // Get notifications for specific tenant
  const getNotificationsForTenant = (tenantId) => {
    return notifications.filter(notification => {
      const isCommon = notification.type === 'common'
      const isPersonal = notification.type === 'personal' && (
        notification.tenantId === tenantId || 
        notification.tenantId == tenantId
      )
      return isCommon || isPersonal
    })
  }

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId)
      saveNotifications(updated)
      return updated
    })
  }

  // Mark as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      saveNotifications(updated)
      return updated
    })
  }

  // Force refresh from localStorage
  const forceRefresh = () => {
    const fresh = loadNotifications()
    setNotifications(fresh)
  }


  // Initial load
  useEffect(() => {
    const initial = loadNotifications()
    setNotifications(initial)
  }, [])

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'simpleNotifications') {
        forceRefresh()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value = {
    notifications,
    addNotification,
    getNotificationsForTenant,
    deleteNotification,
    markAsRead,
    forceRefresh,
    unreadCount: notifications.filter(n => !n.read).length
  }

  return (
    <SimpleNotificationContext.Provider value={value}>
      {children}
    </SimpleNotificationContext.Provider>
  )
}

export default SimpleNotificationContext