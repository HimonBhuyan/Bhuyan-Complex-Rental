import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useUser } from '../../context/UserContext'
import { useRealTimeNotifications } from '../../context/RealTimeNotificationContext'
import { 
  User, 
  CreditCard, 
  Bell, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Receipt,
  Edit,
  Settings
} from 'lucide-react'
import { 
  getBillsByTenantId, 
  getNotificationsByTenantId, 
  getPaymentHistoryByTenantId 
} from '../../data/mockData'
import SlidingNavbar from '../SlidingNavbar'
import Modal from '../Modal'
import './TenantDashboard.css'

const TenantDashboard = ({ onLogout }) => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { getNotificationsForTenant, markAsRead, unreadCount, forceRefresh, notifications: allNotifications, connectionStatus } = useRealTimeNotifications()
  const [bills, setBills] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null })
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  
  // Get filtered notifications for this tenant from WebSocket context
  const tenantNotifications = getNotificationsForTenant(user.id)

  useEffect(() => {
    // Load tenant data
    const loadData = async () => {
      try {
        const tenantBills = getBillsByTenantId(user.id)
        const tenantPayments = getPaymentHistoryByTenantId(user.id)
        
        setBills(tenantBills)
        setPaymentHistory(tenantPayments)
      } catch (error) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user.id])

  // WebSocket handles real-time updates automatically

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-section')) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  const handlePayBill = async (billId) => {
    setLoading(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update bill status
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === billId 
            ? { ...bill, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }
            : bill
        )
      )
      
      toast.success('Payment processed successfully!')
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = (notification) => {
    const notificationId = notification._id || notification.id
    console.log('✅ [TenantDashboard] Marking notification as read:', notificationId)
    markAsRead(notificationId)
  }

  // Helper function to render notifications
  const renderNotifications = () => {
    if (tenantNotifications.length === 0) {
      return (
        <div className="empty-notifications">
          <Bell size={32} />
          <p>No notifications yet</p>
          <small>You'll see important updates from building management here</small>
        </div>
      )
    }
    
    return tenantNotifications.slice(0, 5).map(notification => (
      <div key={notification._id || notification.id} className={`notification-item notification-${notification.category || 'info'}`}>
        <div className="notification-text">
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          {notification.priority && (
            <small className={`priority-tag ${notification.priority}`}>
              {notification.priority.toUpperCase()}
            </small>
          )}
        </div>
        <div className="notification-date">
          {new Date(notification.createdAt || notification.date || Date.now()).toLocaleDateString()}
        </div>
      </div>
    ))
  }

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.classList.toggle('dark', !isDarkTheme)
  }

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="status-icon status-paid-icon" size={16} />
      case 'pending':
        return <Clock className="status-icon status-pending-icon" size={16} />
      case 'overdue':
        return <AlertCircle className="status-icon status-overdue-icon" size={16} />
      default:
        return null
    }
  }

  if (loading && bills.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className={`tenant-dashboard ${isDarkTheme ? 'dark' : ''}`}>
      <SlidingNavbar 
        user={user}
        onLogout={onLogout} 
        onThemeToggle={handleThemeToggle}
        isDarkTheme={isDarkTheme}
      />
      
      <div className="main-content">
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1>Client Panel</h1>
          </div>
          <div className="profile-section" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="profile-photo">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <User size={24} />
              )}
            </div>
            <span>{user.name}</span>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); navigate('/tenant/profile'); setShowProfileDropdown(false); }}>
                  <Settings size={16} />
                  <span>My Profile</span>
                </div>
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); openModal('changeProfilePhoto'); setShowProfileDropdown(false); }}>
                  <User size={16} />
                  <span>Change Photo</span>
                </div>
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); openModal('viewProfile'); setShowProfileDropdown(false); }}>
                  <Eye size={16} />
                  <span>View Profile</span>
                </div>
                <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); openModal('editProfile'); setShowProfileDropdown(false); }}>
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="main-cards">
            <div className="card-section">
              <div className="action-card" onClick={() => openModal('viewBalance')}>
                <Eye size={24} />
                <span>View Balance</span>
              </div>
              <div className="action-card" onClick={() => openModal('payBills')}>
                <CreditCard size={24} />
                <span>Pay Bills</span>
              </div>
            </div>
            
            <div className="card-section">
              <div className="action-card single-card" onClick={() => openModal('viewPreviousBills')}>
                <Receipt size={24} />
                <span>View Previous Bills</span>
              </div>
            </div>
          </div>
          
          <div className="notifications-panel">
            <div className="notifications-header">
            <div className="notifications-title">
                <h3>Important Notifications!!</h3>
                <div className="notification-bell">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </div>
              </div>
              <p>(Real-time notifications from building management)</p>
            </div>
            <div className="notifications-content">
              {renderNotifications()}
            </div>
          </div>

        </div>
      </div>
      
      <Modal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        data={modalState.data}
      />
    </div>
  )
}

export default TenantDashboard