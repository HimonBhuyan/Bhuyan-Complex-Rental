import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { getApiUrl } from '../utils/api'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Global notification state for immediate updates
let globalNotifications = []
let globalNotificationListeners = []

// Expose to window for debugging
if (typeof window !== 'undefined') {
  window.globalNotifications = globalNotifications
  window.globalNotificationListeners = globalNotificationListeners
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  // Register this component as a listener for global updates
  useEffect(() => {
    const updateListener = (newNotifications) => {
      console.log('🔄 Global state updated, refreshing component:', newNotifications)
      setNotifications([...newNotifications])
      setRefreshTrigger(prev => prev + 1)
    }
    
    const handleCrossTabUpdate = (event) => {
      console.log('🔄 Received cross-tab notification update:', event.detail)
      const { notifications: newNotifications } = event.detail
      globalNotifications = [...newNotifications]
      setNotifications([...newNotifications])
      setRefreshTrigger(prev => prev + 1)
    }
    
    globalNotificationListeners.push(updateListener)
    window.addEventListener('globalNotificationUpdate', handleCrossTabUpdate)
    
    // Initial load from global state
    if (globalNotifications.length > 0) {
      setNotifications([...globalNotifications])
    }
    
    return () => {
      globalNotificationListeners = globalNotificationListeners.filter(listener => listener !== updateListener)
      window.removeEventListener('globalNotificationUpdate', handleCrossTabUpdate)
    }
  }, [])

  // Aggressive polling for cross-browser real-time sync
  useEffect(() => {
    const aggressivePoll = setInterval(() => {
      try {
        // First check localStorage
        const savedNotifications = localStorage.getItem('notifications')
        if (savedNotifications) {
          const parsedNotifications = JSON.parse(savedNotifications)
          
          // Always update if there's a difference
          const isDifferent = JSON.stringify(parsedNotifications) !== JSON.stringify(notifications)
          
          if (isDifferent) {
            console.log('🚀 Aggressive polling detected changes - updating all states')
            console.log('Previous notifications:', notifications)
            console.log('New notifications from localStorage:', parsedNotifications)
            
            // Update global state
            globalNotifications = [...parsedNotifications]
            
            // Force component update
            setNotifications([...parsedNotifications])
            setRefreshTrigger(prev => prev + 1)
            
            // Update window object for debugging
            if (typeof window !== 'undefined') {
              window.globalNotifications = globalNotifications
            }
            
            // Notify all listeners immediately
            globalNotificationListeners.forEach((listener, index) => {
              try {
                console.log(`📢 Polling notifying listener ${index + 1}`)
                listener(globalNotifications)
              } catch (error) {
                console.error('❌ Error in aggressive poll listener:', error)
              }
            })
            
            console.log('✅ Aggressive polling update complete')
          }
        }
        
        // Try to fetch from the notification API for cross-browser sync
        fetch(`${getApiUrl()}/notifications`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('API not available')
        })
        .then(data => {
          const apiNotifications = data.notifications || []
          if (Array.isArray(apiNotifications) && apiNotifications.length > 0) {
            // Check if API has newer notifications
            if (apiNotifications.length !== globalNotifications.length ||
                (apiNotifications.length > 0 && globalNotifications.length > 0 && 
                 apiNotifications[0]?.id !== globalNotifications[0]?.id)) {
              
              console.log('🌍 API polling detected new notifications from another browser!')
              globalNotifications = [...apiNotifications]
              setNotifications([...apiNotifications])
              setRefreshTrigger(prev => prev + 1)
              
              // Also update localStorage so all tabs in this browser get updated
              localStorage.setItem('notifications', JSON.stringify(apiNotifications))
              
              // Show toast for cross-browser notification
              toast.success('New notification received!', {
                duration: 3000,
                icon: '🔔'
              })
            }
          }
        })
        .catch(error => {
          // Silently ignore API errors - localStorage is primary
          console.log('📞 API not available, using localStorage only')
        })
        
      } catch (error) {
        console.error('❌ Aggressive polling error:', error)
      }
    }, 1000) // Poll every 1 second for maximum responsiveness

    return () => clearInterval(aggressivePoll)
  }, [notifications]) // Add notifications as dependency so polling compares with latest state

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
    console.log('🔔 Updated unread count:', count)
  }, [notifications, refreshTrigger])

  // Add a new notification using global state
  const addNotification = (notificationData) => {
    console.log('🚀 [NotificationContext] Adding notification:', notificationData)
    console.log('🚀 [NotificationContext] Input type:', typeof notificationData.type, 'value:', notificationData.type)
    console.log('🚀 [NotificationContext] Input tenantId:', typeof notificationData.tenantId, 'value:', notificationData.tenantId)
    
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notificationData,
      date: new Date().toISOString().split('T')[0],
      read: false,
      author: 'Building Owner'
    }

    console.log('🔔 [NotificationContext] Created notification object:', newNotification)
    console.log('🔔 [NotificationContext] Final type:', typeof newNotification.type, 'value:', newNotification.type)
    console.log('🔔 [NotificationContext] Final tenantId:', typeof newNotification.tenantId, 'value:', newNotification.tenantId)

    // Update global state first
    globalNotifications = [newNotification, ...globalNotifications]
    
    // Update window object for debugging
    if (typeof window !== 'undefined') {
      window.globalNotifications = globalNotifications
    }
    
    console.log('🌎 Updated global notifications:', globalNotifications)

    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(globalNotifications))
    
    // Also try to save to API for cross-browser sync
    try {
      fetch(`${getApiUrl()}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification)
      })
      .then(response => {
        if (response.ok) {
          console.log('✅ Notification also saved to API for cross-browser sync')
        }
      })
      .catch(error => {
        console.log('📞 API save failed, localStorage only:', error.message)
      })
    } catch (error) {
      console.log('📞 API not available for cross-browser sync')
    }

    // Notify all listeners immediately
    console.log('📢 Notifying', globalNotificationListeners.length, 'listeners with updated notifications')
    globalNotificationListeners.forEach((listener, index) => {
      try {
        console.log(`📢 Calling listener ${index + 1}/${globalNotificationListeners.length}`)
        listener(globalNotifications)
      } catch (error) {
        console.error(`❌ Error updating listener ${index + 1}:`, error)
      }
    })
    
    // Also dispatch a custom event for cross-tab communication
    console.log('📢 Dispatching custom event for cross-tab communication')
    window.dispatchEvent(new CustomEvent('globalNotificationUpdate', {
      detail: { notifications: globalNotifications }
    }))

    // Show toast for sender
    toast.success(`Notification sent: ${newNotification.title}`, {
      duration: 3000,
      icon: '✅',
    })

    // Show toast for receivers after a brief delay
    setTimeout(() => {
      toast.success(`New notification: ${newNotification.title}`, {
        duration: 4000,
        icon: '🔔',
      })
    }, 500)

    console.log('🚀 Notification added and broadcast complete')
    return newNotification
  }

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
      // Update localStorage with the new state
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }))
      localStorage.setItem('notifications', JSON.stringify(updated))
      return updated
    })
  }

  // Get notifications for a specific tenant
  const getNotificationsForTenant = (tenantId) => {
    console.log(`🔍 [Filter Debug] Input tenantId: ${tenantId} (type: ${typeof tenantId})`)
    console.log(`🔍 [Filter Debug] All notifications:`, notifications)
    
    const filtered = notifications.filter(notification => {
      const isCommon = notification.type === 'common'
      const isPersonalMatch = notification.tenantId === tenantId
      const isPersonalMatchString = notification.tenantId == tenantId // Loose equality check
      
      console.log(`🔍 [Filter Debug] Notification ${notification.id}:`, {
        notificationTenantId: notification.tenantId,
        notificationTenantIdType: typeof notification.tenantId,
        inputTenantId: tenantId,
        inputTenantIdType: typeof tenantId,
        type: notification.type,
        isCommon,
        isPersonalMatch,
        isPersonalMatchString,
        willInclude: isCommon || isPersonalMatch || isPersonalMatchString
      })
      
      return isCommon || isPersonalMatch || isPersonalMatchString
    })
    
    console.log(`👥 Getting notifications for tenant ${tenantId}:`, {
      allNotifications: notifications,
      filteredNotifications: filtered,
      tenantId,
      resultCount: filtered.length
    })
    return filtered
  }

  // Get unread notifications for a specific tenant
  const getUnreadNotificationsForTenant = (tenantId) => {
    return notifications.filter(notification => 
      !notification.read && (notification.type === 'common' || notification.tenantId === tenantId)
    )
  }

  // Delete notification with real-time synchronization
  const deleteNotification = (notificationId) => {
    console.log(`🗑️ [NotificationContext] Deleting notification: ${notificationId}`)
    
    // Find the notification being deleted for logging
    const deletedNotification = globalNotifications.find(n => n.id === notificationId)
    if (deletedNotification) {
      console.log(`🗑️ [NotificationContext] Deleting: "${deletedNotification.title}"`)
    }
    
    // Update global state first
    globalNotifications = globalNotifications.filter(n => n.id !== notificationId)
    
    // Update window object for debugging
    if (typeof window !== 'undefined') {
      window.globalNotifications = globalNotifications
    }
    
    console.log(`🌎 [NotificationContext] Updated global notifications:`, globalNotifications.length, 'remaining')
    
    // Update local state and localStorage
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId)
      localStorage.setItem('notifications', JSON.stringify(updated))
      console.log(`💾 [NotificationContext] Updated localStorage with ${updated.length} notifications`)
      return updated
    })
    
    // Delete from API for cross-browser sync
    try {
      fetch(`${getApiUrl()}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => {
        if (response.ok) {
          console.log('✅ [NotificationContext] Notification deleted from API for cross-browser sync')
        } else {
          console.log('⚠️ [NotificationContext] API delete failed, localStorage updated')
        }
      })
      .catch(error => {
        console.log('📞 [NotificationContext] API not available for delete sync:', error.message)
      })
    } catch (error) {
      console.log('📞 [NotificationContext] API not available for cross-browser delete sync')
    }
    
    // Notify all listeners immediately
    console.log(`📢 [NotificationContext] Notifying ${globalNotificationListeners.length} listeners about deletion`)
    globalNotificationListeners.forEach((listener, index) => {
      try {
        console.log(`📢 [NotificationContext] Notifying listener ${index + 1}/${globalNotificationListeners.length} about deletion`)
        listener(globalNotifications)
      } catch (error) {
        console.error(`❌ [NotificationContext] Error updating listener ${index + 1} on delete:`, error)
      }
    })
    
    // Dispatch custom event for cross-tab communication
    console.log('📢 [NotificationContext] Dispatching delete event for cross-tab communication')
    window.dispatchEvent(new CustomEvent('globalNotificationUpdate', {
      detail: { 
        notifications: globalNotifications,
        action: 'delete',
        deletedId: notificationId
      }
    }))
    
    // Show success toast
    if (deletedNotification) {
      toast.success(`Notification deleted: ${deletedNotification.title}`, {
        duration: 2000,
        icon: '🗑️',
      })
    } else {
      toast.success('Notification deleted successfully', {
        duration: 2000,
        icon: '✅',
      })
    }
    
    console.log('🚀 [NotificationContext] Notification deletion and broadcast complete')
  }

  // Load notifications from localStorage on mount and sync with global state
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications')
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications)
        // Update global state
        globalNotifications = [...parsedNotifications]
        setNotifications([...parsedNotifications])
        console.log('📋 Loaded notifications from localStorage:', parsedNotifications)
      } catch (error) {
        console.error('❌ Error loading notifications from localStorage:', error)
      }
    }
  }, [])

  // Listen for window focus and visibility change for immediate updates
  useEffect(() => {
    const handleFocus = () => {
      console.log('👁️ Window focused - checking for new notifications')
      forceRefresh()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible - checking for new notifications')
        forceRefresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Enhanced force refresh function for cross-browser sync
  const forceRefresh = () => {
    console.log('🔄 Force refreshing notifications...')
    
    try {
      // Always check localStorage first (source of truth for cross-browser)
      const saved = localStorage.getItem('notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        
        // Check if localStorage has newer data than global state
        const hasNewData = parsed.length !== globalNotifications.length ||
                           (parsed.length > 0 && globalNotifications.length > 0 && 
                            parsed[0]?.id !== globalNotifications[0]?.id)
        
        if (hasNewData) {
          console.log('🚀 Found newer notifications in localStorage, updating...')
          globalNotifications = [...parsed]
          setNotifications([...parsed])
          setRefreshTrigger(prev => prev + 1)
          
          // Update window object for debugging
          if (typeof window !== 'undefined') {
            window.globalNotifications = globalNotifications
          }
          
          // Show toast for new notifications found
          const newNotifications = parsed.filter(n => !n.read)
          if (newNotifications.length > 0) {
            console.log(`🔔 Found ${newNotifications.length} new notifications`)
          }
        } else {
          console.log('🔄 No new notifications found')
          setRefreshTrigger(prev => prev + 1) // Still trigger re-render
        }
      } else {
        console.log('🔄 No notifications in localStorage')
        globalNotifications = []
        setNotifications([])
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('❌ Error in forceRefresh:', error)
    }
  }

  // Debug function to show global state
  const showDebugInfo = () => {
    console.log('🔍 DEBUG INFO:')
    console.log('Global notifications:', globalNotifications)
    console.log('Global listeners count:', globalNotificationListeners.length)
    console.log('Local notifications:', notifications)
    console.log('LocalStorage notifications:', JSON.parse(localStorage.getItem('notifications') || '[]'))
  }

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    getNotificationsForTenant,
    getUnreadNotificationsForTenant,
    deleteNotification,
    setNotifications,
    forceRefresh,
    refreshTrigger,
    showDebugInfo
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext