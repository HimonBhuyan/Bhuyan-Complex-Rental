// Mock data for the rental management system

export const tenants = [
  {
    id: 1,
    username: 'john.doe',
    name: 'John Doe',
    roomNumber: '101',
    phone: '+1-234-567-8901',
    email: 'john.doe@email.com',
    joinDate: '2023-01-15',
    status: 'active'
  },
  {
    id: 2,
    username: 'jane.smith',
    name: 'Jane Smith',
    roomNumber: '202',
    phone: '+1-234-567-8902',
    email: 'jane.smith@email.com',
    joinDate: '2023-03-10',
    status: 'active'
  },
  {
    id: 3,
    username: 'mike.wilson',
    name: 'Mike Wilson',
    roomNumber: '303',
    phone: '+1-234-567-8903',
    email: 'mike.wilson@email.com',
    joinDate: '2023-02-20',
    status: 'active'
  }
]

export const billCategories = [
  { id: 1, name: 'Rent', amount: 1200 },
  { id: 2, name: 'Electricity', amount: 0 }, // Variable
  { id: 3, name: 'Water', amount: 50 },
  { id: 4, name: 'Maintenance', amount: 100 },
  { id: 5, name: 'Parking', amount: 75 }
]

export const bills = [
  // January 2025 bills
  {
    id: 1,
    tenantId: 1,
    month: 'January 2025',
    dueDate: '2025-01-31',
    status: 'paid',
    paidDate: '2025-01-28',
    items: [
      { category: 'Rent', amount: 1200 },
      { category: 'Electricity', amount: 85 },
      { category: 'Water', amount: 50 },
      { category: 'Maintenance', amount: 100 }
    ],
    totalAmount: 1435,
    penalty: 0
  },
  {
    id: 2,
    tenantId: 2,
    month: 'January 2025',
    dueDate: '2025-01-31',
    status: 'pending',
    items: [
      { category: 'Rent', amount: 1200 },
      { category: 'Electricity', amount: 92 },
      { category: 'Water', amount: 50 },
      { category: 'Maintenance', amount: 100 },
      { category: 'Parking', amount: 75 }
    ],
    totalAmount: 1517,
    penalty: 0
  },
  {
    id: 3,
    tenantId: 3,
    month: 'January 2025',
    dueDate: '2025-01-31',
    status: 'overdue',
    items: [
      { category: 'Rent', amount: 1200 },
      { category: 'Electricity', amount: 78 },
      { category: 'Water', amount: 50 },
      { category: 'Maintenance', amount: 100 }
    ],
    totalAmount: 1428,
    penalty: 150 // ₹50 per day for 3 days
  },
  // February 2025 bills
  {
    id: 4,
    tenantId: 1,
    month: 'February 2025',
    dueDate: '2025-02-28',
    status: 'pending',
    items: [
      { category: 'Rent', amount: 1200 },
      { category: 'Electricity', amount: 88 },
      { category: 'Water', amount: 50 },
      { category: 'Maintenance', amount: 100 }
    ],
    totalAmount: 1438,
    penalty: 0
  },
  {
    id: 5,
    tenantId: 2,
    month: 'February 2025',
    dueDate: '2025-02-28',
    status: 'pending',
    items: [
      { category: 'Rent', amount: 1200 },
      { category: 'Electricity', amount: 95 },
      { category: 'Water', amount: 50 },
      { category: 'Maintenance', amount: 100 },
      { category: 'Parking', amount: 75 }
    ],
    totalAmount: 1520,
    penalty: 0
  }
]

export const notifications = [
  {
    id: 1,
    type: 'personal',
    tenantId: 1,
    title: 'Payment Reminder',
    message: 'Your February rent is due on 28th Feb 2025. Please make the payment on time to avoid penalties.',
    date: '2025-02-15',
    read: false,
    category: 'warning'
  },
  {
    id: 2,
    type: 'common',
    title: 'Water Supply Maintenance',
    message: 'Water supply will be disrupted on March 5th from 10 AM to 2 PM for routine maintenance. Please store water in advance.',
    date: '2025-02-20',
    category: 'info'
  },
  {
    id: 3,
    type: 'common',
    title: 'New Parking Rules',
    message: 'Effective March 1st, all vehicles must display parking permits. Contact the office to get your permit.',
    date: '2025-02-18',
    category: 'info'
  },
  {
    id: 4,
    type: 'personal',
    tenantId: 3,
    title: 'Overdue Payment',
    message: 'Your January bill is overdue. Please pay ₹1,578 (including penalty) immediately to avoid further charges.',
    date: '2025-02-10',
    read: false,
    category: 'error'
  },
  {
    id: 5,
    type: 'common',
    title: 'Building Maintenance Schedule',
    message: 'Annual building maintenance will begin from March 15th. Some facilities may be temporarily unavailable.',
    date: '2025-02-25',
    category: 'info'
  }
]

export const paymentHistory = [
  {
    id: 1,
    tenantId: 1,
    billId: 1,
    amount: 1435,
    date: '2025-01-28',
    method: 'Credit Card',
    transactionId: 'TXN001',
    status: 'completed'
  },
  {
    id: 2,
    tenantId: 2,
    amount: 1200,
    date: '2024-12-30',
    method: 'Bank Transfer',
    transactionId: 'TXN002',
    status: 'completed',
    note: 'December rent payment'
  },
  {
    id: 3,
    tenantId: 1,
    amount: 1380,
    date: '2024-12-28',
    method: 'UPI',
    transactionId: 'TXN003',
    status: 'completed',
    note: 'December rent payment'
  }
]

// Utility functions
export const getTenantById = (id) => tenants.find(tenant => tenant.id === id)

export const getBillsByTenantId = (tenantId) => 
  bills.filter(bill => bill.tenantId === tenantId)

export const getNotificationsByTenantId = (tenantId) => 
  notifications.filter(notification => 
    notification.type === 'common' || notification.tenantId === tenantId
  )

export const getPaymentHistoryByTenantId = (tenantId) => 
  paymentHistory.filter(payment => payment.tenantId === tenantId)

export const getAllOverdueBills = () => 
  bills.filter(bill => bill.status === 'overdue')

export const getAllPendingBills = () => 
  bills.filter(bill => bill.status === 'pending')

export const getTotalRevenue = () => 
  bills.filter(bill => bill.status === 'paid')
    .reduce((total, bill) => total + bill.totalAmount + bill.penalty, 0)

export const getPendingRevenue = () => 
  bills.filter(bill => bill.status === 'pending' || bill.status === 'overdue')
    .reduce((total, bill) => total + bill.totalAmount + bill.penalty, 0)