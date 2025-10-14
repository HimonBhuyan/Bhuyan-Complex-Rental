import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';

// Use dynamic API URL

// Custom hook for managing owner dashboard data
export const useOwnerDashboardData = () => {
  const [dashboardData, setDashboardData] = useState({
    tenants: [],
    totalRevenue: 0,
    pendingRevenue: 0,
    activeTenants: 0,
    pendingBills: 0,
    overdueBills: 0,
    rooms: [],
    bills: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch all tenants
  const fetchTenants = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${getApiUrl()}/admin/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch tenants');
      
      const data = await response.json();
      return data.tenants || [];
    } catch (err) {
      console.error('Error fetching tenants:', err);
      return [];
    }
  }, []);

  // Fetch all bills for revenue calculations
  const fetchBills = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${getApiUrl()}/admin/bills`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch bills');
      
      const data = await response.json();
      return data.bills || [];
    } catch (err) {
      console.error('Error fetching bills:', err);
      return [];
    }
  }, []);

  // Fetch payment summary
  const fetchPaymentSummary = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch(`${getApiUrl()}/admin/payments/summary?month=${currentMonth}&year=${currentYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payment summary');
      
      const data = await response.json();
      return data.summary || {};
    } catch (err) {
      console.error('Error fetching payment summary:', err);
      return {};
    }
  }, []);

  // Fetch all rooms
  const fetchRooms = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${getApiUrl()}/admin/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch rooms');
      
      const data = await response.json();
      return data.rooms || [];
    } catch (err) {
      console.error('Error fetching rooms:', err);
      return [];
    }
  }, []);

  // Calculate dashboard metrics from raw data
  const calculateMetrics = useCallback((tenants, bills, paymentSummary, rooms) => {
    // Active tenants count
    const activeTenants = tenants.filter(tenant => tenant.status === 'active').length;

    // Calculate total revenue from paid bills
    const paidBills = bills.filter(bill => bill.status === 'paid');
    const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.totalAmount + (bill.penalty?.amount || 0), 0);

    // Calculate pending revenue from pending/overdue bills
    const unpaidBills = bills.filter(bill => bill.status === 'pending' || bill.status === 'overdue');
    const pendingRevenue = unpaidBills.reduce((sum, bill) => sum + bill.totalAmount + (bill.penalty?.amount || 0), 0);

    // Count pending and overdue bills
    const pendingBills = bills.filter(bill => bill.status === 'pending').length;
    const overdueBills = bills.filter(bill => bill.status === 'overdue').length;

    // Calculate occupancy rate
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      activeTenants,
      totalRevenue,
      pendingRevenue,
      pendingBills,
      overdueBills,
      occupancyRate,
      occupiedRooms,
      totalRooms
    };
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data concurrently
      const [tenants, bills, paymentSummary, rooms] = await Promise.all([
        fetchTenants(),
        fetchBills(),
        fetchPaymentSummary(),
        fetchRooms()
      ]);

      // Calculate metrics
      const metrics = calculateMetrics(tenants, bills, paymentSummary, rooms);

      // Update state
      setDashboardData(prev => ({
        ...prev,
        tenants,
        bills,
        rooms,
        ...metrics,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString()
      }));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchTenants, fetchBills, fetchPaymentSummary, fetchRooms, calculateMetrics]);

  // Refresh data manually
  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    ...dashboardData,
    loading,
    error,
    refreshData,
    fetchDashboardData
  };
};

export default useOwnerDashboardData;