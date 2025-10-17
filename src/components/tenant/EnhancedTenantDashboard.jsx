import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useUser } from '../../context/UserContext'
import { useRealTimeNotifications } from '../../context/RealTimeNotificationContext'
import { getApiUrl } from '../../utils/api'
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
  Settings,
  Home,
  Zap,
  Droplets,
  Building,
  Calendar,
  Upload,
  Download,
  ArrowUp,
  ArrowDown,
  FileText,
  Camera
} from 'lucide-react'
import SlidingNavbar from '../SlidingNavbar'
import './TenantDashboard.css'

const EnhancedTenantDashboard = ({ onLogout }) => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { notifications: allNotifications, connectionStatus, unreadCount } = useRealTimeNotifications()
  const [dashboardData, setDashboardData] = useState(null)
  const [currentBills, setCurrentBills] = useState([])
  const [previousBills, setPreviousBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [user.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Load dashboard data
      const dashboardResponse = await fetch(`${getApiUrl()}/tenant/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json()
        setDashboardData(dashboardResult)
      }

      // Load current bills
      const billsResponse = await fetch(`${getApiUrl()}/tenant/bills?status=pending,overdue`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (billsResponse.ok) {
        const billsResult = await billsResponse.json()
        setCurrentBills(billsResult.bills || [])
      }

      // Load previous bills
      const previousResponse = await fetch(`${getApiUrl()}/tenant/previous-bills`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (previousResponse.ok) {
        const previousResult = await previousResponse.json()
        setPreviousBills(previousResult.bills || [])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const ensureRazorpayLoaded = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true));
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay script')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.head.appendChild(script);
    });
  };

  const handlePayBill = async (bill) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          billId: bill._id,
          amount: Math.round((bill.totalAmount || 0) + (bill.penalty?.amount || 0))
        })
      })

      const orderData = await response.json()
      if (!response.ok || !orderData.success) {
        toast.error(orderData?.message || 'Failed to create payment order')
        console.error('Create-order failed:', orderData)
        return
      }

      try {
        await ensureRazorpayLoaded()
      } catch (e) {
        toast.error('Unable to load Razorpay. Please check your internet and try again.')
        console.error(e)
        return
      }

      if (!window.Razorpay) {
        toast.error('Razorpay SDK unavailable. Please refresh and try again.')
        return
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RQT7cZB747ePSF',
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Rental Management',
        description: `Bill Payment - ${bill.billNumber}`,
        order_id: orderData.order.id,
        method: { upi: true, card: true, netbanking: true, wallet: true },
        upi: { flow: 'collect' },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI',
                instruments: [
                  { method: 'upi' },
                  { method: 'upi', flows: ['qr'] }
                ]
              }
            },
            sequence: ['block.upi', 'block.card', 'block.netbanking', 'block.wallet'],
            preferences: { show_default_blocks: true }
          }
        },
        handler: async (response) => {
          await handlePaymentSuccess(bill, response)
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: '#3399cc'
        }
      }

      try {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } catch (e) {
        console.error('Failed to open Razorpay checkout:', e)
        toast.error('Could not open Razorpay checkout.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
    }
  }

  const handlePaymentSuccess = async (bill, razorpayResponse) => {
    try {
      const token = localStorage.getItem('token')
      const verifyResponse = await fetch(`${getApiUrl()}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          billId: bill._id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          screenshot: paymentScreenshot
        })
      })

      if (verifyResponse.ok) {
        toast.success('Payment successful!')
        setActiveModal('paymentSuccess')
        setSelectedBill(bill)
        loadDashboardData() // Refresh data
      } else {
        toast.error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast.error('Payment verification failed')
    }
  }

  const handleScreenshotUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPaymentScreenshot(e.target.result)
        toast.success('Screenshot uploaded successfully!')
      }
      reader.readAsDataURL(file)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'overdue': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />
      case 'pending': return <Clock size={16} />
      case 'overdue': return <AlertCircle size={16} />
      default: return <Clock size={16} />
    }
  }

  const formatCurrency = (amount) => `₹${amount.toLocaleString()}`

  const handleDownloadPDF = async (bill) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/tenant/bills/${bill._id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Invoice_${bill.billNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('PDF downloaded successfully!')
      } else {
        toast.error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('PDF download error:', error)
      toast.error('Failed to download PDF')
    }
  }

  if (loading) {
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
        onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
        isDarkTheme={isDarkTheme}
      />
      
      <div className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1>Tenant Dashboard</h1>
            <p>Welcome back, {user.name}!</p>
          </div>
          <div className="profile-section" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
            <div className="profile-photo">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
            <span>{user.name}</span>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={() => navigate('/tenant/profile')}>
                  <Settings size={16} />
                  <span>My Profile</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon balance">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <h3>Current Balance</h3>
              <p className="stat-value">
                {formatCurrency(dashboardData?.tenant?.securityDepositPaid || 0)}
              </p>
              <span className="stat-label">Security Deposit</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <Receipt size={24} />
            </div>
            <div className="stat-content">
              <h3>Pending Bills</h3>
              <p className="stat-value">{currentBills.length}</p>
              <span className="stat-label">Outstanding</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon room">
              <Home size={24} />
            </div>
            <div className="stat-content">
              <h3>Room Details</h3>
              <p className="stat-value">
                {dashboardData?.tenant?.room?.roomNumber || 'N/A'}
              </p>
              <span className="stat-label">{dashboardData?.tenant?.room?.type}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon notifications">
              <Bell size={24} />
            </div>
            <div className="stat-content">
              <h3>Notifications</h3>
              <p className="stat-value">{unreadCount}</p>
              <span className="stat-label">Unread</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Current Bills Section */}
          <div className="section current-bills">
            <div className="section-header">
              <h3>
                <Receipt size={20} />
                Current Bills
              </h3>
              <button 
                className="btn btn-outline"
                onClick={() => setActiveModal('payBills')}
              >
                Pay Bills
              </button>
            </div>
            
            <div className="bills-list">
              {currentBills.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={48} />
                  <h4>All Caught Up!</h4>
                  <p>You have no pending bills.</p>
                </div>
              ) : (
                currentBills.map(bill => (
                  <div key={bill._id} className={`bill-card ${bill.status}`}>
                    <div className="bill-header">
                      <div className="bill-period">
                        <Calendar size={16} />
                        <span>{bill.monthName} {bill.year}</span>
                      </div>
                      <div className="bill-status">
                        {getStatusIcon(bill.status)}
                        <span>{bill.status?.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="bill-breakdown">
                      <div className="breakdown-item">
                        <span>Rent:</span>
                        <span>{formatCurrency(bill.items?.rent?.amount || 0)}</span>
                      </div>
                      {bill.items?.electricity?.amount > 0 && (
                        <div className="breakdown-item">
                          <span>
                            <Zap size={14} />
                            Electricity ({bill.items.electricity.unitsConsumed} units):
                          </span>
                          <span>{formatCurrency(bill.items.electricity.amount)}</span>
                        </div>
                      )}
                      {bill.items?.waterBill?.amount > 0 && (
                        <div className="breakdown-item">
                          <span>
                            <Droplets size={14} />
                            Water:
                          </span>
                          <span>{formatCurrency(bill.items.waterBill.amount)}</span>
                        </div>
                      )}
                      {bill.items?.commonAreaCharges?.amount > 0 && (
                        <div className="breakdown-item">
                          <span>
                            <Building size={14} />
                            Common Area:
                          </span>
                          <span>{formatCurrency(bill.items.commonAreaCharges.amount)}</span>
                        </div>
                      )}
                      {bill.lateFee > 0 && (
                        <div className="breakdown-item late-fee">
                          <span>
                            <AlertCircle size={14} />
                            Late Fee ({bill.daysLate} days):
                          </span>
                          <span>{formatCurrency(bill.lateFee)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="bill-footer">
                      <div className="bill-total">
                        <strong>Total: {formatCurrency(bill.totalWithLateFee || bill.totalAmount)}</strong>
                      </div>
                      <div className="bill-actions">
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedBill(bill)
                            setActiveModal('billDetails')
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDownloadPDF(bill)}
                          title="Download PDF Invoice"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayBill(bill)}
                        >
                          <CreditCard size={14} />
                          Pay Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Previous Bills Section */}
          <div className="section previous-bills">
            <div className="section-header">
              <h3>
                <FileText size={20} />
                Previous Bills
              </h3>
              <button 
                className="btn btn-outline"
                onClick={() => setActiveModal('previousBills')}
              >
                View All
              </button>
            </div>
            
            <div className="previous-bills-list">
              {previousBills.slice(0, 5).map(bill => (
                <div key={bill._id} className={`previous-bill-item ${bill.status}`}>
                  <div className="bill-info">
                    <div className="bill-period">
                      {bill.monthName} {bill.year}
                    </div>
                    <div className="bill-amount">
                      {formatCurrency(bill.totalWithLateFee || bill.totalAmount)}
                    </div>
                  </div>
                  <div className="bill-status">
                    {getStatusIcon(bill.status)}
                    <span>{bill.status?.toUpperCase()}</span>
                  </div>
                  <button 
                    className="btn btn-outline btn-xs"
                    onClick={() => handleDownloadPDF(bill)}
                    title="Download PDF Invoice"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Section */}
          <div className="section notifications">
            <div className="section-header">
              <h3>
                <Bell size={20} />
                Recent Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>
            
            <div className="notifications-list">
              {allNotifications.slice(0, 5).map(notification => (
                <div key={notification._id || notification.id} className={`notification-item ${notification.category}`}>
                  <div className="notification-content">
                    <h5>{notification.title}</h5>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt || notification.date).toLocaleDateString()}</small>
                  </div>
                  <div className={`priority-indicator ${notification.priority}`}>
                    {notification.priority?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals */}
        {activeModal === 'billDetails' && selectedBill && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Bill Details - {selectedBill.monthName} {selectedBill.year}</h3>
                <button onClick={() => setActiveModal(null)}>×</button>
              </div>
              <div className="modal-content">
                <div className="bill-details-grid">
                  <div className="detail-group">
                    <h4>Bill Information</h4>
                    <div className="detail-item">
                      <span>Bill Number:</span>
                      <span>{selectedBill.billNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span>Due Date:</span>
                      <span>{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span>Status:</span>
                      <span className={`status-badge ${selectedBill.status}`}>
                        {selectedBill.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="detail-group">
                    <h4>Charges Breakdown</h4>
                    <div className="detail-item">
                      <span>Monthly Rent:</span>
                      <span>{formatCurrency(selectedBill.items?.rent?.amount || 0)}</span>
                    </div>
                    {selectedBill.items?.electricity?.amount > 0 && (
                      <>
                        <div className="detail-item">
                          <span>Electricity Units:</span>
                          <span>{selectedBill.items.electricity.unitsConsumed} units</span>
                        </div>
                        <div className="detail-item">
                          <span>Electricity Charges:</span>
                          <span>{formatCurrency(selectedBill.items.electricity.amount)}</span>
                        </div>
                      </>
                    )}
                    {selectedBill.items?.waterBill?.amount > 0 && (
                      <div className="detail-item">
                        <span>Water Bill:</span>
                        <span>{formatCurrency(selectedBill.items.waterBill.amount)}</span>
                      </div>
                    )}
                    {selectedBill.items?.commonAreaCharges?.amount > 0 && (
                      <div className="detail-item">
                        <span>Common Area Maintenance:</span>
                        <span>{formatCurrency(selectedBill.items.commonAreaCharges.amount)}</span>
                      </div>
                    )}
                    {selectedBill.lateFee > 0 && (
                      <div className="detail-item late-fee">
                        <span>Late Fee ({selectedBill.daysLate} days):</span>
                        <span>{formatCurrency(selectedBill.lateFee)}</span>
                      </div>
                    )}
                    <div className="detail-item total">
                      <span><strong>Total Amount:</strong></span>
                      <span><strong>{formatCurrency(selectedBill.totalWithLateFee || selectedBill.totalAmount)}</strong></span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handlePayBill(selectedBill)}
                  >
                    Pay Now
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'paymentSuccess' && (
          <div className="modal-overlay" onClick={() => setActiveModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header success">
                <CheckCircle size={24} />
                <h3>Payment Successful!</h3>
                <button onClick={() => setActiveModal(null)}>×</button>
              </div>
              <div className="modal-content">
                <div className="success-content">
                  <p>Your payment has been processed successfully!</p>
                  <div className="upload-section">
                    <h4>Upload Payment Screenshot</h4>
                    <p>Please upload a screenshot of your payment confirmation for verification:</p>
                    <div className="upload-area">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        id="screenshot-upload"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="screenshot-upload" className="upload-label">
                        <Camera size={24} />
                        <span>Choose Screenshot</span>
                      </label>
                      {paymentScreenshot && (
                        <div className="screenshot-preview">
                          <img src={paymentScreenshot} alt="Payment Screenshot" />
                          <p>Screenshot uploaded successfully!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveModal(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedTenantDashboard