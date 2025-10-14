import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getWebSocketUrl, getApiUrl } from '../utils/api';

const RealTimeNotificationContext = createContext();

export const useRealTimeNotifications = () => {
  const context = useContext(RealTimeNotificationContext);
  if (!context) {
    throw new Error(
      "useRealTimeNotifications must be used within a RealTimeNotificationProvider"
    );
  }
  return context;
};

// Use centralized API configuration
const WS_URL = getWebSocketUrl();
const API_URL = getApiUrl();

// Log configuration for debugging
console.log('🔗 RealTimeNotificationContext Configuration:');
console.log('  WebSocket URL:', WS_URL);
console.log('  API URL:', API_URL);

export const RealTimeNotificationProvider = ({ children }) => {
  // Initialize as empty array instead of undefined
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [ws, setWs] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // WebSocket connection management
  useEffect(() => {
    let websocket = null;
    let reconnectTimeout = null;
    let maxRetries = 3;
    let retryCount = 0;

    const connect = () => {
      try {
        console.log(
          "🔗 [RealTimeContext] Connecting to WebSocket server at",
          WS_URL
        );
        setConnectionStatus("connecting");
        websocket = new WebSocket(WS_URL);

        websocket.onopen = () => {
          console.log("✅ [RealTimeContext] WebSocket connected successfully");
          setConnectionStatus("connected");
          setWs(websocket);
          retryCount = 0;

          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }

          // Request initial notifications immediately after connection
          console.log("📞 [RealTimeContext] Requesting initial notifications");
          // Send a request for initial notifications
          websocket.send(JSON.stringify({ type: "GET_INITIAL_NOTIFICATIONS" }));
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 [RealTimeContext] WebSocket message:", data.type);

            switch (data.type) {
              case "INITIAL_NOTIFICATIONS":
                console.log(
                  `📋 [RealTimeContext] Loading ${
                    data.notifications?.length || 0
                  } initial notifications`
                );
                if (data.notifications && Array.isArray(data.notifications)) {
                  setNotifications(data.notifications);
                  localStorage.setItem(
                    "notifications",
                    JSON.stringify(data.notifications)
                  );
                  setIsInitialized(true);
                  console.log(
                    "✅ [RealTimeContext] Initial notifications set in state"
                  );

                  // Dispatch event for components to know notifications are ready
                  window.dispatchEvent(
                    new CustomEvent("NOTIFICATIONS_READY", {
                      detail: { count: data.notifications.length },
                    })
                  );
                }
                break;

              case "NEW_NOTIFICATION":
                console.log(
                  "🚀 [RealTimeContext] New notification received:",
                  data.notification?.title
                );

                const newNotification = data.notification;
                let updatedNotifications = notifications;

                if (
                  data.allNotifications &&
                  Array.isArray(data.allNotifications)
                ) {
                  updatedNotifications = data.allNotifications;
                  localStorage.setItem(
                    "notifications",
                    JSON.stringify(updatedNotifications)
                  );

                  // Dispatch event for real-time updates
                  window.dispatchEvent(
                    new CustomEvent("NEW_NOTIFICATION_RECEIVED", {
                      detail: newNotification,
                    })
                  );
                } else if (newNotification) {
                  // Add single notification if not already present
                  const exists = notifications.some(
                    (n) => n._id === newNotification._id || n.id === newNotification.id
                  );
                  if (!exists) {
                    updatedNotifications = [newNotification, ...notifications];
                    localStorage.setItem(
                      "notifications",
                      JSON.stringify(updatedNotifications)
                    );

                    // Dispatch event for real-time updates
                    window.dispatchEvent(
                      new CustomEvent("NEW_NOTIFICATION_RECEIVED", {
                        detail: newNotification,
                      })
                    );
                  }
                }

                setNotifications(updatedNotifications);

                if (newNotification && !newNotification.read) {
                  toast.success(
                    `New notification: ${newNotification.title}`,
                    {
                      duration: 4000,
                      icon: "🔔",
                    }
                  );
                }
                break;

              case "NOTIFICATION_DELETED":
                console.log(
                  "🗑️ Real-time notification deleted:",
                  data.deletedId
                );
                if (
                  data.allNotifications &&
                  Array.isArray(data.allNotifications)
                ) {
                  setNotifications(data.allNotifications);
                  localStorage.setItem(
                    "notifications",
                    JSON.stringify(data.allNotifications)
                  );
                }
                break;

              case "OWNER_PROFILE_UPDATED":
                console.log(
                  "🔄 Owner profile updated:",
                  data.profileData?.name
                );
                window.dispatchEvent(
                  new CustomEvent("ownerProfileUpdated", {
                    detail: data.profileData,
                  })
                );
                break;

              case "TENANT_PROFILE_UPDATED":
                console.log(
                  "🔄 Tenant profile updated:",
                  data.profileData?.name
                );
                window.dispatchEvent(
                  new CustomEvent("tenantProfileUpdated", {
                    detail: data.profileData,
                  })
                );
                break;

              case "ROOM_CREATED":
                console.log("🏠 New room created:", data.room);
                // Dispatch event for room creation
                window.dispatchEvent(
                  new CustomEvent("roomCreated", {
                    detail: data.room,
                  })
                );

                // Also trigger notification refresh
                if (
                  data.allNotifications &&
                  Array.isArray(data.allNotifications)
                ) {
                  setNotifications(data.allNotifications);
                }
                break;

              default:
                console.log("📨 Unknown message type:", data.type);
            }
          } catch (error) {
            console.error("❌ Error parsing WebSocket message:", error);
          }
        };

        websocket.onclose = (event) => {
          console.log(
            "🔌 [RealTimeContext] WebSocket disconnected:",
            event.code,
            event.reason
          );
          setConnectionStatus("disconnected");
          setWs(null);

          if (event.code !== 1000 && !reconnectTimeout) {
            retryCount++;
            console.log(
              `🔄 [RealTimeContext] Auto-reconnecting... (attempt ${retryCount})`
            );
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              connect();
            }, Math.min(1000 * retryCount, 10000));
          }
        };

        websocket.onerror = (error) => {
          console.error("❌ WebSocket error:", error);
          setConnectionStatus("error");
        };
      } catch (error) {
        console.error("❌ Failed to create WebSocket connection:", error);
        setConnectionStatus("error");
        retryCount++;

        // Fallback to localStorage immediately
        loadFromLocalStorage();

        if (retryCount < maxRetries && !reconnectTimeout) {
          console.log(
            `🔄 Retrying connection... (${retryCount}/${maxRetries})`
          );
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        } else {
          console.log(
            "⚠️ WebSocket server unavailable. Using offline mode only."
          );
          setConnectionStatus("offline");
        }
      }
    };

    // Load from localStorage and API immediately to prevent blank pages
    const initializeNotifications = async () => {
      console.log("🚀 [RealTimeContext] Initializing notifications...");

      // Try API first for most up-to-date data
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(
            `🌍 [RealTimeContext] Loaded ${
              data.notifications?.length || 0
            } notifications from API`
          );
          if (data.notifications && Array.isArray(data.notifications)) {
            setNotifications(data.notifications);
            localStorage.setItem(
              "notifications",
              JSON.stringify(data.notifications)
            );
            setIsInitialized(true);

            // Dispatch ready event
            window.dispatchEvent(
              new CustomEvent("NOTIFICATIONS_READY", {
                detail: { count: data.notifications.length, source: "api" },
              })
            );
          }
          return;
        }
      } catch (apiError) {
        console.log(
          "📞 [RealTimeContext] API not available, falling back to localStorage:",
          apiError.message
        );
      }

      // Fallback to localStorage if API fails
      loadFromLocalStorage();
    };

    // Initialize notifications first, then WebSocket
    initializeNotifications().then(() => {
      console.log(
        "✅ [RealTimeContext] Initial notifications loaded, starting WebSocket..."
      );
      connect();
    });
    
    // Listen for logout events to clean up notifications
    const handleLogout = () => {
      console.log('🚪 [RealTimeContext] User logged out - clearing notifications');
      setNotifications([]);
      setUnreadCount(0);
      setIsInitialized(false);
      setConnectionStatus('disconnected');
      
      // Close WebSocket connection
      if (websocket) {
        websocket.close(1000, 'User logged out');
      }
      
      // Clear notifications from localStorage
      localStorage.removeItem('notifications');
    };
    
    window.addEventListener('userLoggedOut', handleLogout);

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        websocket.close(1000, "Component unmounted");
      }
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  // Fallback to localStorage when WebSocket isn't available
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("notifications");
      if (stored) {
        const localNotifications = JSON.parse(stored);
        console.log(
          `💾 Loaded ${localNotifications.length} notifications from localStorage`
        );
        setNotifications(localNotifications);
        setIsInitialized(true);

        window.dispatchEvent(
          new CustomEvent("NOTIFICATIONS_READY", {
            detail: {
              count: localNotifications.length,
              source: "localStorage",
            },
          })
        );
      } else {
        // Even if no stored notifications, mark as initialized
        setIsInitialized(true);
        window.dispatchEvent(
          new CustomEvent("NOTIFICATIONS_READY", {
            detail: { count: 0, source: "empty" },
          })
        );
      }
    } catch (error) {
      console.error("❌ Error loading from localStorage:", error);
      setIsInitialized(true); // Still mark as initialized to prevent hanging
    }
  };

  // Add new notification
  const addNotification = async (notificationData) => {
    setLoading(true);
    try {
      console.log("🚀 Adding notification via API:", notificationData);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(
        `✅ Notification sent to ${result.broadcastedTo} clients via WebSocket`
      );

      toast.success(`Notification sent: ${result.notification.title}`, {
        duration: 3000,
        icon: "✅",
      });

      return result.notification;
    } catch (error) {
      console.warn(
        "⚠️ API failed, using localStorage fallback:",
        error.message
      );

      // Fallback to localStorage if API fails
      try {
        const newNotification = {
          id: Date.now() + Math.random(),
          ...notificationData,
          timestamp: Date.now(),
          date: new Date().toISOString(),
          read: false,
          author: notificationData.author || "Building Management",
        };

        const current = JSON.parse(
          localStorage.getItem("notifications") || "[]"
        );
        const updated = [newNotification, ...current];
        localStorage.setItem("notifications", JSON.stringify(updated));

        setNotifications(updated);

        toast.success(
          `Notification sent: ${newNotification.title} (offline mode)`,
          {
            duration: 3000,
            icon: "✅",
          }
        );

        return newNotification;
      } catch (fallbackError) {
        console.error("❌ Fallback failed:", fallbackError);
        toast.error("Failed to send notification");
        throw fallbackError;
      }
    } finally {
      setLoading(false);
    }
  };

  // Get notifications for specific tenant
  const getNotificationsForTenant = (tenantId) => {
    if (!tenantId) {
      console.log("🔍 [Context] No tenantId provided, returning empty array");
      return [];
    }

    // Add safety check for notifications array
    if (!Array.isArray(notifications)) {
      console.warn(
        "🔍 [Context] Notifications is not an array, returning empty array"
      );
      return [];
    }

    const filtered = notifications.filter((notification) => {
      // Common notifications visible to all tenants
      if (notification.type === "common" || notification.type === "general") {
        return true;
      }

      // Personal notifications only for specific tenant
      if (notification.type === "personal") {
        // Check if this tenant is in the recipients array
        if (notification.recipients && Array.isArray(notification.recipients)) {
          return notification.recipients.some((recipient) => {
            // Handle both ObjectId and string comparisons
            const recipientTenantId =
              recipient.tenant?._id || recipient.tenant || recipient.tenantId;
            return (
              recipientTenantId &&
              recipientTenantId.toString() === tenantId.toString()
            );
          });
        }

        // Fallback: check for legacy tenantId or tenantIds fields
        return (
          notification.tenantId == tenantId ||
          (notification.tenantIds && notification.tenantIds.includes(tenantId))
        );
      }

      return false;
    });

    console.log(
      `🔍 [Context] Filtered ${filtered.length}/${notifications.length} notifications for tenant ${tenantId}`
    );
    return filtered;
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      console.log(`✅ Marking notification ${notificationId} as read`);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Update local state immediately
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId || n.id === notificationId
              ? { ...n, read: true }
              : n
          )
        );

        // Also update in recipients array if exists
        setNotifications((prev) =>
          prev.map((notification) => {
            if (
              notification.recipients &&
              Array.isArray(notification.recipients)
            ) {
              const updatedRecipients = notification.recipients.map(
                (recipient) => {
                  const recipientTenantId =
                    recipient.tenant?._id ||
                    recipient.tenant ||
                    recipient.tenantId;
                  if (
                    recipientTenantId &&
                    recipientTenantId.toString() === user?.id?.toString()
                  ) {
                    return { ...recipient, read: true };
                  }
                  return recipient;
                }
              );
              return { ...notification, recipients: updatedRecipients };
            }
            return notification;
          })
        );

        return true;
      } else {
        console.error("Failed to mark as read via API");
        return false;
      }
    } catch (error) {
      console.error("❌ Error marking as read:", error);
      // Update local state anyway for immediate UI feedback
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, read: true }
            : n
        )
      );
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      console.log(
        `🗑️ [RealTimeContext] Deleting notification ${notificationId}`
      );

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        console.log(
          "✅ [RealTimeContext] Notification deleted successfully via API"
        );
        const updatedNotifications = notifications.filter(
          (n) => n._id !== notificationId && n.id !== notificationId
        );
        setNotifications(updatedNotifications);
        localStorage.setItem(
          "notifications",
          JSON.stringify(updatedNotifications)
        );
        return true;
      } else {
        console.error("Failed to delete via API");
        return false;
      }
    } catch (error) {
      console.error("❌ [RealTimeContext] Error deleting notification:", error);
      return false;
    }
  };

  // Force refresh
  const forceRefresh = async () => {
    console.log("🔄 Force refreshing notifications...");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          localStorage.setItem(
            "notifications",
            JSON.stringify(data.notifications)
          );
          console.log("✅ Notifications refreshed from API");
        }
      }
    } catch (error) {
      console.error("❌ Error refreshing notifications:", error);
      loadFromLocalStorage();
    }
  };

  // Get unread count for a specific tenant
  const getUnreadCountForTenant = (tenantId) => {
    if (!tenantId) return 0;

    const tenantNotifications = getNotificationsForTenant(tenantId);
    const unreadForTenant = tenantNotifications.filter((notification) => {
      // For notifications with recipients array, check read status within the recipient object
      if (notification.recipients && Array.isArray(notification.recipients)) {
        const recipientInfo = notification.recipients.find((recipient) => {
          const recipientTenantId =
            recipient.tenant?._id || recipient.tenant || recipient.tenantId;
          return (
            recipientTenantId &&
            recipientTenantId.toString() === tenantId.toString()
          );
        });
        // If found in recipients, check the recipient-specific read status
        return recipientInfo ? !recipientInfo.read : false;
      }
      // Fallback to global read status for legacy notifications
      return !notification.read;
    });

    return unreadForTenant.length;
  };

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = Array.isArray(notifications)
      ? notifications.filter((n) => !n.read).length
      : 0;
    setUnreadCount(count);
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    connectionStatus,
    isInitialized,
    addNotification,
    getNotificationsForTenant,
    getUnreadCountForTenant,
    markAsRead,
    deleteNotification,
    forceRefresh,
  };

  return (
    <RealTimeNotificationContext.Provider value={value}>
      {children}
    </RealTimeNotificationContext.Provider>
  );
};

export default RealTimeNotificationContext;
