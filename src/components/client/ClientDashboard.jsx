import React, { useState, useEffect } from 'react';
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
  Download,
  Calendar,
  Home,
  Phone,
  Mail,
  FileText,
  Wallet,
  History
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRealTimeNotifications } from '../../context/RealTimeNotificationContext';
import { getApiUrl } from '../../utils/api';
import SlidingNavbar from '../SlidingNavbar';
import Modal from '../Modal';
import './ClientDashboard.css';

const ClientDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tenantData, setTenantData] = useState(null);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  
  const { getNotificationsForTenant, getUnreadCountForTenant, markAsRead, unreadCount } = useRealTimeNotifications();
  const notifications = getNotificationsForTenant(user.id);
  const tenantUnreadCount = getUnreadCountForTenant(user.id);

  // API functions
  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No token found in localStorage');
        toast.error('Not authenticated. Please login again.');
        setLoading(false);
        return;
      }
      
      const apiUrl = getApiUrl();
      const fullUrl = `${apiUrl}/tenant/dashboard`;
      
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      console.log('🌐 API URL:', apiUrl);
      console.log('🌐 Full URL:', fullUrl);
      console.log('⚠️ IMPORTANT: Make sure this points to localhost:3001 for development!');
      
      const response = await fetch(fullUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        console.log('✅ Dashboard data loaded successfully');
        console.log('👤 Tenant:', data.tenant?.name);
        console.log('📄 Bills:', data.bills?.length, 'found');
        console.log('💳 Payments:', data.payments?.length, 'found');
        
        // Debug: Log penalty data for each bill
        if (data.bills && data.bills.length > 0) {
          console.log('📊 Bill Penalty Data:');
          data.bills.slice(0, 3).forEach(bill => {
            const currentDate = new Date();
            const daysOverdue = bill.dueDate ? Math.floor((currentDate - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
            const expectedPenalty = daysOverdue * 50;
            console.log(`  ${bill.billNumber}:`);
            console.log(`    lateFee: ₹${bill.lateFee} (daysLate: ${bill.daysLate})`);
            console.log(`    penalty.amount: ₹${bill.penalty?.amount} (days: ${bill.penalty?.days})`);
            console.log(`    Expected: ₹${expectedPenalty} (${daysOverdue} days)`);
            console.log(`    totalWithLateFee: ₹${bill.totalWithLateFee}`);
          });
        }
        
        setTenantData(data.tenant);
        setBills(data.bills || []);
        setPayments(data.payments || []);
      } else {
        console.error('❌ API returned failure:', data.error);
        toast.error('Failed to load dashboard data: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to connect to server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (bill) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('User not authenticated.');
        return;
      }

      const response = await fetch(`${getApiUrl()}/tenant/bills/${bill._id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice PDF');
      }

      const blob = await response.blob();

      // Check if running in Capacitor (mobile app)
      const isApp = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();

      if (isApp) {
        // 📱 For Android/iOS (Capacitor)
        const arrayBuffer = await blob.arrayBuffer();
        const base64Data = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        
        const fileName = `Invoice_${bill.billNumber}.pdf`;
        
        await window.Capacitor.Plugins.Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: 'DOCUMENTS'
        });
        
        toast.success(`Invoice saved as ${fileName} in File Manager - Documents 📄`);
      } else {
        // 💻 For browser (Web)
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Invoice_${bill.billNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success('Invoice downloaded successfully ✅');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download invoice. Please try again.');
    }
  };

  // Ensure Razorpay script is available before opening checkout
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

  const makePayment = async (bill, paymentMethod) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        // bill.totalAmount already includes penalty, so use totalAmount directly
        const safeAmount = Math.round(bill.totalAmount || 0);
        const orderResponse = await fetch(`${getApiUrl()}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            billId: bill._id,
            amount: safeAmount
          })
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok || !orderData.success) {
          const msg = orderData?.message || 'Failed to create payment order';
          toast.error(msg);
          console.error('Create-order failed:', orderData);
          return;
        }
        
        // Ensure checkout script is loaded
        try {
          await ensureRazorpayLoaded();
        } catch (e) {
          toast.error('Unable to load Razorpay. Please check your internet and try again.');
          console.error(e);
          return;
        }

        if (!window.Razorpay) {
          toast.error('Razorpay SDK unavailable. Please refresh and try again.');
          return;
        }

        // Initialize Razorpay with UPI (QR) enabled
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RQT7cZB747ePSF',
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Bhuyan Complex',
          description: `Payment for ${bill.billNumber}`,
          order_id: orderData.order.id,

          method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true
          },
          // Prefer collect flow on web; QR enabled via display blocks
          upi: {
            flow: 'collect'
          },
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
          handler: async function (response) {
            // Verify payment
            const verifyResponse = await fetch(`${getApiUrl()}/payments/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                billId: bill._id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            
            if (verifyResponse.ok && verifyData.success) {
              toast.success('Payment successful!');
              fetchDashboardData();
            } else {
              toast.error(verifyData?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: tenantData?.name,
            email: tenantData?.email,
            contact: tenantData?.phone
          },
          theme: {
            color: '#667eea'
          }
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (e) {
          console.error('Failed to open Razorpay checkout:', e);
          toast.error('Could not open Razorpay checkout.');
        }
      } else if (paymentMethod === 'upi') {
        // UPI-only flow via Razorpay Checkout (with QR enabled)
        const safeAmount = Math.round((bill.totalAmount || 0) + (bill.penalty?.amount || 0));
        const orderResponse = await fetch(`${getApiUrl()}/payments/create-order`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            billId: bill._id,
            amount: safeAmount
          })
        });
        const orderData = await orderResponse.json();
        if (!orderResponse.ok || !orderData.success) {
          const msg = orderData?.message || 'Failed to create payment order';
          toast.error(msg);
          console.error('Create-order failed:', orderData);
          return;
        }
        try {
          await ensureRazorpayLoaded();
        } catch (e) {
          toast.error('Unable to load Razorpay. Please check your internet and try again.');
          console.error(e);
          return;
        }
        if (!window.Razorpay) {
          toast.error('Razorpay SDK unavailable. Please refresh and try again.');
          return;
        }
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RQT7cZB747ePSF',
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: 'Bhuyan Complex',
          description: `UPI Payment for ${bill.billNumber}`,
          order_id: orderData.order.id,
          method: { upi: true, card: false, netbanking: false, wallet: false },
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
              sequence: ['block.upi'],
              preferences: { show_default_blocks: true }
            }
          },
          handler: async function (response) {
            const verifyResponse = await fetch(`${getApiUrl()}/payments/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                billId: bill._id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyResponse.json();
            if (verifyResponse.ok && verifyData.success) {
              toast.success('UPI payment successful!');
              fetchDashboardData();
            } else {
              toast.error(verifyData?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: tenantData?.name,
            email: tenantData?.email,
            contact: tenantData?.phone
          },
          theme: { color: '#667eea' }
        };
        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (e) {
          console.error('Failed to open Razorpay checkout (UPI):', e);
          toast.error('Could not open Razorpay UPI checkout.');
        }
      } else {
        // Other payment methods
        const response = await fetch(`${getApiUrl()}/payments/record`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            billId: bill._id,
            amount: Math.round((bill.totalAmount || 0) + (bill.penalty?.amount || 0)),
            paymentMethod: paymentMethod
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          toast.success('Payment recorded successfully');
          fetchDashboardData();
        } else {
          toast.error(data?.message || 'Payment recording failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time profile sync for name/photo and displayed data
  useEffect(() => {
    const applyUpdate = (payload) => {
      if (!payload) return
      if (payload.userId && payload.userId !== user.id) return
      setTenantData(prev => ({
        ...(prev || {}),
        name: payload.name || payload.fullName || prev?.name,
        email: payload.email || prev?.email,
        phone: payload.phone || prev?.phone,
        profilePhoto: payload.profilePhoto || prev?.profilePhoto,
        room: payload.room || prev?.room,
        // keep other fields as-is
      }))
    }

    const handleTenantWS = (e) => applyUpdate(e.detail)

    const handleUserContext = (e) => {
      const u = e.detail
      if (!u) return
      if (u.id !== user.id) return
      // reflect from context updates
      setTenantData(prev => ({
        ...(prev || {}),
        name: u.name || prev?.name,
        email: u.email || prev?.email,
        phone: u.phone || prev?.phone,
        profilePhoto: u.profilePhoto || prev?.profilePhoto,
        room: u.room || prev?.room
      }))
    }

    const handleStorage = (e) => {
      if (e.key === 'user' && e.newValue) {
        try {
          const u = JSON.parse(e.newValue)
          if (u?.id === user.id) {
            handleUserContext({ detail: u })
          }
        } catch {}
      }
    }

    window.addEventListener('TENANT_PROFILE_UPDATED', handleTenantWS)
    window.addEventListener('tenantProfileUpdated', handleTenantWS)
    window.addEventListener('userUpdated', handleUserContext)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('TENANT_PROFILE_UPDATED', handleTenantWS)
      window.removeEventListener('tenantProfileUpdated', handleTenantWS)
      window.removeEventListener('userUpdated', handleUserContext)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user.id])

  // Real-time bill updates when new bill notification is received
  useEffect(() => {
    const handleNewNotification = (e) => {
      const notification = e.detail;
      if (!notification) return;

      // Check if notification is bill-related
      const isBillNotification = notification.category === 'bill' ||
        notification.title?.toLowerCase().includes('bill') ||
        notification.message?.toLowerCase().includes('bill');

      if (isBillNotification) {
        console.log('📄 [ClientDashboard] Bill notification received, refreshing dashboard data');
        fetchDashboardData();
      }
    };

    window.addEventListener('NEW_NOTIFICATION_RECEIVED', handleNewNotification);

    return () => {
      window.removeEventListener('NEW_NOTIFICATION_RECEIVED', handleNewNotification);
    };
  }, [])

  // Dashboard Overview
  const DashboardOverview = () => {
    const currentBills = bills.filter(bill => 
      bill.status === 'pending' || bill.status === 'overdue'
    );
        const totalDue = currentBills.reduce((sum, bill) => 
      sum + (bill.totalWithLateFee || bill.totalAmount), 0
    );

    return (
      <div className="client-dashboard-overview">
        <div className="welcome-section">
          <div className="user-info">
            <div className="user-avatar">
              {tenantData?.profilePhoto ? (
                <img src={tenantData.profilePhoto} alt={tenantData.name} />
              ) : (
                <User size={32} />
              )}
            </div>
            <div className="user-details">
              <h2>Welcome, {tenantData?.name}</h2>
              <p>Room {tenantData?.room?.roomNumber} • {tenantData?.room?.type}</p>
              <span className={`tenant-status ${tenantData?.status}`}>
                {tenantData?.status?.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="quick-actions">
            <button 
              className="quick-action-btn pay-bills"
              onClick={() => setActiveTab('bills')}
              disabled={currentBills.length === 0}
            >
              <CreditCard size={20} />
              Pay Bills
              {currentBills.length > 0 && (
                <span className="action-badge">{currentBills.length}</span>
              )}
            </button>
            <button 
              className="quick-action-btn view-balance"
              onClick={() => setActiveTab('balance')}
            >
              <Wallet size={20} />
              View Balance
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card balance-card">
            <div className="stat-header">
              <Wallet size={24} />
              <h3>Security Deposit</h3>
            </div>
            <div className="stat-value">
              ₹{tenantData?.securityDepositPaid?.toLocaleString() || 0}
            </div>
            <div className="stat-subtitle">
              Required: ₹{tenantData?.room?.securityDeposit?.toLocaleString() || 0}
            </div>
            <div className="balance-status">
              {(tenantData?.securityDepositPaid || 0) >= (tenantData?.room?.securityDeposit || 0) ? (
                <span className="status-paid">✓ Fully Paid</span>
              ) : (
                <span className="status-pending">⚠ Pending</span>
              )}
            </div>
          </div>

          <div className="stat-card bills-card">
            <div className="stat-header">
              <Receipt size={24} />
              <h3>Current Bills</h3>
            </div>
            <div className="stat-value">
              ₹{totalDue.toLocaleString()}
            </div>
            <div className="stat-subtitle">
              {currentBills.length} pending bill{currentBills.length !== 1 ? 's' : ''}
            </div>
            {currentBills.some(bill => bill.status === 'overdue') && (
              <div className="overdue-warning">
                <AlertCircle size={16} />
                Overdue bills with penalty
              </div>
            )}
          </div>

          <div className="stat-card payments-card">
            <div className="stat-header">
              <History size={24} />
              <h3>Payment History</h3>
            </div>
            <div className="stat-value">
              {payments.length}
            </div>
            <div className="stat-subtitle">
              Total payments made
            </div>
            {payments.length > 0 && (
              <div className="last-payment">
                Last: {new Date(payments[0]?.paidAt).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="stat-card notifications-card">
            <div className="stat-header">
              <Bell size={24} />
              <h3>Notifications</h3>
            </div>
            <div className="stat-value">
              {tenantUnreadCount}
            </div>
            <div className="stat-subtitle">
              Unread notifications
            </div>
          </div>
        </div>

        {/* Recent Bills */}
        <div className="recent-section">
          <h3>Recent Bills</h3>
          <div className="recent-bills">
            {bills.slice(0, 3).map(bill => (
              <div key={bill._id} className={`bill-card ${bill.status}`}>
                <div className="bill-header">
                  <span className="bill-number">{bill.billNumber}</span>
                  <span className={`bill-status ${bill.status}`}>
                    {bill.status.toUpperCase()}
                  </span>
                </div>
                <div className="bill-details">
                  <div className="bill-amount">
                    ₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}
                  </div>
                  <div className="bill-period">
                    {new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="bill-due">
                    Due: {new Date(bill.dueDate).toLocaleDateString()}
                  </div>
                  {((bill.lateFee > 0) || (bill.penalty?.amount > 0)) && (
                    <div className="bill-penalty">
                      Late Fee: ₹{(bill.lateFee || bill.penalty?.amount || 0).toLocaleString()} 
                      {bill.daysLate > 0 && `(${bill.daysLate} days)`}
                      {bill.penalty?.days > 0 && !bill.daysLate && `(${bill.penalty.days} days)`}
                    </div>
                  )}
                </div>
                <div className="bill-actions">
                  {bill.status !== 'paid' && (
                    <button 
                      className="pay-btn"
                      onClick={() => setModalState({ 
                        isOpen: true, 
                        type: 'payment', 
                        data: bill 
                      })}
                    >
                      Pay Now
                    </button>
                  )}
                  <button 
                    className="download-btn"
                    onClick={() => generatePDF(bill)}
                  >
                    <Download size={16} />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications Preview */}
        <div className="notifications-preview">
          <h3>Recent Notifications</h3>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 3).map(notification => (
              <div key={notification._id || notification.id} className="notification-item">
                <div className="notification-content">
                  <strong>{notification.title}</strong>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt || notification.date).toLocaleDateString()}</small>
                  <div className="notification-meta">
                    <span className={`notification-type ${notification.type}`}>
                      {notification.type === 'personal' ? '👤 Personal' : '📢 General'}
                    </span>
                    <span className={`notification-category ${notification.category}`}>
                      {notification.category?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button 
                  className="mark-read-btn"
                  onClick={() => markAsRead(notification._id || notification.id)}
                >
                  <CheckCircle size={16} />
                </button>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // View Balance Component
  const ViewBalance = () => (
    <div className="view-balance">
      <div className="balance-header">
        <h2>Security Deposit & Balance</h2>
        <div className="room-info">
          <Home size={20} />
          Room {tenantData?.room?.roomNumber} • {tenantData?.room?.type}
        </div>
      </div>

      <div className="balance-cards">
        <div className="balance-main-card">
          <div className="balance-title">Security Deposit Status</div>
          <div className="balance-amounts">
            <div className="amount-item">
              <span className="amount-label">Required Deposit</span>
              <span className="amount-value">
                ₹{tenantData?.room?.securityDeposit?.toLocaleString() || 0}
              </span>
            </div>
            <div className="amount-item">
              <span className="amount-label">Paid Amount</span>
              <span className="amount-value paid">
                ₹{tenantData?.securityDepositPaid?.toLocaleString() || 0}
              </span>
            </div>
            <div className="amount-item balance-difference">
              <span className="amount-label">
                {(tenantData?.securityDepositPaid || 0) >= (tenantData?.room?.securityDeposit || 0) 
                  ? 'Fully Paid' 
                  : 'Remaining'}
              </span>
              <span className={`amount-value ${
                (tenantData?.securityDepositPaid || 0) >= (tenantData?.room?.securityDeposit || 0) 
                  ? 'paid' 
                  : 'pending'
              }`}>
                {(tenantData?.securityDepositPaid || 0) >= (tenantData?.room?.securityDeposit || 0) 
                  ? '✓' 
                  : `₹${((tenantData?.room?.securityDeposit || 0) - (tenantData?.securityDepositPaid || 0)).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="deposit-info-card">
          <h3>Deposit Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <Calendar size={16} />
              <div>
                <span className="info-label">Move-in Date</span>
                <span className="info-value">
                  {tenantData?.moveInDate 
                    ? new Date(tenantData.moveInDate).toLocaleDateString() 
                    : 'Not specified'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <FileText size={16} />
              <div>
                <span className="info-label">Agreement Status</span>
                <span className={`info-value ${tenantData?.documents?.agreement?.signed ? 'signed' : 'pending'}`}>
                  {tenantData?.documents?.agreement?.signed ? 'Signed' : 'Pending'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <User size={16} />
              <div>
                <span className="info-label">Tenant Status</span>
                <span className={`info-value ${tenantData?.status}`}>
                  {tenantData?.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="deposit-note">
        <AlertCircle size={20} />
        <div>
          <strong>Note:</strong> Your security deposit is held by the management and will be 
          refunded upon checkout, subject to room condition assessment and any pending dues.
          Only the building owner/admin can modify security deposit amounts.
        </div>
      </div>
    </div>
  );

  // Pay Bills Component
  const PayBills = () => {
    console.log('📄 PayBills component rendering with bills:', bills);
    
    const pendingBills = bills.filter(bill => 
      bill.status === 'pending' || bill.status === 'overdue'
    );
    
    console.log('⚡ Pending bills:', pendingBills.length, pendingBills);

    return (
      <div className="pay-bills">
        <div className="bills-header">
          <h2>Pay Bills</h2>
          <div className="bills-summary">
          {pendingBills.length} pending bill{pendingBills.length !== 1 ? 's' : ''} • 
            Total: ₹{pendingBills.reduce((sum, bill) => 
              sum + (bill.totalWithLateFee || bill.totalAmount), 0
            ).toLocaleString()}
          </div>
        </div>

        {pendingBills.length === 0 ? (
          <div className="no-bills">
            <CheckCircle size={48} />
            <h3>All caught up!</h3>
            <p>You have no pending bills at the moment.</p>
          </div>
        ) : (
          <div className="bills-grid">
            {pendingBills.map(bill => (
              <div key={bill._id} className={`detailed-bill-card ${bill.status}`}>
                <div className="bill-card-header">
                  <div className="bill-number">
                    <Receipt size={20} />
                    {bill.billNumber}
                  </div>
                  <span className={`bill-status-badge ${bill.status}`}>
                    {bill.status === 'overdue' && <AlertCircle size={16} />}
                    {bill.status.toUpperCase()}
                  </span>
                </div>

                <div className="bill-period">
                  <Calendar size={16} />
                  {new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>

                <div className="bill-breakdown">
                  {/* Safety check for bill structure */}
                  {!bill.items && (
                    <div className="breakdown-item error">
                      <span>Bill data incomplete - please contact admin</span>
                      <span>₹{bill.totalAmount?.toLocaleString() || '0'}</span>
                    </div>
                  )}
                  
                  {/* Monthly Rent */}
                  {bill.items?.rent && (
                    <div className="breakdown-item">
                      <span>Monthly Rent</span>
                      <span>₹{bill.items.rent.amount?.toLocaleString() || '0'}</span>
                    </div>
                  )}
                  
                  {/* Electricity Bill with detailed breakdown */}
                  {bill.items.electricity && bill.items.electricity.amount > 0 && (
                    <div className="breakdown-item electricity">
                      <div className="breakdown-detail">
                        <span>Electricity Bill</span>
                        <div className="utility-details">
                          <small>Units: {bill.items.electricity.unitsConsumed || 0} ({bill.items.electricity.meterStartReading || 0} - {bill.items.electricity.meterEndReading || 0})</small>
                          <small>Rate: ₹{bill.items.electricity.chargesPerUnit || 0}/unit</small>
                        </div>
                      </div>
                      <span>₹{bill.items.electricity.amount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Water Bill */}
                  {bill.items.waterBill && bill.items.waterBill.amount > 0 && (
                    <div className="breakdown-item">
                      <span>Water Bill</span>
                      <span>₹{bill.items.waterBill.amount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Common Area Charges */}
                  {bill.items.commonAreaCharges && bill.items.commonAreaCharges.amount > 0 && (
                    <div className="breakdown-item">
                      <span>Common Area Charges</span>
                      <span>₹{bill.items.commonAreaCharges.amount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Additional Charges */}
                  {bill.items.additionalCharges && bill.items.additionalCharges.length > 0 && 
                    bill.items.additionalCharges.map((charge, index) => (
                      <div key={index} className="breakdown-item">
                        <span>{charge.description}</span>
                        <span>₹{charge.amount.toLocaleString()}</span>
                      </div>
                    ))
                  }

                  <div className="breakdown-subtotal">
                    <span>Subtotal</span>
                    <span>₹{(bill.baseAmount || bill.totalAmount).toLocaleString()}</span>
                  </div>

                  {(bill.lateFee > 0 || bill.penalty?.amount > 0) && (
                    <div className="breakdown-item penalty">
                      <span>
                        Late Fee 
                        {bill.daysLate > 0 && `(${bill.daysLate} days overdue)`}
                        {bill.penalty?.days > 0 && !bill.daysLate && `(${bill.penalty.days} days)`}
                      </span>
                      <span>₹{(bill.lateFee || bill.penalty?.amount || 0).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="breakdown-total">
                    <span>Total Amount</span>
                    <span>₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bill-dates">
                  <div className="date-item">
                    <span>Generated</span>
                    <span>{new Date(bill.generatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="date-item">
                    <span>Due Date</span>
                    <span className={bill.status === 'overdue' ? 'overdue' : ''}>
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bill-actions">
                  <button 
                    className="pay-now-btn"
                    onClick={() => setModalState({ 
                      isOpen: true, 
                      type: 'payment', 
                      data: bill 
                    })}
                  >
                    <CreditCard size={16} />
                    Pay ₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}
                  </button>
                  <button 
                    className="download-invoice-btn"
                    onClick={() => generatePDF(bill)}
                  >
                    <Download size={16} />
                    Download Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Previous Bills Component
  const PreviousBills = () => (
    <div className="previous-bills">
      <div className="bills-header">
        <h2>Bill History</h2>
        <div className="bills-stats">
          Total Bills: {bills.length} • 
          Paid: {bills.filter(b => b.status === 'paid').length} • 
          Pending: {bills.filter(b => b.status !== 'paid').length}
        </div>
      </div>

      <div className="bills-table">
        <div className="table-header">
          <div className="th">Bill Number</div>
          <div className="th">Period</div>
          <div className="th">Amount</div>
          <div className="th">Status</div>
          <div className="th">Due Date</div>
          <div className="th">Actions</div>
        </div>
        
        <div className="table-body">
          {bills.map(bill => (
            <div key={bill._id} className={`table-row ${bill.status}`}>
              <div className="td bill-number">
                <Receipt size={16} />
                {bill.billNumber}
              </div>
              <div className="td">
                {new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
              <div className="td amount">
                ₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}
                {((bill.lateFee > 0) || (bill.penalty?.amount > 0)) && (
                  <small className="penalty-note">
                    (incl. ₹{(bill.lateFee || bill.penalty?.amount || 0).toLocaleString()} late fee)
                  </small>
                )}
                {bill.remainingAmount > 0 && (
                  <small className="remaining-note">
                    Remaining: ₹{bill.remainingAmount.toLocaleString()}
                  </small>
                )}
              </div>
              <div className="td status">
                <span className={`status-badge ${bill.status}`}>
                  {bill.status === 'paid' && <CheckCircle size={14} />}
                  {bill.status === 'overdue' && <AlertCircle size={14} />}
                  {bill.status === 'pending' && <Clock size={14} />}
                  {bill.status.toUpperCase()}
                </span>
              </div>
              <div className="td due-date">
                {new Date(bill.dueDate).toLocaleDateString()}
                {bill.paidDate && (
                  <small>Paid: {new Date(bill.paidDate).toLocaleDateString()}</small>
                )}
              </div>
              <div className="td actions">
                <button 
                  className="action-btn download"
                  onClick={() => generatePDF(bill)}
                  title="Download Invoice"
                >
                  <Download size={14} />
                </button>
                <button 
                  className="action-btn view"
                  onClick={() => setModalState({ 
                    isOpen: true, 
                    type: 'billDetails', 
                    data: bill 
                  })}
                  title="View Details"
                >
                  <Eye size={14} />
                </button>
                {bill.status !== 'paid' && (
                  <button 
                    className="action-btn pay"
                    onClick={() => setModalState({ 
                      isOpen: true, 
                      type: 'payment', 
                      data: bill 
                    })}
                    title="Pay Bill"
                  >
                    <CreditCard size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Payment Modal
  const PaymentModal = ({ bill }) => (
    <div className="payment-modal">
      <div className="payment-header">
        <h3>Pay Bill - {bill.billNumber}</h3>
        <div className="payment-amount">
          Total: ₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}
        </div>
      </div>

      <div className="payment-methods">
        <div className="payment-method-header">
          <h4>Choose Payment Method</h4>
        </div>

        <div className="payment-options">
          <button 
            className="payment-option online"
            onClick={() => makePayment(bill, 'razorpay')}
          >
            <CreditCard size={24} />
            <div>
              <strong>Online Payment</strong>
              <small>Credit/Debit Card, UPI, Net Banking</small>
            </div>
          </button>

          

      
          
        </div>
      </div>

      <div className="payment-summary">
        <div className="summary-item">
          <span>Bill Period:</span>
          <span>{new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}</span>
        </div>
        <div className="summary-item">
          <span>Due Date:</span>
          <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="summary-item">
          <span>Bill Amount:</span>
          <span>₹{(bill.baseAmount || bill.totalAmount).toLocaleString()}</span>
        </div>
        {((bill.lateFee > 0) || (bill.penalty?.amount > 0)) && (
          <div className="summary-item penalty">
            <span>Late Fee ({bill.daysLate || bill.penalty?.days || 0} days):</span>
            <span>₹{(bill.lateFee || bill.penalty?.amount || 0).toLocaleString()}</span>
          </div>
        )}
        <div className="summary-total">
          <span>Total Amount:</span>
          <span>₹{(bill.totalWithLateFee || bill.totalAmount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  if (loading && !tenantData) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`client-dashboard ${isDarkTheme ? 'dark' : ''}`}>
      <SlidingNavbar 
        user={user}
        onLogout={onLogout} 
        onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
        isDarkTheme={isDarkTheme}
      />
      
      <div className="main-content">
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <Home size={20} />
            Dashboard
          </button>
          <button 
            className={activeTab === 'balance' ? 'active' : ''}
            onClick={() => setActiveTab('balance')}
          >
            <Wallet size={20} />
            View Balance
          </button>
          <button 
            className={activeTab === 'bills' ? 'active' : ''}
            onClick={() => setActiveTab('bills')}
          >
            <CreditCard size={20} />
            Pay Bills
            {bills.filter(b => b.status !== 'paid').length > 0 && (
              <span className="tab-badge">
                {bills.filter(b => b.status !== 'paid').length}
              </span>
            )}
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} />
            Previous Bills
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'balance' && <ViewBalance />}
          {activeTab === 'bills' && <PayBills />}
          {activeTab === 'history' && <PreviousBills />}
        </div>
      </div>

      {modalState.isOpen && (
        <Modal 
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, type: null, data: null })}
          type={modalState.type}
          data={modalState.data}
          customContent={modalState.type === 'payment' ? (
            <PaymentModal bill={modalState.data} />
          ) : null}
        />
      )}
    </div>
  );
};

export default ClientDashboard;