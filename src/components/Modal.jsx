import { useState, useEffect } from 'react'
import { 
  X, DollarSign, CreditCard, Receipt, Users, Building, Plus, Shield, Calendar, AlertCircle,
  User, MapPin, FileText, Upload, Banknote, Calculator, Phone, Mail, Edit2, Save, 
  Trash2, Eye, Download, Search, Filter, TrendingUp, Bell, Send, UserPlus,
  Home, Zap, Droplets, Wrench, Car, Clock, CheckCircle, XCircle, Copy, RefreshCw, Edit
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useUser } from '../context/UserContext'
import { useOwner } from '../context/OwnerContext'
import { useRealTimeNotifications } from '../context/RealTimeNotificationContext'
import { tenants, bills, getTotalRevenue, getPendingRevenue, paymentHistory } from '../data/mockData'
import { getApiUrl, apiRequest } from '../utils/api'
import './Modal.css'

// Payment Monitoring Dashboard Component
const PaymentMonitoringDashboard = ({ onClose }) => {
  const [paymentSummary, setPaymentSummary] = useState({})
  const [recentTransactions, setRecentTransactions] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch payment summary from API
  const fetchPaymentSummary = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        toast.error('Please log in again')
        return
      }
      
      console.log('Fetching payment summary for:', selectedMonth, selectedYear)
      const response = await fetch(`${getApiUrl()}/admin/payments/summary?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('Payment summary API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Payment summary API Error:', response.status, errorText)
        toast.error(`API Error: ${response.status} - ${errorText}`)
        return
      }
      
      const data = await response.json()
      console.log('Payment summary API response:', data)
      
      if (data.success) {
        setPaymentSummary(data.summary || {})
        setLastUpdated(new Date())
      } else {
        console.error('Payment summary API returned success: false', data)
        // Use mock data as fallback
        setPaymentSummary({
          totalReceived: 45000,
          paymentsCount: 8,
          totalPending: 12000,
          pendingBills: 3,
          totalOverdue: 8500,
          overdueBills: 2
        })
        setLastUpdated(new Date())
        toast.error('Using demo data - ' + (data.error || 'API authentication issue'))
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error)
      // Use mock data as fallback
      setPaymentSummary({
        totalReceived: 45000,
        paymentsCount: 8,
        totalPending: 12000,
        pendingBills: 3,
        totalOverdue: 8500,
        overdueBills: 2
      })
      setLastUpdated(new Date())
      toast.error(`Using demo data - Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent transactions from API
  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        toast.error('Please log in again')
        return
      }
      
      const response = await fetch(`${getApiUrl()}/admin/payments/recent?month=${selectedMonth}&year=${selectedYear}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('Recent transactions API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        toast.error(`API Error: ${response.status} - ${errorText}`)
        return
      }
      
      const data = await response.json()
      console.log('Recent transactions API response:', data)
      
      if (data.success) {
        setRecentTransactions(data.transactions || [])
      } else {
        console.error('Recent transactions API returned success: false', data)
        // Use mock data as fallback
        setRecentTransactions([
          {
            _id: '1',
            tenant: { name: 'John Doe' },
            amount: 1200,
            dateReceived: new Date('2024-01-15').toISOString(),
            month: 'January',
            year: 2024,
            paymentMethod: 'Bank Transfer'
          },
          {
            _id: '2', 
            tenant: { name: 'Jane Smith' },
            amount: 950,
            dateReceived: new Date('2024-01-12').toISOString(),
            month: 'January',
            year: 2024,
            paymentMethod: 'Cash'
          },
          {
            _id: '3',
            tenant: { name: 'Bob Johnson' },
            amount: 1400,
            dateReceived: new Date('2024-01-10').toISOString(),
            month: 'January', 
            year: 2024,
            paymentMethod: 'Check'
          }
        ])
        toast.error('Using demo data - ' + (data.error || 'API authentication issue'))
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error)
      // Use mock data as fallback
      setRecentTransactions([
        {
          _id: '1',
          tenant: { name: 'John Doe' },
          amount: 1200,
          dateReceived: new Date('2024-01-15').toISOString(),
          month: 'January',
          year: 2024,
          paymentMethod: 'Bank Transfer'
        },
        {
          _id: '2', 
          tenant: { name: 'Jane Smith' },
          amount: 950,
          dateReceived: new Date('2024-01-12').toISOString(),
          month: 'January',
          year: 2024,
          paymentMethod: 'Cash'
        },
        {
          _id: '3',
          tenant: { name: 'Bob Johnson' },
          amount: 1400,
          dateReceived: new Date('2024-01-10').toISOString(),
          month: 'January', 
          year: 2024,
          paymentMethod: 'Check'
        }
      ])
      toast.error(`Using demo data - Network error: ${error.message}`)
    }
  }

  // Download full Excel report
  const downloadFullReport = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        toast.error('Please login to download reports')
        return
      }
      
      const response = await fetch(`${getApiUrl()}/admin/payments/export?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December']
        a.download = `Payment_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success('Report downloaded successfully')
      } else if (response.status === 401 || response.status === 403) {
        const errorData = await response.json()
        toast.error(`Authentication failed. Downloading demo report instead.`)
        console.error('Authentication error for export:', errorData)
        generateMockExcelReport()
        return
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(`Failed to download report: ${errorData.error || 'Server error'}`)
        console.error('Export error:', errorData)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Downloading demo report instead.')
        generateMockExcelReport()
      } else {
        toast.error(`Failed to download report: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Generate mock Excel report with sample data
  const generateMockExcelReport = () => {
    try {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December']
      
      // Sample data that matches the Excel format from the reference image
      const sampleData = [
        {
          'Tenant Name': 'John Doe',
          'Room Number': 'R101',
          'Room Type': 'Single',
          'Phone': '+91 9876543210',
          'Email': 'john.doe@email.com',
          'Bill Number': 'BILL-2024-001',
          'Month': monthNames[selectedMonth - 1],
          'Year': selectedYear,
          'Due Date': '10/01/2024',
          'Rent Amount': 8500,
          'Electricity': 200,
          'Water': 50,
          'Gas': 100,
          'Internet': 500,
          'Parking': 300,
          'Maintenance': 200,
          'Bill Total': 9850,
          'Late Fees': 0,
          'Total Amount (with Late Fees)': 9850,
          'Paid Amount': 9850,
          'Remaining Amount': 0,
          'Payment Status': 'Paid',
          'Payment Method': 'Bank Transfer',
          'Payment Date': '08/01/2024',
          'Days Overdue': 0
        },
        {
          'Tenant Name': 'Jane Smith',
          'Room Number': 'R102', 
          'Room Type': 'Double',
          'Phone': '+91 9876543211',
          'Email': 'jane.smith@email.com',
          'Bill Number': 'BILL-2024-002',
          'Month': monthNames[selectedMonth - 1],
          'Year': selectedYear,
          'Due Date': '10/01/2024',
          'Rent Amount': 12000,
          'Electricity': 300,
          'Water': 75,
          'Gas': 150,
          'Internet': 500,
          'Parking': 300,
          'Maintenance': 200,
          'Bill Total': 13525,
          'Late Fees': 270,
          'Total Amount (with Late Fees)': 13795,
          'Paid Amount': 0,
          'Remaining Amount': 13795,
          'Payment Status': 'Overdue',
          'Payment Method': 'N/A',
          'Payment Date': 'N/A',
          'Days Overdue': 20
        },
        {
          'Tenant Name': 'Bob Johnson',
          'Room Number': 'R103',
          'Room Type': 'Single',
          'Phone': '+91 9876543212',
          'Email': 'bob.johnson@email.com',
          'Bill Number': 'BILL-2024-003',
          'Month': monthNames[selectedMonth - 1],
          'Year': selectedYear,
          'Due Date': '10/01/2024',
          'Rent Amount': 7500,
          'Electricity': 180,
          'Water': 40,
          'Gas': 80,
          'Internet': 500,
          'Parking': 0,
          'Maintenance': 200,
          'Bill Total': 8500,
          'Late Fees': 0,
          'Total Amount (with Late Fees)': 8500,
          'Paid Amount': 4000,
          'Remaining Amount': 4500,
          'Payment Status': 'Pending',
          'Payment Method': 'Partial Cash',
          'Payment Date': '05/01/2024',
          'Days Overdue': 0
        }
      ]
      
      // Convert to CSV format for download
      const headers = Object.keys(sampleData[0])
      const csvContent = [headers.join(',')]
      
      sampleData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header]
          // Wrap in quotes if contains comma or is a string
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent.push(values.join(','))
      })
      
      const csvString = csvContent.join('\n')
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Payment_Report_Demo_${monthNames[selectedMonth - 1]}_${selectedYear}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Demo report downloaded as CSV file')
    } catch (error) {
      console.error('Error generating mock report:', error)
      toast.error('Failed to generate demo report')
    }
  }

  // Fetch data when month/year changes
  useEffect(() => {
    fetchPaymentSummary()
    fetchRecentTransactions()
  }, [selectedMonth, selectedYear])

  // Listen for real-time payment updates
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      if (event.detail?.type === 'PAYMENT_DASHBOARD_UPDATE') {
        const updateMonth = event.detail.month
        const updateYear = event.detail.year
        if (updateMonth === selectedMonth && updateYear === selectedYear) {
          fetchPaymentSummary()
          fetchRecentTransactions()
          toast.success(`Payment received: ₹${event.detail.paymentAmount} from ${event.detail.tenantName}`)
        }
      }
    }
    
    window.addEventListener('PAYMENT_DASHBOARD_UPDATE', handlePaymentUpdate)
    return () => window.removeEventListener('PAYMENT_DASHBOARD_UPDATE', handlePaymentUpdate)
  }, [selectedMonth, selectedYear])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="modal-content payment-monitoring-dashboard">
      <div className="modal-header">
        <h3>💳 Payment Monitoring Dashboard</h3>
        <button className="btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Month/Year Filter */}
      <div className="monitoring-header">
        <div className="period-selector">
          <select 
            className="form-control" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
          <select 
            className="form-control" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={2020 + i} value={2020 + i}>{2020 + i}</option>
            ))}
          </select>
        </div>
        <div className="real-time-indicator">
          {loading && <span className="loading">🔄 Updating...</span>}
          {lastUpdated && (
            <span className="last-updated">
              📊 Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Payment Overview Statistics */}
      <div className="payment-overview-grid">
        <div className="payment-stat-card collected">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <h4>Total Collected</h4>
            <p className="amount">₹{(paymentSummary.totalReceived || 0).toLocaleString()}</p>
            <span className="change positive">
              {paymentSummary.paymentsCount || 0} payments received
            </span>
          </div>
        </div>
        
        <div className="payment-stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h4>Pending Payments</h4>
            <p className="amount">₹{(paymentSummary.totalPending || 0).toLocaleString()}</p>
            <span className="change neutral">
              {paymentSummary.pendingBills || 0} bills pending
            </span>
          </div>
        </div>
        
        <div className="payment-stat-card overdue">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-details">
            <h4>Overdue Payments</h4>
            <p className="amount">₹{(paymentSummary.totalOverdue || 0).toLocaleString()}</p>
            <span className="change negative">
              {paymentSummary.overdueBills || 0} bills overdue
            </span>
          </div>
        </div>
        
        <div className="payment-stat-card collection-rate">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <h4>Collection Rate</h4>
            <p className="amount">
              {paymentSummary.totalReceived && paymentSummary.totalPending ? 
                Math.round((paymentSummary.totalReceived / (paymentSummary.totalReceived + paymentSummary.totalPending)) * 100) : 0}%
            </p>
            <span className="change positive">This month</span>
          </div>
        </div>
      </div>

      {/* Recent Payment Transactions */}
      <div className="payment-sections">
        <div className="section">
          <div className="section-header">
            <h4>Recent Payment Transactions</h4>
            <span className="transaction-count">
              {recentTransactions.length} transactions
            </span>
          </div>
          
          <div className="transactions-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-icon">
                    <CreditCard size={18} />
                  </div>
                  <div className="transaction-info">
                    <h5>{transaction.tenantName}</h5>
                    <p>{transaction.paymentMethod} • Room {transaction.roomNumber}</p>
                    <small>{new Date(transaction.paidAt).toLocaleDateString()} {new Date(transaction.paidAt).toLocaleTimeString()}</small>
                  </div>
                  <div className="transaction-amount">
                    <span className="amount positive">₹{transaction.amount.toLocaleString()}</span>
                    <div className="status completed">
                      <CheckCircle size={12} />
                      Completed
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No transactions found for {monthNames[selectedMonth - 1]} {selectedYear}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="monitoring-actions">
        <button 
          className="btn btn-primary"
          onClick={downloadFullReport}
          disabled={loading}
        >
          <Download size={16} />
          {loading ? 'Generating...' : 'Download Full Report'}
        </button>
        <button className="btn btn-secondary" onClick={() => {
          fetchPaymentSummary()
          fetchRecentTransactions()
        }}>
          <RefreshCw size={16} />
          Refresh Data
        </button>
      </div>
    </div>
  )
}

// ManageBillsModal Component
const ManageBillsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('generate') // 'generate' | 'manage' | 'payments'
  const [tenantsForBilling, setTenantsForBilling] = useState([])
  const [allBills, setAllBills] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [billForm, setBillForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rent: '',
    electricity: {
      meterStartReading: 0,
      meterEndReading: 0,
      chargesPerUnit: 8.5
    },
    waterBill: 0,
    commonAreaCharges: 100
  })
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'all'
  })
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, bill: null })

  // Load tenants for billing
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const response = await fetch(`${getApiUrl()}/admin/tenants-for-billing`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setTenantsForBilling(data.tenants || [])
        }
      } catch (error) {
        console.error('Error fetching tenants:', error)
        toast.error('Failed to load tenants')
      } finally {
        setLoading(false)
      }
    }
    fetchTenants()
  }, [])

  // Load bills for management tab
  useEffect(() => {
    if (activeTab === 'manage' || activeTab === 'payments') {
      fetchBills()
    }
  }, [activeTab, filters])

  const fetchBills = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      if (filters.month) queryParams.append('month', filters.month)
      if (filters.year) queryParams.append('year', filters.year)
      if (filters.status !== 'all') queryParams.append('status', filters.status)

      const response = await fetch(`${getApiUrl()}/admin/bills?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAllBills(data.bills || [])
      }
    } catch (error) {
      console.error('Error fetching bills:', error)
      toast.error('Failed to load bills')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant)
    setBillForm(prev => ({
      ...prev,
      rent: tenant.room?.rent || 0
    }))
  }

  const calculateElectricityBill = () => {
    const { meterStartReading, meterEndReading, chargesPerUnit } = billForm.electricity
    const unitsConsumed = Math.max(0, meterEndReading - meterStartReading)
    return unitsConsumed * chargesPerUnit
  }

  const calculateTotalBill = () => {
    const electricityAmount = calculateElectricityBill()
    return billForm.rent + electricityAmount + billForm.waterBill + billForm.commonAreaCharges
  }

  const handleGenerateBill = async () => {
    if (!selectedTenant) {
      toast.error('Please select a tenant')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const billData = {
        tenantId: selectedTenant._id,
        month: billForm.month,
        year: billForm.year,
        rent: parseFloat(billForm.rent) || 0,
        electricity: {
          meterStartReading: parseFloat(billForm.electricity.meterStartReading) || 0,
          meterEndReading: parseFloat(billForm.electricity.meterEndReading) || 0,
          chargesPerUnit: parseFloat(billForm.electricity.chargesPerUnit) || 0
        },
        waterBill: parseFloat(billForm.waterBill) || 0,
        commonAreaCharges: parseFloat(billForm.commonAreaCharges) || 0
      }

      const response = await fetch(`${getApiUrl()}/admin/bills/generate-individual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(billData)
      })

      const result = await response.json()
      if (response.ok) {
        toast.success('Bill generated successfully!')
        setSelectedTenant(null)
        setBillForm({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          rent: '',
          electricity: {
            meterStartReading: 0,
            meterEndReading: 0,
            chargesPerUnit: 8.5
          },
          waterBill: 0,
          commonAreaCharges: 100
        })
      } else {
        toast.error(result.error || 'Failed to generate bill')
      }
    } catch (error) {
      console.error('Error generating bill:', error)
      toast.error('Failed to generate bill')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async (paymentId, verified, notes = '') => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/admin/payments/${paymentId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verified, notes })
      })

      if (response.ok) {
        toast.success(verified ? 'Payment verified successfully!' : 'Payment marked as failed')
        fetchBills() // Refresh bills
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to verify payment')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      toast.error('Failed to verify payment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBill = async (billId) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/admin/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Bill deleted successfully!')
        fetchBills() // Refresh bills
        setDeleteConfirmation({ isOpen: false, bill: null })
      } else {
        toast.error(result.error || 'Failed to delete bill')
      }
    } catch (error) {
      console.error('Error deleting bill:', error)
      toast.error('Failed to delete bill')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (bill) => {
    setDeleteConfirmation({ isOpen: true, bill })
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, bill: null })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="modal-content manage-bills-modal">
      <h3>Manage Bills & Payments</h3>
      
      <div className="bill-tabs">
        <button 
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <Plus size={16} /> Generate Bills
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          <Receipt size={16} /> Manage Bills
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} /> Payment Verification
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="generate-bills-tab">
          <div className="tenant-selection">
            <h4>Select Tenant</h4>
            <div className="tenants-grid">
              {loading ? (
                <div className="loading-state">Loading tenants...</div>
              ) : tenantsForBilling.length === 0 ? (
                <div className="empty-state">No active tenants found</div>
              ) : (
                tenantsForBilling.map(tenant => (
                  <div 
                    key={tenant._id} 
                    className={`tenant-card ${selectedTenant?._id === tenant._id ? 'selected' : ''}`}
                    onClick={() => handleTenantSelect(tenant)}
                  >
                    <div className="tenant-info">
                      <h5>{tenant.name}</h5>
                      <p><Phone size={14} /> {tenant.phone}</p>
                      <p><Mail size={14} /> {tenant.email}</p>
                      <p><Home size={14} /> Room {tenant.room?.roomNumber} - {tenant.room?.type}</p>
                      <p><DollarSign size={14} /> Rent: ₹{tenant.room?.rent}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedTenant && (
            <div className="bill-form">
              <h4>Generate Bill for {selectedTenant.name}</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Month</label>
                  <select 
                    value={billForm.month} 
                    onChange={(e) => setBillForm(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="form-control"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input 
                    type="number" 
                    value={billForm.year} 
                    onChange={(e) => setBillForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="form-control"
                    min="2023"
                    max="2030"
                  />
                </div>
                <div className="form-group">
                  <label>Rent Amount</label>
                  <input 
                    type="number" 
                    value={billForm.rent} 
                    onChange={(e) => setBillForm(prev => ({ ...prev, rent: parseFloat(e.target.value) || 0 }))}
                    className="form-control"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="electricity-section">
                <h5><Zap size={16} /> Electricity Bill</h5>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Meter Start Reading</label>
                    <input 
                      type="number" 
                      value={billForm.electricity.meterStartReading} 
                      onChange={(e) => setBillForm(prev => ({
                        ...prev,
                        electricity: { ...prev.electricity, meterStartReading: parseFloat(e.target.value) || 0 }
                      }))}
                      className="form-control"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Meter End Reading</label>
                    <input 
                      type="number" 
                      value={billForm.electricity.meterEndReading} 
                      onChange={(e) => setBillForm(prev => ({
                        ...prev,
                        electricity: { ...prev.electricity, meterEndReading: parseFloat(e.target.value) || 0 }
                      }))}
                      className="form-control"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Charges per Unit (₹)</label>
                    <input 
                      type="number" 
                      value={billForm.electricity.chargesPerUnit} 
                      onChange={(e) => setBillForm(prev => ({
                        ...prev,
                        electricity: { ...prev.electricity, chargesPerUnit: parseFloat(e.target.value) || 0 }
                      }))}
                      className="form-control"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Units Consumed</label>
                    <input 
                      type="number" 
                      value={Math.max(0, billForm.electricity.meterEndReading - billForm.electricity.meterStartReading)} 
                      className="form-control"
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Electricity Bill (₹)</label>
                    <input 
                      type="number" 
                      value={calculateElectricityBill().toFixed(2)} 
                      className="form-control"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="other-charges-section">
                <h5><Droplets size={16} /> Other Charges</h5>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Water Bill (₹)</label>
                    <input 
                      type="number" 
                      value={billForm.waterBill} 
                      onChange={(e) => setBillForm(prev => ({ ...prev, waterBill: parseFloat(e.target.value) || 0 }))}
                      className="form-control"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Common Area Charges (₹)</label>
                    <input 
                      type="number" 
                      value={billForm.commonAreaCharges} 
                      onChange={(e) => setBillForm(prev => ({ ...prev, commonAreaCharges: parseFloat(e.target.value) || 0 }))}
                      className="form-control"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div className="bill-summary">
                <h5>Bill Summary</h5>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Rent:</span>
                    <span>₹{billForm.rent}</span>
                  </div>
                  <div className="summary-item">
                    <span>Electricity:</span>
                    <span>₹{calculateElectricityBill().toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span>Water:</span>
                    <span>₹{billForm.waterBill}</span>
                  </div>
                  <div className="summary-item">
                    <span>Common Area:</span>
                    <span>₹{billForm.commonAreaCharges}</span>
                  </div>
                  <div className="summary-item total">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>₹{calculateTotalBill().toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="bill-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleGenerateBill}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Bill'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedTenant(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="manage-bills-tab">
          <div className="bills-filters">
            <div className="filter-group">
              <label>Month:</label>
              <select 
                value={filters.month} 
                onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                className="form-control"
              >
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Year:</label>
              <input 
                type="number" 
                value={filters.year} 
                onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="form-control"
                min="2023"
                max="2030"
              />
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select 
                value={filters.status} 
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-control"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="bills-list">
            {loading ? (
              <div className="loading-state">Loading bills...</div>
            ) : allBills.length === 0 ? (
              <div className="empty-state">No bills found</div>
            ) : (
              allBills.map(bill => (
                <div key={bill._id} className={`bill-item ${bill.status} enhanced-bill-item`}>
                  <div className="bill-header">
                    <div className="bill-title-section">
                      <h5>{bill.tenant?.name}</h5>
                      <span className="bill-room">Room {bill.room?.roomNumber}</span>
                    </div>
                    <div className="bill-header-actions">
                      <span className={`status-badge ${bill.status}`}>
                        {bill.status?.toUpperCase()}
                      </span>
                      <button 
                        className="btn btn-danger btn-sm delete-btn"
                        onClick={() => confirmDelete(bill)}
                        title="Delete Bill"
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bill-details-grid">
                    <div className="bill-basic-info">
                      <div className="detail-item">
                        <Calendar size={14} />
                        <span className="detail-label">Period:</span>
                        <span className="detail-value">{monthNames[bill.month - 1]} {bill.year}</span>
                      </div>
                      <div className="detail-item">
                        <Clock size={14} />
                        <span className="detail-label">Due Date:</span>
                        <span className="detail-value">{new Date(bill.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <Receipt size={14} />
                        <span className="detail-label">Bill Number:</span>
                        <span className="detail-value">{bill.billNumber || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="bill-amounts">
                      <div className="amount-item total-amount">
                        <DollarSign size={16} />
                        <div className="amount-details">
                          <span className="amount-label">Total Amount</span>
                          <span className="amount-value">₹{bill.totalAmount?.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {bill.paidAmount > 0 && (
                        <div className="amount-item paid-amount">
                          <CheckCircle size={16} />
                          <div className="amount-details">
                            <span className="amount-label">Paid Amount</span>
                            <span className="amount-value">₹{bill.paidAmount?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {bill.remainingAmount > 0 && (
                        <div className="amount-item remaining-amount">
                          <AlertCircle size={16} />
                          <div className="amount-details">
                            <span className="amount-label">Remaining</span>
                            <span className="amount-value">₹{bill.remainingAmount?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {bill.payments && bill.payments.length > 0 && (
                    <div className="bill-payments-summary">
                      <span className="payments-label">
                        <CreditCard size={12} /> {bill.payments.length} payment{bill.payments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="payments-tab">
          <h4>Payment Verification</h4>
          <div className="payment-verification-list">
            {loading ? (
              <div className="loading-state">Loading payments...</div>
            ) : (
              allBills
                .filter(bill => bill.payments && bill.payments.length > 0)
                .map(bill => (
                  <div key={bill._id} className="payment-verification-item">
                    <div className="payment-header">
                      <h5>{bill.tenant?.name} - {monthNames[bill.month - 1]} {bill.year}</h5>
                      <span className="bill-amount">₹{bill.totalAmount}</span>
                    </div>
                    {bill.payments.map(payment => (
                      <div key={payment._id} className="payment-item">
                        <div className="payment-details">
                          <div className="detail-item">
                            <span>Amount:</span>
                            <span>₹{payment.amount}</span>
                          </div>
                          <div className="detail-item">
                            <span>Method:</span>
                            <span>{payment.paymentMethod}</span>
                          </div>
                          <div className="detail-item">
                            <span>Date:</span>
                            <span>{new Date(payment.paidAt).toLocaleDateString()}</span>
                          </div>
                          <div className="detail-item">
                            <span>Status:</span>
                            <span className={`status ${payment.status}`}>{payment.status}</span>
                          </div>
                        </div>
                        
                        {payment.paymentScreenshot && (
                          <div className="screenshot-section">
                            <h6>Payment Screenshot</h6>
                            <div className="screenshot-viewer">
                              <img 
                                src={payment.paymentScreenshot.filename} 
                                alt="Payment Screenshot"
                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                              />
                              <div className="screenshot-actions">
                                {!payment.paymentScreenshot.verified && (
                                  <>
                                    <button 
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleVerifyPayment(payment._id, true, 'Screenshot verified')}
                                    >
                                      <CheckCircle size={14} /> Verify
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleVerifyPayment(payment._id, false, 'Invalid screenshot')}
                                    >
                                      <XCircle size={14} /> Reject
                                    </button>
                                  </>
                                )}
                                {payment.paymentScreenshot.verified && (
                                  <span className="verified-badge">
                                    <CheckCircle size={14} /> Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-header">
              <h4>Confirm Bill Deletion</h4>
            </div>
            <div className="delete-confirmation-content">
              <div className="warning-icon">
                <AlertCircle size={48} color="#ff6b6b" />
              </div>
              <div className="delete-message">
                <p><strong>Are you sure you want to delete this bill?</strong></p>
                {deleteConfirmation.bill && (
                  <div className="bill-details-to-delete">
                    <p>Bill: <strong>{deleteConfirmation.bill.billNumber || 'N/A'}</strong></p>
                    <p>Tenant: <strong>{deleteConfirmation.bill.tenant?.name || 'Unknown'}</strong></p>
                    <p>Period: <strong>{monthNames[deleteConfirmation.bill.month - 1]} {deleteConfirmation.bill.year}</strong></p>
                    <p>Amount: <strong>₹{deleteConfirmation.bill.totalAmount?.toLocaleString()}</strong></p>
                  </div>
                )}
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="delete-confirmation-actions">
              <button 
                className="btn btn-secondary"
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => deleteConfirmation.bill && handleDeleteBill(deleteConfirmation.bill._id)}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line no-unused-vars
const Modal = ({ isOpen, onClose, type, data: _data, customContent }) => {
  const { user } = useUser()
  const { ownerInfo, updateOwnerInfo } = useOwner()
  const { addNotification, notifications, deleteNotification } = useRealTimeNotifications()
  // eslint-disable-next-line no-unused-vars
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)

  // Robust toast helpers to avoid UI crashes if toast context is missing
  const safeToast = {
    success: (m) => { try { toast.success(m) } catch (e) { console.log('[toast success err]', e) } },
    error: (m) => { try { toast.error(m) } catch (e) { console.log('[toast error err]', e) } }
  }

  // Add Rooms modal local state (always defined to keep hooks order stable)
  const [addRoomsTab, setAddRoomsTab] = useState('create') // 'create' | 'assign'
  const [roomsList, setRoomsList] = useState([])
  const [assignForm, setAssignForm] = useState({ roomId: '', name: '', email: '', phone: '', moveInDate: '', securityDepositPaid: '' })
  const [generatedCreds, setGeneratedCreds] = useState(null)
  const [assignStatus, setAssignStatus] = useState('idle') // idle | creatingRoom | assigningTenant | success | error
  const [assignError, setAssignError] = useState('')

  // Rooms management (View/Edit Rooms)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomSearch, setRoomSearch] = useState('')
  const [floorFilter, setFloorFilter] = useState('all')
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    floor: '',
    type: '1BHK',
    size: '',
    rent: '',
    securityDeposit: '',
    utilities: {
      electricity: { included: false, rate: 0 },
      water: { included: true, rate: 0 },
      gas: { included: false, rate: 0 },
      internet: { included: false, rate: 0 },
      parking: { included: false, rate: 0 },
      maintenance: { included: true, rate: 0 }
    }
  })
  const [tenantForm, setTenantForm] = useState({ tenantId: '', username: '', name: '', email: '', phone: '', moveInDate: '', securityDepositPaid: '' })
  const [savingEdits, setSavingEdits] = useState(false)

  // Load rooms when opening Add Rooms or View/Edit Rooms modal
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRoomsLoading(true)
        const token = localStorage.getItem('token')
        if (!token) return
        const resp = await fetch(`${getApiUrl()}/admin/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (resp.ok) {
          const data = await resp.json()
          setRoomsList(data.rooms || [])
        }
      } catch (e) {
        // non-fatal
      } finally {
        setRoomsLoading(false)
      }
    }
    if (isOpen && (type === 'addRoom' || type === 'roomDetails')) {
      loadRooms()
      setGeneratedCreds(null)
    }

    // Listen for rooms updates broadcast
    const onRoomsUpdated = () => loadRooms()
    window.addEventListener('roomsUpdated', onRoomsUpdated)
    return () => window.removeEventListener('roomsUpdated', onRoomsUpdated)
  }, [isOpen, type])

  // View Tenants modal state and effects
  const [tenantsList, setTenantsList] = useState([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [editTenantId, setEditTenantId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', roomId: '' })
  
  // Notification modal tenants state
  const [notificationTenants, setNotificationTenants] = useState([])
  const [notificationTenantsLoading, setNotificationTenantsLoading] = useState(false)
  
    useEffect(() => {
      let wsHandler
      const fetchTenants = async () => {
        try {
          console.log('🔄 Fetching tenants for viewTenants modal')
          setTenantsLoading(true)
          const token = localStorage.getItem('token')
          if (!token) {
            console.error('❌ No token found for tenant fetch')
            toast.error('Please login again')
            return
          }
          
          console.log('📡 Making API call to fetch tenants')
          const resp = await fetch(`${getApiUrl()}/admin/tenants`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
          
          console.log('📋 Tenants API response status:', resp.status)
          
          if (resp.ok) {
            const data = await resp.json()
            console.log('✅ Tenants data received:', data)
            setTenantsList(data.tenants || [])
          } else {
            console.error('❌ Failed to fetch tenants:', resp.status)
            const errorText = await resp.text()
            console.error('Error details:', errorText)
            // Set mock data as fallback
            setTenantsList([
              {
                _id: 'demo-1',
                name: 'John Demo User',
                username: 'john.demo',
                email: 'john@demo.com',
                phone: '+1-555-0001',
                status: 'active',
                room: { roomNumber: '101', _id: 'room-1' }
              },
              {
                _id: 'demo-2',
                name: 'Jane Demo User',
                username: 'jane.demo',
                email: 'jane@demo.com',
                phone: '+1-555-0002',
                status: 'active',
                room: { roomNumber: '102', _id: 'room-2' }
              }
            ])
            toast.error('Using demo tenant data - API unavailable')
          }
        } catch (error) {
          console.error('❌ Error fetching tenants:', error)
          // Set mock data as fallback
          setTenantsList([
            {
              _id: 'demo-1',
              name: 'John Demo User',
              username: 'john.demo',
              email: 'john@demo.com',
              phone: '+1-555-0001',
              status: 'active',
              room: { roomNumber: '101', _id: 'room-1' }
            },
            {
              _id: 'demo-2',
              name: 'Jane Demo User',
              username: 'jane.demo',
              email: 'jane@demo.com',
              phone: '+1-555-0002',
              status: 'active',
              room: { roomNumber: '102', _id: 'room-2' }
            }
          ])
          toast.error('Using demo tenant data - Network error')
        } finally {
          setTenantsLoading(false)
        }
      }
      
      if (isOpen && type === 'viewTenants') {
        console.log('🚀 ViewTenants modal opened, fetching data')
        fetchTenants()
        wsHandler = (e) => {
          const p = e?.detail
          if (!p?.userId) return
          setTenantsList(prev => prev.map(t => t._id === p.userId ? { ...t, name: p.name || t.name, email: p.email || t.email, phone: p.phone || 
t.phone, profilePhoto: p.profilePhoto || t.profilePhoto, room: p.room || t.room } : t))
        }
        window.addEventListener('TENANT_PROFILE_UPDATED', wsHandler)
        window.addEventListener('tenantProfileUpdated', wsHandler)
      }
      return () => {
        if (wsHandler) {
          window.removeEventListener('TENANT_PROFILE_UPDATED', wsHandler)
          window.removeEventListener('tenantProfileUpdated', wsHandler)
        }
      }
    }, [isOpen, type])
  // Load tenants for notification modal
  useEffect(() => {
    const fetchNotificationTenants = async () => {
      try {
        setNotificationTenantsLoading(true)
        const token = localStorage.getItem('token')
        if (!token) return
        const resp = await fetch(`${getApiUrl()}/admin/tenants`, { headers: { Authorization: `Bearer ${token}` } })
        if (resp.ok) {
          const data = await resp.json()
          // Transform tenants to match expected format
          const transformedTenants = data.tenants?.map(tenant => ({
            id: tenant._id,
            name: tenant.name,
            roomNumber: tenant.room?.roomNumber || 'N/A',
            email: tenant.email,
            phone: tenant.phone
          })) || []
          setNotificationTenants(transformedTenants)
        }
      } catch (error) {
        console.error('Error fetching tenants for notifications:', error)
      } finally {
        setNotificationTenantsLoading(false)
      }
    }
    if (isOpen && type === 'postNotifications') {
      fetchNotificationTenants()
    }
  }, [isOpen, type])

  // Open edit form for a room
  const openEditRoom = (room) => {
    setEditingRoom(room)
    setRoomForm({
      roomNumber: room.roomNumber || '',
      floor: typeof room.floor === 'number' ? String(room.floor) : (room.floor || ''),
      type: room.type || '1BHK',
      size: room.size || '',
      rent: typeof room.rent === 'number' ? String(room.rent) : (room.rent || ''),
      securityDeposit: typeof room.securityDeposit === 'number' ? String(room.securityDeposit) : (room.securityDeposit || ''),
      utilities: {
        electricity: { included: room.utilities?.electricity?.included ?? false, rate: room.utilities?.electricity?.rate ?? 0 },
        water: { included: room.utilities?.water?.included ?? true, rate: room.utilities?.water?.rate ?? 0 },
        gas: { included: room.utilities?.gas?.included ?? false, rate: room.utilities?.gas?.rate ?? 0 },
        internet: { included: room.utilities?.internet?.included ?? false, rate: room.utilities?.internet?.rate ?? 0 },
        parking: { included: room.utilities?.parking?.included ?? false, rate: room.utilities?.parking?.rate ?? 0 },
        maintenance: { included: room.utilities?.maintenance?.included ?? true, rate: room.utilities?.maintenance?.rate ?? 0 }
      }
    })
    if (room.currentTenant) {
      setTenantForm({
        tenantId: room.currentTenant._id,
        username: room.currentTenant.username || '',
        name: room.currentTenant.name || '',
        email: room.currentTenant.email || '',
        phone: room.currentTenant.phone || '',
        moveInDate: room.currentTenant.moveInDate ? new Date(room.currentTenant.moveInDate).toISOString().slice(0,10) : '',
        securityDepositPaid: typeof room.currentTenant.securityDepositPaid === 'number' ? String(room.currentTenant.securityDepositPaid) : (room.currentTenant.securityDepositPaid || '')
      })
    } else {
      setTenantForm({ tenantId: '', username: '', name: '', email: '', phone: '', moveInDate: '', securityDepositPaid: '' })
    }
  }

  const handleDeleteRoom = async (room) => {
    if (room.currentTenant) {
      safeToast.error('Vacate the room before deletion')
      return
    }
    if (!window.confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) return
    try {
      setRoomsLoading(true)
      const token = localStorage.getItem('token')
      const resp = await fetch(`${getApiUrl()}/admin/rooms/${room._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete room')
      }
      safeToast.success('Room deleted')
      // Refresh
      const listResp = await fetch(`${getApiUrl()}/admin/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      if (listResp.ok) {
        const listData = await listResp.json()
        setRoomsList(listData.rooms || [])
      }
      // notify other tabs
      window.dispatchEvent(new Event('roomsUpdated'))
    } catch (e) {
      console.error('Delete room failed', e)
      safeToast.error(e.message || 'Failed to delete room')
    } finally {
      setRoomsLoading(false)
    }
  }

  // Save room and tenant edits
  const saveRoomAndTenantEdits = async (e) => {
    e?.preventDefault?.()
    if (!editingRoom) return
    try {
      setSavingEdits(true)
      const token = localStorage.getItem('token')
      // Update room
      const roomResp = await fetch(`${getApiUrl()}/admin/rooms/${editingRoom._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomNumber: roomForm.roomNumber,
          floor: roomForm.floor === '' ? undefined : Number(roomForm.floor),
          type: roomForm.type,
          size: roomForm.size,
          rent: roomForm.rent === '' ? undefined : Number(roomForm.rent),
          securityDeposit: roomForm.securityDeposit === '' ? undefined : Number(roomForm.securityDeposit),
          utilities: roomForm.utilities
        })
      })
      const roomResult = await roomResp.json().catch(() => ({}))
      if (!roomResp.ok || !roomResult.success) {
        throw new Error(roomResult.error || 'Failed to update room')
      }

      // Update tenant if present
      if (tenantForm.tenantId) {
        const tResp = await fetch(`${getApiUrl()}/admin/tenants/${tenantForm.tenantId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: tenantForm.name,
            email: tenantForm.email,
            phone: tenantForm.phone,
            moveInDate: tenantForm.moveInDate || undefined,
            securityDepositPaid: tenantForm.securityDepositPaid === '' ? undefined : Number(tenantForm.securityDepositPaid)
          })
        })
        const tResult = await tResp.json().catch(() => ({}))
        if (!tResp.ok || !tResult.success) {
          throw new Error(tResult.error || 'Failed to update tenant')
        }
      }

      safeToast.success('Room updated successfully')
      // Refresh rooms
      try {
        setRoomsLoading(true)
        const listResp = await fetch(`${getApiUrl()}/admin/rooms`, { headers: { Authorization: `Bearer ${token}` } })
        if (listResp.ok) {
          const listData = await listResp.json()
          setRoomsList(listData.rooms || [])
        }
      } finally { setRoomsLoading(false) }

      setEditingRoom(null)
    } catch (err) {
      console.error('Error saving edits:', err)
      safeToast.error(err?.message || 'Failed to save changes')
    } finally {
      setSavingEdits(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Handle notification posting
      if (type === 'postNotifications') {
        const formData = new FormData(e.target)
        let notificationType = formData.get('notificationType')
        const category = formData.get('category')
        const title = formData.get('title')
        const message = formData.get('message')
        let priority = formData.get('priority')
        const selectedTenants = formData.getAll('selectedTenants')
        
        // Set defaults if form data is missing
        if (!notificationType) notificationType = 'common'
        if (!priority) priority = 'low'
        
        if (!title || !message) {
          toast.error('Please fill in all required fields')
          setLoading(false)
          return
        }
        
        // Debug log form data
        console.log('🔍 [Modal] Form data from postNotifications:')
        console.log('- notificationType:', notificationType, '(type:', typeof notificationType, ')')
        console.log('- category:', category)
        console.log('- title:', title)
        console.log('- message:', message)
        console.log('- priority:', priority)
        console.log('- selectedTenants:', selectedTenants)
        
        // Create notification object with backend-compatible format
        const notificationData = {
          type: notificationType || 'common',
          title: title,
          message: message,
          category: category || 'info',
          priority: priority || 'low',
          // Convert tenantIds to proper format for backend
          tenantIds: notificationType === 'personal' && selectedTenants.length > 0 
            ? selectedTenants.map(id => id.toString()) 
            : undefined
        }
        
        console.log('🚀 [Modal] Created notification object for backend:', notificationData)
        
        // Add the notification using the real-time context
        await addNotification(notificationData)
        
        console.log('✅ [Modal] Notification sent via addNotification function')
        
        // Show success message
        const recipientText = notificationType === 'common' ? 'all tenants' : 'selected tenant(s)'
        toast.success(`Notification sent to ${recipientText}!`)
        
        setLoading(false)
        onClose()
        return
      }
      
      // Simulate API call for other actions
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`${type} action completed successfully!`)
      setLoading(false)
      onClose()
    } catch (error) {
      toast.error('Failed to complete action')
      setLoading(false)
    }
  }

  const renderModalContent = () => {
    switch (type) {
      case 'addRoom':
        return (
          <div className="modal-content">
            <div className="modal-header">
              <h3><Plus size={18} /> Create Room and Assign Tenant</h3>
              <button className="btn-icon" onClick={onClose}><X size={18} /></button>
            </div>

            <form
              className="form-grid"
              onSubmit={async (e) => {
                e.preventDefault()
                setLoading(true)
                setGeneratedCreds(null)
                setAssignError('')
                setAssignStatus('creatingRoom')
                try {
                  console.log('[AddRooms] Submit clicked')
                  const token = localStorage.getItem('token')
                  const fd = new FormData(e.currentTarget)

                  // Room details
                  const roomPayload = {
                    roomNumber: fd.get('roomNumber')?.toString().trim(),
                    floor: Number(fd.get('floor') || 0),
                    type: fd.get('type') || '1BHK',
                    rent: Number(fd.get('rent') || 0),
                    securityDeposit: Number(fd.get('securityDeposit') || 0)
                  }
                  console.log('[AddRooms] Room payload', roomPayload)
                  if (!roomPayload.roomNumber) {
                    safeToast.error('Room number is required')
                    setLoading(false)
                    return
                  }

                  // Tenant details (required)
                  const tenantPayload = {
                    name: fd.get('name')?.toString() || '',
                    email: fd.get('email')?.toString() || '',
                    phone: fd.get('phone')?.toString() || '',
                    moveInDate: fd.get('moveInDate')?.toString() || new Date().toISOString(),
                    securityDepositPaid: Number(fd.get('securityDepositPaid') || 0)
                  }
                  console.log('[AddRooms] Tenant payload', tenantPayload)
                  if (!tenantPayload.name || !tenantPayload.phone) {
                    safeToast.error('Tenant name and phone are required')
                    setLoading(false)
                    return
                  }

                  // Step 1: Create room or reuse existing if same number exists
                  let createdRoomId = null
                  let createdRoomObj = null
                  let respRoom
                  try {
                    respRoom = await fetch(`${getApiUrl()}/admin/rooms`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(roomPayload)
                    })
                  } catch (netErr) {
                    throw new Error('Network error while creating room')
                  }
                  let roomText = ''
                  try { roomText = await respRoom.text() } catch {}
                  let roomData = {}
                  try { roomData = roomText ? JSON.parse(roomText) : {} } catch { roomData = {} }
                  console.log('[AddRooms] Room resp status', respRoom.status, 'body', roomData)
                  if (!respRoom.ok || !roomData.success) {
                    const msg = (roomData && (roomData.error || roomData.message)) || ''
                    if (msg.toLowerCase().includes('room number already exists')) {
                      // load rooms and find the existing one
                      const listResp = await fetch(`${getApiUrl()}/admin/rooms`, { headers: { Authorization: `Bearer ${token}` } })
                      const listData = await listResp.json()
                      const found = (listData.rooms || []).find(r => (r.roomNumber || '').toString().toLowerCase() === roomPayload.roomNumber.toLowerCase())
                      if (!found) throw new Error('Room number already exists, but could not fetch existing room')
                      if (found.status === 'occupied') throw new Error('Room already exists and is occupied')
                      createdRoomId = found._id
                      createdRoomObj = found
                    } else {
                      throw new Error(msg || `Failed to add room (status ${respRoom.status})`)
                    }
                  } else {
                    createdRoomId = roomData.room._id
                    createdRoomObj = roomData.room
                    window.dispatchEvent(new CustomEvent('roomsUpdated', { detail: roomData.room }))
                  }

                  // Step 2: Assign tenant
                  setAssignStatus('assigningTenant')
                  let respAssign
                  try {
                    respAssign = await fetch(`${getApiUrl()}/admin/rooms/${createdRoomId}/assign-tenant`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(tenantPayload)
                    })
                  } catch (netErr2) {
                    throw new Error('Network error while assigning tenant')
                  }
                  let assignText = ''
                  try { assignText = await respAssign.text() } catch {}
                  let assignData = {}
                  try { assignData = assignText ? JSON.parse(assignText) : {} } catch { assignData = {} }
                  console.log('[AddRooms] Assign resp status', respAssign.status, 'body', assignData)
                  if (!respAssign.ok || !assignData.success) {
                    throw new Error(assignData.error || `Failed to assign tenant (status ${respAssign.status})`)
                  }

                  setGeneratedCreds({ username: assignData.tenant.generatedUsername, password: assignData.tenant.generatedPassword })
                  setAssignStatus('success')
                  safeToast.success(`Room ${createdRoomObj?.roomNumber || ''} ready and tenant assigned`)
                } catch (err) {
                  setAssignStatus('error')
                  setAssignError(err?.message || 'Failed to create room and assign tenant')
                  safeToast.error(err?.message || 'Failed to create room and assign tenant')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <h4>Room Details</h4>
              </div>
              <div className="form-group">
                <label>Room Number</label>
                <input name="roomNumber" placeholder="e.g., 305" className="form-control" />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input name="floor" type="number" placeholder="e.g., 3" className="form-control" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" className="form-control" defaultValue="1BHK">
                  <option>Studio</option>
                  <option>1BHK</option>
                  <option>2BHK</option>
                  <option>3BHK</option>
                  <option>Single</option>
                  <option>Shared</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rent (₹/month)</label>
                <input name="rent" type="number" placeholder="e.g., 1800" className="form-control" />
              </div>
              <div className="form-group">
                <label>Security Deposit (₹)</label>
                <input name="securityDeposit" type="number" placeholder="e.g., 3500" className="form-control" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / span 2', marginTop: '8px' }}>
                <h4>Tenant Details</h4>
              </div>
              <div className="form-group">
                <label>Tenant Name</label>
                <input name="name" className="form-control" placeholder="Tenant full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" className="form-control" placeholder="name@example.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" className="form-control" placeholder="+1-555-000-0000" />
              </div>
              <div className="form-group">
                <label>Move-in Date (optional)</label>
<input name="moveInDate" type="date" className="form-control" />
              </div>
              <div className="form-group">
                <label>Security Deposit Paid</label>
                <input name="securityDepositPaid" type="number" className="form-control" placeholder="0" />
              </div>

              {/* Inline status feedback to avoid blank UI if any error occurs */}
              <div style={{ gridColumn: '1 / span 2' }}>
                {assignStatus === 'creatingRoom' && <div className="info-box">Creating room…</div>}
                {assignStatus === 'assigningTenant' && <div className="info-box">Assigning tenant…</div>}
                {assignStatus === 'error' && <div className="info-box" style={{ color: 'red' }}>{assignError}</div>}
                {assignStatus === 'success' && <div className="info-box" style={{ color: 'green' }}>Saved in database. Credentials ready below.</div>}
              </div>

              <div className="form-actions" style={{ gridColumn: '1 / span 2' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (<><Save size={16} /> Save & Assign</>)}
                </button>
              </div>

              {generatedCreds && (
                <div className="info-box" style={{ gridColumn: '1 / span 2', marginTop: '8px' }}>
                  <strong>Generated Credentials:</strong>
                  <div>Username: {generatedCreds.username}</div>
                  <div>Password: {generatedCreds.password}</div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        try {
                          const text = `Username: ${generatedCreds.username}\nPassword: ${generatedCreds.password}`
                          if (navigator?.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(text)
                          } else {
                            const ta = document.createElement('textarea')
                            ta.value = text
                            ta.style.position = 'fixed'
                            ta.style.opacity = '0'
                            document.body.appendChild(ta)
                            ta.focus()
                            ta.select()
                            document.execCommand('copy')
                            document.body.removeChild(ta)
                          }
                          toast.success('Credentials copied to clipboard')
                        } catch (e) {
                          toast.error('Failed to copy credentials')
                        }
                      }}
                    >
                      <Copy size={14} /> Copy credentials
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )

      case 'viewTenants':
        console.log('🏠 ViewTenants modal rendering, tenantsList:', tenantsList.length, 'loading:', tenantsLoading)
        try {
          return (
          <div className="modal-content tenants-management-enhanced">
            <div className="tenants-header-enhanced">
              <div className="header-left">
                <div className="header-title">
                  <Users size={24} className="header-icon" />
                  <div>
                    <h3>Tenant Management</h3>
                    <p className="tenant-count">
                      {tenantsLoading ? 'Loading tenants...' : `${tenantsList.length} active tenants`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <div className="search-container">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tenants..." 
                    className="search-input"
                  />
                </div>
                <button 
                  className="btn btn-secondary btn-refresh" 
                  onClick={() => window.dispatchEvent(new Event('roomsUpdated'))}
                  title="Refresh tenant data"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button className="btn-close" onClick={onClose}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="tenants-grid">
              {tenantsList.length === 0 ? (
                <div className="empty-tenants-state">
                  <Users size={64} className="empty-icon" />
                  <h4>No Tenants Found</h4>
                  <p>No tenants are currently registered in the system.</p>
                </div>
              ) : (
                tenantsList.map(tenant => (
                  <div key={tenant._id} className="tenant-card">
                    <div className="tenant-card-header">
                      <div className="tenant-avatar">
                        {tenant.profilePhoto ? (
                          <img 
                            src={tenant.profilePhoto} 
                            alt={tenant.name} 
                            className="tenant-photo"
                          />
                        ) : (
                          <User size={32} className="default-avatar" />
                        )}
                      </div>
                      <div className="tenant-basic-info">
                        {editTenantId === tenant._id ? (
                          <input 
                            className="form-control tenant-name-edit" 
                            value={editForm.name} 
                            onChange={(e)=>setEditForm({...editForm,name:e.target.value})} 
                            placeholder="Tenant name"
                          />
                        ) : (
                          <h4 className="tenant-name">{tenant.name}</h4>
                        )}
                        <div className="tenant-meta">
                          <span className="tenant-username">@{tenant.username}</span>
                          <span className={`tenant-status status-${tenant.status?.toLowerCase() || 'active'}`}>
                            {tenant.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="tenant-details">
                      <div className="detail-row">
                        <div className="detail-icon">
                          <Building size={16} />
                        </div>
                        <div className="detail-info">
                          <label>Room</label>
                          {editTenantId === tenant._id ? (
                            <input 
                              className="form-control" 
                              value={editForm.roomId} 
                              onChange={(e)=>setEditForm({...editForm,roomId:e.target.value})} 
                              placeholder={tenant.room?.roomNumber || 'Not assigned'} 
                            />
                          ) : (
                            <span>{tenant.room?.roomNumber || 'Not assigned'}</span>
                          )}
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-icon">
                          <Phone size={16} />
                        </div>
                        <div className="detail-info">
                          <label>Phone</label>
                          {editTenantId === tenant._id ? (
                            <input 
                              className="form-control" 
                              value={editForm.phone} 
                              onChange={(e)=>setEditForm({...editForm,phone:e.target.value})} 
                              placeholder="Phone number"
                            />
                          ) : (
                            <span>{tenant.phone || 'Not provided'}</span>
                          )}
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-icon">
                          <Mail size={16} />
                        </div>
                        <div className="detail-info">
                          <label>Email</label>
                          {editTenantId === tenant._id ? (
                            <input 
                              className="form-control" 
                              value={editForm.email} 
                              onChange={(e)=>setEditForm({...editForm,email:e.target.value})} 
                              placeholder="Email address"
                            />
                          ) : (
                            <span>{tenant.email || 'Not provided'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="tenant-card-actions">
                      {editTenantId === tenant._id ? (
                        <div className="edit-actions">
                          <button 
                            className="btn btn-primary btn-save" 
                            onClick={async()=>{
                              try {
                                const token = localStorage.getItem('token')
                                const payload = { name: editForm.name, email: editForm.email, phone: editForm.phone }
                                if (editForm.roomId) payload.roomId = editForm.roomId
                                const resp = await fetch(`${getApiUrl()}/admin/tenants/${tenant._id}`, {
                                  method: 'PUT', 
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                                  body: JSON.stringify(payload) 
                                })
                                const data = await resp.json()
                                if (!resp.ok || !data.success) throw new Error(data.error || 'Update failed')
                                setTenantsList(prev=>prev.map(x=>x._id===tenant._id?data.tenant:x))
                                setEditTenantId(null)
                                toast.success('Tenant updated successfully')
                              } catch(err){ 
                                toast.error(err.message) 
                              }
                            }}
                          >
                            <CheckCircle size={16} />
                            Save Changes
                          </button>
                          <button 
                            className="btn btn-secondary btn-cancel" 
                            onClick={()=>setEditTenantId(null)}
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="card-actions">
                          <div className="primary-actions">
                            <button 
                              className="btn btn-primary btn-download"
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token')
                                  if (!token) {
                                    toast.error('Please login to download reports')
                                    return
                                  }
                                  const response = await fetch(`${getApiUrl()}/admin/tenants/${tenant._id}/payment-report`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  })
                                  if (response.ok) {
                                    const blob = await response.blob()
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `Payment_Report_${tenant.name?.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xlsx`
                                    document.body.appendChild(a)
                                    a.click()
                                    a.remove()
                                    window.URL.revokeObjectURL(url)
                                    toast.success('Payment report downloaded successfully')
                                  } else {
                                    throw new Error('Failed to download report')
                                  }
                                } catch (error) {
                                  console.error('Error downloading tenant report:', error)
                                  // Generate demo report as fallback
                                  const demoData = [
                                    {
                                      'Tenant Name': tenant.name,
                                      'Room Number': tenant.room?.roomNumber || 'N/A',
                                      'Payment Date': '2024-01-15',
                                      'Amount': '₹12,000',
                                      'Method': 'Bank Transfer',
                                      'Status': 'Completed',
                                      'Bill Number': 'BILL-2024-001'
                                    },
                                    {
                                      'Tenant Name': tenant.name,
                                      'Room Number': tenant.room?.roomNumber || 'N/A',
                                      'Payment Date': '2024-02-15',
                                      'Amount': '₹12,000',
                                      'Method': 'UPI',
                                      'Status': 'Completed',
                                      'Bill Number': 'BILL-2024-002'
                                    }
                                  ]
                                  const csvContent = [
                                    Object.keys(demoData[0]).join(','),
                                    ...demoData.map(row => Object.values(row).join(','))
                                  ].join('\n')
                                  const blob = new Blob([csvContent], { type: 'text/csv' })
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `Payment_Report_${tenant.name?.replace(/\s+/g, '_')}_Demo.csv`
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  toast.success('Demo payment report downloaded')
                                }
                              }}
                              title="Download payment report for this tenant"
                            >
                              <Download size={16} />
                              Download Report
                            </button>
                            <button 
                              className="btn btn-secondary btn-documents"
                              onClick={() => {
                                // Handle documents viewing
                                if (tenant.documents && tenant.documents.length > 0) {
                                  // Show documents modal (to be implemented)
                                  toast.info('Documents viewer will be implemented')
                                } else {
                                  toast.info('No documents uploaded by this tenant')
                                }
                              }}
                              title="View tenant documents"
                            >
                              <FileText size={16} />
                              Documents
                            </button>
                          </div>
                          
                          <div className="secondary-actions">
                            <button 
                              className="btn btn-outline btn-edit"
                              onClick={()=>{ 
                                setEditTenantId(tenant._id); 
                                setEditForm({ 
                                  name: tenant.name||'', 
                                  email: tenant.email||'', 
                                  phone: tenant.phone||'', 
                                  roomId: tenant.room?._id||'' 
                                })
                              }}
                              title="Edit tenant information"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button 
                              className="btn btn-danger btn-remove"
                              onClick={async()=>{
                                if (!confirm(`Are you sure you want to remove ${tenant.name}? This will vacate their room.`)) return
                                try {
                                  const token = localStorage.getItem('token')
                                  const resp = await fetch(`${getApiUrl()}/admin/tenants/${tenant._id}`, {
                                    method: 'DELETE', 
                                    headers: { Authorization: `Bearer ${token}` } 
                                  })
                                  const data = await resp.json()
                                  if (!resp.ok || !data.success) throw new Error(data.error || 'Delete failed')
                                  setTenantsList(prev=>prev.filter(x=>x._id!==tenant._id))
                                  toast.success(`${tenant.name} removed successfully`)
                                  window.dispatchEvent(new CustomEvent('roomsUpdated'))
                                } catch(err){ 
                                  toast.error(err.message) 
                                }
                              }}
                              title="Remove tenant from system"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
        } catch (error) {
          console.error('❌ ViewTenants rendering error:', error)
          return (
            <div className="modal-content">
              <h3>Tenant Management</h3>
              <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
                <h4>Error Loading Tenants</h4>
                <p>There was an error loading the tenant management interface.</p>
                <p>Error: {error.message}</p>
                <button className="btn btn-primary" onClick={onClose}>Close</button>
              </div>
            </div>
          )
        }

      case 'ownerProfile':
        return (
          <div className="modal-content owner-profile-modal">
            <div className="profile-tabs">
              <button className="tab-btn active">Basic Info</button>
              <button className="tab-btn">Building Details</button>
              <button className="tab-btn">Billing Settings</button>
              <button className="tab-btn">Documents</button>
            </div>
            
            {/* Basic Info Tab */}
            <div className="tab-content">
              <h3>Owner Profile Information</h3>
              
              <div className="profile-photo-section">
                <div className="current-photo">
                  <User size={48} />
                </div>
                <div className="photo-actions">
                  <button className="btn btn-secondary btn-sm">
                    <Upload size={14} /> Change Photo
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={ownerInfo.fullName || user?.name || ""}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    defaultValue={ownerInfo.email || user?.email || ""}
                    placeholder="Enter email"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    defaultValue={ownerInfo.primaryPhone || user?.phone || ""}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    defaultValue={ownerInfo.residentialAddress || ""}
                    placeholder="Enter your address"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button className="btn btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
            
            {/* Building Details Tab */}
            <div className="tab-content" style={{display: 'none'}}>
              <h3>Building Information</h3>
              
              <div className="building-overview">
                <div className="building-card">
                  <Building size={24} />
                  <div>
                    <h4>{ownerInfo.buildingName || "Building Name"}</h4>
                    <p>{ownerInfo.buildingAddress || "Building Address"}</p>
                  </div>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Building Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={ownerInfo.buildingName || ""}
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Floors</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    defaultValue={ownerInfo.totalFloors || ""}
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Units</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    defaultValue={ownerInfo.totalUnits || ""}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Building Address</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    defaultValue={ownerInfo.buildingAddress || ""}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Available Unit Types</label>
                  <div className="unit-types">
                    {['1BHK', '2BHK', '3BHK', 'Studio'].map(type => (
                      <label key={type} className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Billing Settings Tab */}
            <div className="tab-content" style={{display: 'none'}}>
              <h3>Billing & Finance Settings</h3>
              
              {/* Bank Details */}
              <div className="settings-section">
                <h4><Banknote size={20} /> Bank Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input type="text" className="form-control" defaultValue={ownerInfo.bankName || ""} />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input type="text" className="form-control" defaultValue={ownerInfo.accountNumber || ""} />
                  </div>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input type="text" className="form-control" defaultValue={ownerInfo.upiId || ""} />
                  </div>
                </div>
              </div>
              
              {/* Default Rent Rates */}
              <div className="settings-section">
                <h4><Home size={20} /> Default Rent Rates</h4>
                <div className="rent-rates">
                  {[
                    {type: '1BHK', rate: 1200},
                    {type: '2BHK', rate: 1800},
                    {type: '3BHK', rate: 2500},
                    {type: 'Studio', rate: 950}
                  ].map(unit => (
                    <div key={unit.type} className="rate-item">
                      <label>{unit.type}</label>
                      <div className="rate-input">
                        <span>₹</span>
                        <input type="number" defaultValue={unit.rate} />
                        <span>/month</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Utility Rates */}
              <div className="settings-section">
                <h4><Calculator size={20} /> Utility Rates</h4>
                <div className="utility-rates">
                  <div className="utility-item">
                    <Zap size={16} />
                    <label>Electricity (per unit)</label>
                    <div className="rate-input">
                      <span>₹</span>
                      <input type="number" step="0.1" defaultValue="8.5" />
                    </div>
                  </div>
                  <div className="utility-item">
                    <Droplets size={16} />
                    <label>Water (flat rate)</label>
                    <div className="rate-input">
                      <span>₹</span>
                      <input type="number" defaultValue="50" />
                    </div>
                  </div>
                  <div className="utility-item">
                    <Wrench size={16} />
                    <label>Maintenance (flat rate)</label>
                    <div className="rate-input">
                      <span>₹</span>
                      <input type="number" defaultValue="100" />
                    </div>
                  </div>
                  <div className="utility-item">
                    <Car size={16} />
                    <label>Parking (flat rate)</label>
                    <div className="rate-input">
                      <span>₹</span>
                      <input type="number" defaultValue="75" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Penalty Rules */}
              <div className="settings-section">
                <h4><AlertCircle size={20} /> Penalty Rules</h4>
                <div className="penalty-settings">
                  <div className="form-group">
                    <label>Late Fee (per day)</label>
                    <div className="rate-input">
                      <span>₹</span>
                      <input type="number" defaultValue="50" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Grace Period (days)</label>
                    <input type="number" className="form-control" defaultValue="3" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documents Tab */}
            <div className="tab-content" style={{display: 'none'}}>
              <h3>Document Management</h3>
              
              <div className="upload-section">
                <div className="upload-area">
                  <Upload size={32} />
                  <p>Click to upload or drag and drop</p>
                  <small>PDF, JPG, PNG files up to 10MB</small>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{display: 'none'}} />
                </div>
                <button className="btn btn-primary">
                  <Upload size={16} /> Upload Documents
                </button>
              </div>
              
              <div className="documents-list">
                {[
                  { name: 'Property Ownership Certificate', type: 'PDF', date: '2024-01-15' },
                  { name: 'Property Tax Certificate', type: 'PDF', date: '2024-02-01' },
                  { name: 'Building Permit', type: 'PDF', date: '2024-01-20' },
                  { name: 'Fire Safety Certificate', type: 'PDF', date: '2024-03-01' }
                ].map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="doc-icon">
                      <FileText size={20} />
                    </div>
                    <div className="doc-info">
                      <h5>{doc.name}</h5>
                      <p>{doc.type} • Uploaded {doc.date}</p>
                    </div>
                    <div className="doc-actions">
                      <button className="btn-icon">
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon">
                        <Download size={16} />
                      </button>
                      <button className="btn-icon danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'viewBalance': {
        const currentBalance = user?.profileData?.currentBalance || 2450
        const pendingBills = user?.profileData?.pendingBills || 0
        const securityDeposit = user?.profileData?.securityDeposit || user?.securityDeposit || 3000
        const monthlyRent = user?.profileData?.rentAmount || user?.rentAmount || 1500
        const depositStatus = user?.profileData?.depositStatus || 'paid'
        
        return (
          <div className="modal-content balance-modal">
            <h3>Account Balance & Deposits</h3>
            
            <div className="balance-overview">
              <div className="balance-card primary">
                <div className="balance-icon">
                  <DollarSign size={24} />
                </div>
                <div className="balance-info">
                  <p>Current Balance</p>
                  <h2>${currentBalance}</h2>
                  <small>Available for payments</small>
                </div>
              </div>
              
              <div className="balance-card warning">
                <div className="balance-icon">
                  <Receipt size={24} />
                </div>
                <div className="balance-info">
                  <p>Outstanding Bills</p>
                  <h2>${pendingBills}</h2>
                  <small>{pendingBills > 0 ? 'Payment required' : 'All clear!'}</small>
                </div>
              </div>
            </div>
            
            {/* Security Deposit Section */}
            <div className="deposit-section">
              <div className="deposit-header">
                <Shield size={20} />
                <h4>Security Deposit Information</h4>
              </div>
              
              <div className="deposit-card">
                <div className="deposit-details">
                  <div className="deposit-amount">
                    <span className="label">Deposit Amount</span>
                    <span className="amount">${securityDeposit}</span>
                  </div>
                  <div className="deposit-status">
                    <span className="label">Status</span>
                    <span className={`status ${depositStatus}`}>
                      {depositStatus === 'paid' ? 'Secured' : 'Pending'}
                      {depositStatus === 'paid' && <Shield size={14} />}
                    </span>
                  </div>
                </div>
                
                <div className="deposit-info">
                  <div className="info-row">
                    <Calendar size={16} />
                    <span>One-time payment made at lease signing</span>
                  </div>
                  <div className="info-row">
                    <AlertCircle size={16} />
                    <span>Refundable upon lease termination (subject to conditions)</span>
                  </div>
                </div>
                
                {depositStatus === 'paid' && (
                  <div className="deposit-note">
                    <p><strong>Note:</strong> Your security deposit is safely held by the property management and will be returned within 30 days of lease termination, minus any applicable deductions for damages or unpaid bills.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Rental Information */}
            <div className="rental-summary">
              <h4>Rental Summary</h4>
              <div className="rental-details">
                <div className="rental-item">
                  <span>Monthly Rent</span>
                  <span className="amount">${monthlyRent}</span>
                </div>
                <div className="rental-item">
                  <span>Security Deposit</span>
                  <span className="amount">${securityDeposit}</span>
                </div>
                <div className="rental-item">
                  <span>Room Number</span>
                  <span>{user?.roomNumber || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className="transactions-section">
              <h4>Recent Transactions</h4>
              <div className="transaction-list">
                <div className="transaction">
                  <div className="transaction-info">
                    <span className="desc">Monthly Rent - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <span className="date">{new Date().toLocaleDateString()}</span>
                  </div>
                  <span className="amount negative">-${monthlyRent}</span>
                </div>
                <div className="transaction">
                  <div className="transaction-info">
                    <span className="desc">Security Deposit Payment</span>
                    <span className="date">At lease signing</span>
                  </div>
                  <span className="amount security">-${securityDeposit} (Secured)</span>
                </div>
                <div className="transaction">
                  <div className="transaction-info">
                    <span className="desc">Utility Bill Payment</span>
                    <span className="date">{new Date(Date.now() - 7*24*60*60*1000).toLocaleDateString()}</span>
                  </div>
                  <span className="amount negative">-$85</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      case 'payBills':
        return (
          <div className="modal-content">
            <h3>Pay Bills</h3>
            <form onSubmit={handleSubmit}>
              <div className="bills-list">
                <div className="bill-item">
                  <input type="checkbox" id="bill1" defaultChecked />
                  <label htmlFor="bill1">
                    <div>
                      <p>February 2025 Rent</p>
                      <small>Due: 28 Feb 2025</small>
                    </div>
                    <span>₹1,200</span>
                  </label>
                </div>
                <div className="bill-item">
                  <input type="checkbox" id="bill2" defaultChecked />
                  <label htmlFor="bill2">
                    <div>
                      <p>Electricity Bill</p>
                      <small>Due: 28 Feb 2025</small>
                    </div>
                    <span>₹95</span>
                  </label>
                </div>
                <div className="bill-item">
                  <input type="checkbox" id="bill3" />
                  <label htmlFor="bill3">
                    <div>
                      <p>Water Bill</p>
                      <small>Due: 28 Feb 2025</small>
                    </div>
                    <span>₹50</span>
                  </label>
                </div>
              </div>
              <div className="payment-total">
                <strong>Total: ₹1,295</strong>
              </div>
              <div className="payment-method">
                <label>Payment Method</label>
                <select className="form-control">
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </div>
        )

      case 'viewTenants':
        return (
          <div className="modal-content tenants-management">
            <div className="tenants-header">
              <h3>Tenant Management</h3>
              <div className="tenants-controls">
                <div className="search-filter">
                  <div className="search-box">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search tenants..."
                      className="form-control"
                    />
                  </div>
                  <select className="form-control">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                  </select>
                </div>
                <button className="btn btn-primary">
                  <UserPlus size={16} /> Add New Tenant
                </button>
              </div>
            </div>
            
            <div className="tenants-grid">
              {tenants.map(tenant => {
                const tenantBills = bills.filter(b => b.tenantId === tenant.id)
                const currentBill = tenantBills.find(b => b.month.includes('2025')) || tenantBills[tenantBills.length - 1]
                const totalDue = currentBill ? currentBill.totalAmount + currentBill.penalty : 0
                
                return (
                  <div key={tenant.id} className="tenant-card detailed">
                    <div className="tenant-header">
                      <div className="tenant-avatar">
                        <User size={24} />
                      </div>
                      <div className="tenant-basic-info">
                        <h4>{tenant.name}</h4>
                        <p>Room {tenant.roomNumber}</p>
                        <div className={`tenant-status ${tenant.status}`}>
                          {tenant.status === 'active' && <CheckCircle size={14} />}
                          {tenant.status === 'overdue' && <XCircle size={14} />}
                          {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                        </div>
                      </div>
                      <div className="tenant-actions-menu">
                        <button className="btn-icon">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="tenant-details">
                      <div className="detail-row">
                        <div className="detail-item">
                          <Phone size={16} />
                          <span>{tenant.phone}</span>
                        </div>
                        <div className="detail-item">
                          <Mail size={16} />
                          <span>{tenant.email}</span>
                        </div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-item">
                          <Calendar size={16} />
                          <span>Joined {tenant.joinDate}</span>
                        </div>
                      </div>
                      
                      <div className="payment-summary">
                        <div className="payment-item">
                          <span>Current Due</span>
                          <span className={`amount ${currentBill?.status === 'overdue' ? 'overdue' : 'normal'}`}>
                            ₹{totalDue.toLocaleString()}
                          </span>
                        </div>
                        {currentBill?.penalty > 0 && (
                          <div className="payment-item penalty">
                            <span>Penalty</span>
                            <span className="amount overdue">₹{currentBill.penalty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="tenant-documents">
                      <div className="documents-header">
                        <h5>Documents</h5>
                        <button className="btn-sm">
                          <Eye size={14} /> View All
                        </button>
                      </div>
                      <div className="documents-preview">
                        {[
                          'ID Proof',
                          'Address Proof',
                          'Agreement',
                          'Security Deposit Receipt'
                        ].slice(0, 3).map((doc, index) => (
                          <div key={index} className="doc-chip">
                            <FileText size={12} />
                            <span>{doc}</span>
                          </div>
                        ))}
                        {['ID Proof', 'Address Proof', 'Agreement', 'Security Deposit Receipt'].length > 3 && (
                          <div className="doc-chip more">
                            +{['ID Proof', 'Address Proof', 'Agreement', 'Security Deposit Receipt'].length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="tenant-actions">
                      <button className="btn btn-sm btn-outline">
                        <FileText size={14} /> View Profile
                      </button>
                      <button className="btn btn-sm btn-outline">
                        <Receipt size={14} /> Generate Bill
                      </button>
                      <button className="btn btn-sm btn-outline">
                        <Bell size={14} /> Send Notice
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="tenants-summary">
              <div className="summary-stats">
                <div className="summary-item">
                  <h4>{tenants.length}</h4>
                  <p>Total Tenants</p>
                </div>
                <div className="summary-item">
                  <h4>{tenants.filter(t => t.status === 'active').length}</h4>
                  <p>Active</p>
                </div>
                <div className="summary-item">
                  <h4>{bills.filter(b => b.status === 'overdue').length}</h4>
                  <p>Overdue</p>
                </div>
                <div className="summary-item">
                  <h4>₹{bills.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((sum, b) => sum + b.totalAmount + b.penalty, 0).toLocaleString()}</h4>
                  <p>Total Due</p>
                </div>
              </div>
              
              <div className="bulk-actions">
                <button className="btn btn-secondary">
                  <Bell size={16} /> Send Payment Reminders
                </button>
                <button className="btn btn-secondary">
                  <Download size={16} /> Export Tenant List
                </button>
              </div>
            </div>
          </div>
        )

      case 'addRoom':
        return (
          <div className="modal-content add-room-modal">
            <div className="modal-nav">
              <div className="nav-steps">
                <div className="step active">
                  <span>1</span>
                  <small>Room Details</small>
                </div>
                <div className="step">
                  <span>2</span>
                  <small>Financial Info</small>
                </div>
                <div className="step">
                  <span>3</span>
                  <small>Tenant Info</small>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Step 1: Room Details */}
              <div className="step-content">
                <h3>Room Details</h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Room/Unit Number *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g., 401, A-101"
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Floor *</label>
                    <select className="form-control" required>
                      <option value="">Select Floor</option>
                      {[1,2,3,4,5].map(floor => (
                        <option key={floor} value={floor}>{floor}{floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Room Type *</label>
                    <select className="form-control" required>
                      <option value="">Select Type</option>
                      <option value="1bhk">1 BHK</option>
                      <option value="2bhk">2 BHK</option>
                      <option value="3bhk">3 BHK</option>
                      <option value="studio">Studio Apartment</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Furnishing</label>
                    <select className="form-control">
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="fully-furnished">Fully Furnished</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Area (sq ft)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g., 650"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Max Occupancy</label>
                    <select className="form-control">
                      <option value="1">1 Person</option>
                      <option value="2">2 Persons</option>
                      <option value="3">3 Persons</option>
                      <option value="4">4+ Persons</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Room Description</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="Describe room features, amenities, etc."
                  />
                </div>
              </div>
              
              {/* Step 2: Financial Information */}
              <div className="step-content" style={{display: 'none'}}>
                <h3>Financial Information</h3>
                
                <div className="financial-section">
                  <div className="section-title">
                    <Banknote size={20} />
                    <h4>Rental Charges</h4>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Base Rent (per month) *</label>
                      <div className="amount-input">
                        <span>₹</span>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="1200"
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Security Deposit *</label>
                      <div className="amount-input">
                        <span>₹</span>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="3600"
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Advance Payment (months)</label>
                      <select className="form-control">
                        <option value="0">No Advance</option>
                        <option value="1">1 Month</option>
                        <option value="2">2 Months</option>
                        <option value="3">3 Months</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="financial-section">
                  <div className="section-title">
                    <Calculator size={20} />
                    <h4>Included Bills & Utilities</h4>
                  </div>
                  
                  <div className="utilities-grid">
                    {[
                      {name: 'Electricity', icon: Zap, default: false},
                      {name: 'Water', icon: Droplets, default: true},
                      {name: 'Maintenance', icon: Wrench, default: true},
                      {name: 'Parking', icon: Car, default: false},
                      {name: 'Internet', icon: Building, default: false}
                    ].map((utility) => (
                      <label key={utility.name} className="utility-checkbox">
                        <input type="checkbox" defaultChecked={utility.default} />
                        <div className="utility-info">
                          <utility.icon size={16} />
                          <span>{utility.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="financial-section">
                  <div className="section-title">
                    <Receipt size={20} />
                    <h4>Additional Charges (Optional)</h4>
                  </div>
                  
                  <div className="additional-charges">
                    <div className="charge-item">
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Charge name (e.g., Club Fee)"
                      />
                      <div className="amount-input">
                        <span>₹</span>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="0"
                        />
                      </div>
                      <button type="button" className="btn-icon">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 3: Tenant Information */}
              <div className="step-content" style={{display: 'none'}}>
                <h3>Tenant Information</h3>
                
                <div className="occupancy-status">
                  <div className="status-options">
                    <label className="radio-option">
                      <input type="radio" name="occupancy" value="available" defaultChecked />
                      <div className="option-content">
                        <div className="option-icon available">
                          <Home size={24} />
                        </div>
                        <div className="option-info">
                          <h4>Available</h4>
                          <p>Room is ready for new tenant</p>
                        </div>
                      </div>
                    </label>
                    
                    <label className="radio-option">
                      <input type="radio" name="occupancy" value="occupied" />
                      <div className="option-content">
                        <div className="option-icon occupied">
                          <Users size={24} />
                        </div>
                        <div className="option-info">
                          <h4>Add Tenant</h4>
                          <p>Assign tenant and generate credentials</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Tenant Details Form (shown when 'Add Tenant' is selected) */}
                <div className="tenant-form" style={{display: 'none'}}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter tenant's full name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="tenant@email.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input 
                        type="tel" 
                        className="form-control" 
                        placeholder="+1-234-567-8900"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Move-in Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="credential-generation">
                    <div className="credential-info">
                      <Shield size={20} />
                      <div>
                        <h4>Auto-generated Login Credentials</h4>
                        <p>Username and password will be automatically generated and sent to tenant's email</p>
                      </div>
                    </div>
                    
                    <div className="credential-preview">
                      <div className="credential-item">
                        <label>Username (auto-generated)</label>
                        <div className="credential-display">
                          <span id="generated-username">john.doe.401</span>
                          <button type="button" className="btn-icon">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="credential-item">
                        <label>Password (auto-generated)</label>
                        <div className="credential-display">
                          <span id="generated-password">••••••••</span>
                          <button type="button" className="btn-icon">
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="notification-options">
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>Send welcome email with login credentials</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" defaultChecked />
                        <span>Send SMS notification</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary">
                  <span className="prev-text">Previous</span>
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : (
                    <>
                      <span className="next-text">Next</span>
                      <span className="submit-text" style={{display: 'none'}}>Create Room & Generate Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )

      case 'monitorPayments':
        return <PaymentMonitoringDashboard onClose={onClose} />

      case 'changeProfilePhoto':
        return (
          <div className="modal-content">
            <h3>Change Profile Photo</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Upload Photo</label>
                <input type="file" accept="image/*" className="form-control" />
              </div>
              <div className="preview-section">
                <div className="current-photo">
                  <User size={48} />
                  <p>Current Photo</p>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </form>
          </div>
        )

      case 'viewProfile':
        return (
          <div className="modal-content">
            <h3>Profile Details</h3>
            <div className="profile-details">
              <div className="profile-avatar-large">
                <User size={64} />
              </div>
              <div className="profile-info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <span>{user?.role === 'owner' ? (ownerInfo.fullName || user?.name || 'N/A') : (user?.name || 'John Doe')}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{user?.role === 'owner' ? (ownerInfo.email || user?.email || 'N/A') : (user?.email || 'john.doe@email.com')}</span>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <span>{user?.role === 'owner' ? (ownerInfo.primaryPhone || user?.phone || 'N/A') : (user?.phone || '+1-234-567-8901')}</span>
                </div>
                <div className="info-item">
                  <label>{user?.role === 'owner' ? 'Building' : 'Room Number'}</label>
                  <span>{user?.role === 'owner' ? (ownerInfo.buildingName || 'N/A') : (user?.roomNumber || '101')}</span>
                </div>
                <div className="info-item">
                  <label>Join Date</label>
                  <span>{user?.joinDate || 'January 15, 2023'}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'editProfile':
        return (
          <div className="modal-content">
            <h3>Edit Profile</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" className="form-control" defaultValue={user?.role === 'owner' ? (ownerInfo.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || '') : (user?.name?.split(' ')[0] || 'John')} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-control" defaultValue={user?.role === 'owner' ? (ownerInfo.fullName?.split(' ')[1] || user?.name?.split(' ')[1] || '') : (user?.name?.split(' ')[1] || 'Doe')} required />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" defaultValue={user?.role === 'owner' ? (ownerInfo.email || user?.email || '') : (user?.email || 'john.doe@email.com')} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" className="form-control" defaultValue={user?.role === 'owner' ? (ownerInfo.primaryPhone || user?.phone || '') : (user?.phone || '+1-234-567-8901')} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea className="form-control" rows={3} defaultValue={user?.role === 'owner' ? (ownerInfo.residentialAddress || '') : (user?.address || '')} placeholder="Enter your address"></textarea>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )

      case 'postNotifications':
        return (
          <div className="modal-content notifications-modal">
            <h3>Post Notifications</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="notification-type-selector">
                <div className="type-options">
                  <label className="type-option">
                    <input 
                      type="radio" 
                      name="notificationType" 
                      value="common" 
                      defaultChecked 
                      onChange={(e) => {
                        const tenantSelection = document.querySelector('.tenant-selection')
                        if (tenantSelection) {
                          tenantSelection.style.display = e.target.value === 'personal' ? 'block' : 'none'
                        }
                      }}
                    />
                    <div className="option-card">
                      <div className="option-icon common">
                        <Users size={24} />
                      </div>
                      <div className="option-info">
                        <h4>Common Notification</h4>
                        <p>Send to all tenants</p>
                      </div>
                    </div>
                  </label>
                  
                  <label className="type-option">
                    <input 
                      type="radio" 
                      name="notificationType" 
                      value="personal"
                      onChange={(e) => {
                        const tenantSelection = document.querySelector('.tenant-selection')
                        if (tenantSelection) {
                          tenantSelection.style.display = e.target.value === 'personal' ? 'block' : 'none'
                        }
                      }}
                    />
                    <div className="option-card">
                      <div className="option-icon personal">
                        <User size={24} />
                      </div>
                      <div className="option-info">
                        <h4>Personal Notification</h4>
                        <p>Send to specific tenant(s)</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              {/* Tenant Selection (for personal notifications) */}
              <div className="tenant-selection" style={{display: 'none'}}>
                <label>Select Tenants</label>
                <div className="tenant-list">
                  {notificationTenantsLoading ? (
                    <div className="loading-message">Loading tenants...</div>
                  ) : notificationTenants.length > 0 ? (
                    notificationTenants.map(tenant => (
                      <label key={tenant.id} className="tenant-checkbox">
                        <input type="checkbox" name="selectedTenants" value={tenant.id} />
                        <div className="tenant-info">
                          <User size={16} />
                          <span>{tenant.name}</span>
                          <small>Room {tenant.roomNumber}</small>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="no-tenants-message">No tenants available</div>
                  )}
                </div>
              </div>
              
              <div className="notification-details">
                <div className="form-group">
                  <label>Notification Category</label>
                  <select name="category" className="form-control" required>
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="payment">Payment Related</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    className="form-control" 
                    placeholder="Enter notification title"
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label>Message *</label>
                  <textarea 
                    name="message"
                    className="form-control" 
                    rows={4}
                    placeholder="Enter your message..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Priority Level</label>
                  <div className="priority-options">
                    <label className="radio-pill">
                      <input type="radio" name="priority" value="low" defaultChecked />
                      <span className="priority-label low">Low</span>
                    </label>
                    <label className="radio-pill">
                      <input type="radio" name="priority" value="medium" />
                      <span className="priority-label medium">Medium</span>
                    </label>
                    <label className="radio-pill">
                      <input type="radio" name="priority" value="high" />
                      <span className="priority-label high">High</span>
                    </label>
                  </div>
                </div>
                
                <div className="notification-options">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Send email notification</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Send SMS notification</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Show in dashboard</span>
                  </label>
                </div>
                
                <div className="schedule-options">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Schedule for later</span>
                  </label>
                  
                  <div className="schedule-datetime" style={{display: 'none'}}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Date</label>
                        <input type="date" className="form-control" />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input type="time" className="form-control" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="notification-preview">
                <div className="preview-header">
                  <h4>Preview</h4>
                  <div className="preview-devices">
                    <button type="button" className="device-btn active">
                      <Building size={14} /> App
                    </button>
                    <button type="button" className="device-btn">
                      <Mail size={14} /> Email
                    </button>
                  </div>
                </div>
                
                <div className="preview-content">
                  <div className="preview-notification">
                    <div className="notification-icon info">
                      <Bell size={16} />
                    </div>
                    <div className="notification-text">
                      <h5>Sample Notification Title</h5>
                      <p>This is how your notification will appear to tenants...</p>
                      <small>Just now</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary">
                  <Save size={16} /> Save as Draft
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : (
                    <>
                      <Send size={16} /> Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )
        
      case 'roomDetails':
        return (
          <div className="modal-content room-management">
            <div className="room-header">
              <h3>Room Management</h3>
              <div className="room-controls">
                <div className="search-filter">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search rooms... (number, type, tenant)"
                    className="form-control"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="form-control"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  <option value="all">All Floors</option>
                  {Array.from(new Set(roomsList.map(r => (typeof r.floor === 'number' ? String(r.floor) : (r.floor || '')).trim()).values()))
                    .filter(Boolean)
                    .sort((a,b)=>Number(a)-Number(b))
                    .map(f => (
                      <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {roomsLoading ? (
              <div style={{ padding: '8px' }}>Loading rooms…</div>
            ) : (
              <div className="rooms-grid">
                {roomsList
                  .filter(room => {
                    const q = roomSearch.toLowerCase().trim()
                    const matchesQuery = !q ||
                      String(room.roomNumber || '').toLowerCase().includes(q) ||
                      String(room.type || '').toLowerCase().includes(q) ||
                      String(room.currentTenant?.name || '').toLowerCase().includes(q)
                    const matchesFloor = floorFilter === 'all' || String(room.floor ?? '') === String(floorFilter)
                    return matchesQuery && matchesFloor
                  })
                  .map(room => (
                  <div key={room._id} className={`room-card ${room.status}`}>
                    <div className="room-header">
                      <div className="room-number">{room.roomNumber}</div>
                      <div className={`room-status ${room.status}`}>
                        {room.status === 'occupied' && <Users size={14} />}
                        {room.status === 'vacant' && <Home size={14} />}
                        {room.status === 'maintenance' && <Wrench size={14} />}
                        {room.status?.charAt(0).toUpperCase() + room.status?.slice(1)}
                      </div>
                    </div>

                    <div className="room-details">
                      <div className="detail-item">
                        <span>Floor</span>
                        <span>{typeof room.floor === 'number' ? room.floor : (room.floor || '-') }</span>
                      </div>
                      <div className="detail-item">
                        <span>Type</span>
                        <span>{room.type}</span>
                      </div>
                      <div className="detail-item">
                        <span>Rent</span>
                        <span>₹{(room.rent ?? 0).toLocaleString()}/month</span>
                      </div>
                      <div className="detail-item">
                        <span>Security Deposit</span>
                        <span>₹{(room.securityDeposit ?? 0).toLocaleString()}</span>
                      </div>
                      {room.currentTenant && (
                        <div className="detail-item">
                          <span>Tenant</span>
                          <span>{room.currentTenant.name} ({room.currentTenant.username})</span>
                        </div>
                      )}
                    </div>

                    <div className="room-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEditRoom(room)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteRoom(room)}
                        disabled={!!room.currentTenant}
                        title={room.currentTenant ? 'Vacate room before deletion' : 'Delete room'}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {roomsList.length === 0 && (
                  <div style={{ padding: '8px' }}>No rooms found</div>
                )}
              </div>
            )}

            {editingRoom && (
              <div className="edit-section" style={{ marginTop: '16px' }}>
                <h4>Edit Room Details</h4>
                <form onSubmit={saveRoomAndTenantEdits}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Room Number</label>
                      <input
                        type="text"
                        value={roomForm.roomNumber}
                        onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Floor</label>
                      <input
                        type="number"
                        value={roomForm.floor}
                        onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={roomForm.type}
                        onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                        className="form-control"
                      >
                        <option value="1BHK">1BHK</option>
                        <option value="2BHK">2BHK</option>
                        <option value="3BHK">3BHK</option>
                        <option value="Studio">Studio</option>
                        <option value="Single">Single</option>
                        <option value="Shared">Shared</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Size</label>
                      <input
                        type="text"
                        value={roomForm.size}
                        onChange={(e) => setRoomForm({ ...roomForm, size: e.target.value })}
                        className="form-control"
                        placeholder="e.g., 400 sqft"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rent (₹/month)</label>
                      <input
                        type="number"
                        value={roomForm.rent}
                        onChange={(e) => setRoomForm({ ...roomForm, rent: e.target.value })}
                        className="form-control"
                        step="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Security Deposit (₹)</label>
                      <input
                        type="number"
                        value={roomForm.securityDeposit}
                        onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: e.target.value })}
                        className="form-control"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="utilities-section">
                    <div className="section-title">
                      <h4>Utilities</h4>
                    </div>
                    <div className="utilities-grid">
                      {Object.entries(roomForm.utilities).map(([utility, details]) => (
                        <div key={utility} className="utility-config">
                          <label>
                            <input
                              type="checkbox"
                              checked={details.included}
                              onChange={(e) => setRoomForm({
                                ...roomForm,
                                utilities: {
                                  ...roomForm.utilities,
                                  [utility]: {
                                    ...details,
                                    included: e.target.checked
                                  }
                                }
                              })}
                            />
                            {utility.charAt(0).toUpperCase() + utility.slice(1)} Included
                          </label>
                          {!details.included && (
                            <input
                              type="number"
                              placeholder="Rate"
                              value={details.rate}
                              onChange={(e) => setRoomForm({
                                ...roomForm,
                                utilities: {
                                  ...roomForm.utilities,
                                  [utility]: {
                                    ...details,
                                    rate: parseInt(e.target.value) || 0
                                  }
                                }
                              })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {tenantForm.tenantId && (
                    <div className="settings-section">
                      <div className="section-title">
                        <Users size={18} />
                        <h4>Current Tenant</h4>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Tenant Name</label>
                          <input
                            type="text"
                            value={tenantForm.username}
                            className="form-control"
                            disabled
                          />
                        </div>
                        <div className="form-group">
                          <label>Tenant full name</label>
                          <input
                            type="text"
                            value={tenantForm.name}
                            onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            value={tenantForm.email}
                            onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            value={tenantForm.phone}
                            onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label>Move-in Date (optional)</label>
                          <input
                            type="date"
                            placeholder="mm/dd/yyyy"
                            value={tenantForm.moveInDate}
                            onChange={(e) => setTenantForm({ ...tenantForm, moveInDate: e.target.value })}
                            className="form-control"
                          />
                        </div>
                        <div className="form-group">
                          <label>Security Deposit Paid</label>
                          <input
                            type="number"
                            value={tenantForm.securityDepositPaid}
                            onChange={(e) => setTenantForm({ ...tenantForm, securityDepositPaid: e.target.value })}
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingRoom(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={savingEdits}>
                      {savingEdits ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )

      case 'notificationHistory':
        return (
          <div className="modal-content notification-history-modal">
            <div className="notification-history-header">
              <h3>Notification History</h3>
              <div className="history-stats">
                <div className="stat-item">
                  <span className="stat-number">{notifications.length}</span>
                  <span className="stat-label">Total Sent</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{notifications.filter(n => n.type === 'common').length}</span>
                  <span className="stat-label">Common</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{notifications.filter(n => n.type === 'personal').length}</span>
                  <span className="stat-label">Personal</span>
                </div>
              </div>
            </div>
            
            <div className="notification-filters">
              <div className="filter-group">
                <label>Filter by Type:</label>
                <select className="form-control" defaultValue="all">
                  <option value="all">All Notifications</option>
                  <option value="common">Common Only</option>
                  <option value="personal">Personal Only</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Filter by Priority:</label>
                <select className="form-control" defaultValue="all">
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
            
            <div className="notification-history-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <Bell size={48} />
                  <h4>No Notifications Sent</h4>
                  <p>You haven't sent any notifications yet. Click "Post Notifications" to send your first message to tenants.</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div key={notification._id || notification.id} className={`history-notification-item ${notification.type}`}>
                    <div className="notification-header">
                      <div className="notification-type-badge">
                        {notification.type === 'common' ? (
                          <><Users size={14} /> Common</>
                        ) : (
                          <><User size={14} /> Personal</>
                        )}
                      </div>
                      <div className={`priority-badge ${notification.priority}`}>
                        {notification.priority?.toUpperCase()}
                      </div>
                      <div className="notification-date">
                        {new Date(notification.createdAt || notification.date || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <div className="notification-meta">
                        <span className={`category-tag ${notification.category}`}>
                          {notification.category?.toUpperCase()}
                        </span>
                        {notification.tenantId && (
                          <span className="tenant-info">
                            Sent to: {tenants.find(t => t.id === notification.tenantId)?.name || 'Unknown Tenant'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="notification-actions">
                      <button className="btn btn-sm btn-outline" title="View Details">
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger" 
                        title="Delete Notification"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this notification?')) {
                            console.log('🗑️ [Modal] Deleting notification:', notification.id || notification._id)
                            try {
                              await deleteNotification(notification._id || notification.id)
                              console.log('✅ [Modal] Notification deleted successfully')
                            } catch (error) {
                              console.error('❌ [Modal] Delete failed:', error)
                            }
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="history-actions">
                <button className="btn btn-secondary">
                  <Download size={16} /> Export History
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all notification history? This action cannot be undone.')) {
                      console.log('🗑️ [Modal] Clearing all notifications:', notifications.length)
                      try {
                        for (const notification of notifications) {
                          await deleteNotification(notification._id || notification.id)
                        }
                        toast.success('Notification history cleared!')
                      } catch (error) {
                        console.error('❌ [Modal] Clear all failed:', error)
                        toast.error('Failed to clear some notifications')
                      }
                    }
                  }}
                >
                  <Trash2 size={16} /> Clear All History
                </button>
              </div>
            )}
          </div>
        )

      case 'manageBills':
        return <ManageBillsModal onClose={onClose} />

      case 'payment':
        // Allow custom content injection (e.g., PaymentModal from caller)
        if (customContent) return customContent
        return (
          <div className="modal-content">
            <h3>Make a Payment</h3>
            <p>Please select a payment method in your dashboard.</p>
          </div>
        )

      default:
        return (
          <div className="modal-content">
            <h3>Feature Coming Soon</h3>
            <p>This feature is currently under development and will be available soon.</p>
          </div>
        )
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {renderModalContent()}
      </div>
    </div>
  )

}

export default Modal
