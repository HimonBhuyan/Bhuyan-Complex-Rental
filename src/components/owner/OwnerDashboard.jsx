import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useUser } from "../../context/UserContext";
import { useOwner } from "../../context/OwnerContext";
import { useRealTimeNotifications } from "../../context/RealTimeNotificationContext";
import { useOwnerDashboardData } from "../../hooks/useOwnerDashboardData";
import {
  Users,
  CreditCard,
  Bell,
  Home,
  Plus,
  DollarSign,
  AlertCircle,
  Settings,
  Eye,
  Edit,
  Building,
  Receipt,
  User,
  MapPin,
  FileText,
  Upload,
  Banknote,
  Shield,
  Calculator,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import SlidingNavbar from "../SlidingNavbar";
import Modal from "../Modal";
import OwnerProfile from "./OwnerProfile";
import { getApiUrl } from '../../utils/api';
import "./OwnerDashboard.css";

const OwnerDashboard = ({ onLogout }) => {
  const { user: currentUser } = useUser();
  const { ownerInfo } = useOwner();
  const {
    notifications: sentNotifications,
    deleteNotification,
    addNotification,
    forceRefresh,
    connectionStatus,
  } = useRealTimeNotifications();

  // Use real-time dashboard data hook
  const {
    tenants: tenantsData,
    bills: billsData,
    activeTenants,
    totalRevenue,
    pendingRevenue,
    pendingBills,
    overdueBills,
    occupancyRate,
    occupiedRooms,
    totalRooms,
    rooms,
    loading: dashboardLoading,
    error: dashboardError,
    refreshData,
    lastUpdated,
  } = useOwnerDashboardData();

  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem("owner-dashboard-theme");
    return savedTheme === "dark";
  });
  
  // Payment Monitoring Dashboard states
  const [paymentSummary, setPaymentSummary] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null,
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [animationState, setAnimationState] = useState("fadeIn");
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard' or 'profile'
  // Track last profile update for diagnostics
  const [lastProfileUpdated, setLastProfileUpdated] = useState(() =>
    localStorage.getItem("ownerProfileLastUpdated")
  );

  // Admin: rooms and forms

  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    floor: "",
    type: "1BHK",
    rent: "",
    securityDeposit: "",
  });
  const [assignForm, setAssignForm] = useState({
    roomId: "",
    name: "",
    email: "",
    phone: "",
    moveInDate: "",
    securityDepositPaid: "",
  });
  const [lastGeneratedCreds, setLastGeneratedCreds] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Owner profile data - would be loaded from backend/localStorage
  const [ownerProfile, setOwnerProfile] = useState({
    fullName: currentUser?.fullName || currentUser?.name || "John Anderson",
    email: currentUser?.email || "john.anderson@rentalpro.com",
    phone: currentUser?.phone || "+1-555-123-4567",
    address: currentUser?.address || "123 Main Street, Downtown",
    profilePhoto: currentUser?.profilePhoto || null,
    buildingInfo: {
      name: "Sunset Apartments",
      address: "456 Oak Avenue, City Center",
      totalFloors: 4,
      totalUnits: 16,
      unitTypes: ["1BHK", "2BHK", "3BHK", "Studio"],
    },
    billingSettings: {
      bankName: "First National Bank",
      accountNumber: "****1234",
      upiId: "john.anderson@paytm",
      defaultRentRates: {
        "1bhk": 1200,
        "2bhk": 1800,
        "3bhk": 2500,
        studio: 950,
      },
      utilityRates: {
        electricity: 8.5, // per unit
        water: 50, // flat rate
        maintenance: 100, // flat rate
        parking: 75, // flat rate
      },
      penaltyRules: {
        lateFeePerDay: 50,
        gracePeriod: 3, // days
      },
    },
    documents: [
      {
        id: 1,
        name: "Property Ownership Certificate",
        type: "pdf",
        uploadDate: "2024-01-15",
      },
      {
        id: 2,
        name: "Property Tax Certificate",
        type: "pdf",
        uploadDate: "2024-02-01",
      },
      { id: 3, name: "Building Permit", type: "pdf", uploadDate: "2024-01-20" },
      {
        id: 4,
        name: "Fire Safety Certificate",
        type: "pdf",
        uploadDate: "2024-03-01",
      },
    ],
  });

  const handleThemeToggle = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("owner-dashboard-theme", newTheme ? "dark" : "light");
  };

  const openModal = (type, data = null) => {
    if (type === "ownerProfile") {
      setCurrentView("profile");
      return;
    }
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  // Real-time update functionality
  useEffect(() => {
    // Add animation trigger when data updates
    if (lastUpdated) {
      setAnimationState("fadeIn");
      setTimeout(() => setAnimationState(""), 800);
    }
  }, [lastUpdated]);

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkTheme);
  }, [isDarkTheme]);

  // Admin: fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const resp = await fetch(`${getApiUrl()}/admin/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setRooms(data.rooms || []);
        }
      } catch (e) {
        console.warn("Failed to load rooms", e);
      }
    };
    fetchRooms();

    // Refresh rooms when modal adds a room
    const onRoomsUpdated = () => fetchRooms();
    window.addEventListener("roomsUpdated", onRoomsUpdated);
    return () => window.removeEventListener("roomsUpdated", onRoomsUpdated);
  }, []);

  // Listen for profile last-updated notifications and storage changes
  useEffect(() => {
    const handleLastUpdatedEvent = (e) => {
      const ts = e?.detail?.lastUpdated || new Date().toISOString();
      setLastProfileUpdated(ts);
    };
    const handleStorage = (e) => {
      if (e.key === "ownerProfileLastUpdated") {
        setLastProfileUpdated(e.newValue);
      }
    };
    window.addEventListener("ownerProfileLastUpdated", handleLastUpdatedEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(
        "ownerProfileLastUpdated",
        handleLastUpdatedEvent
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Add keyboard shortcut for theme toggle
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "T") {
        event.preventDefault();
        // Determine next theme based on current DOM state, then toggle once
        const willBeDark = !document.documentElement.classList.contains("dark");
        handleThemeToggle();
        toast.success(
          willBeDark ? "Switched to Dark Theme" : "Switched to Light Theme"
        );
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Admin: handlers
  const handleAddRoom = async (e) => {
    e?.preventDefault?.();
    setAdminLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        roomNumber: roomForm.roomNumber,
        floor: Number(roomForm.floor) || 0,
        type: roomForm.type,
        rent: Number(roomForm.rent) || 0,
        securityDeposit: Number(roomForm.securityDeposit) || 0,
      };
      const resp = await fetch(`${getApiUrl()}/admin/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data.error || "Failed to add room");
      toast.success("Room added successfully");
      setRooms((prev) => [...prev, data.room]);
      setRoomForm({
        roomNumber: "",
        floor: "",
        type: "1BHK",
        rent: "",
        securityDeposit: "",
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAssignTenant = async (e) => {
    e?.preventDefault?.();
    setAdminLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: assignForm.name,
        email: assignForm.email,
        phone: assignForm.phone,
        moveInDate: assignForm.moveInDate || new Date().toISOString(),
        securityDepositPaid: Number(assignForm.securityDepositPaid) || 0,
      };
      const resp = await fetch(
        `${getApiUrl()}/admin/rooms/${assignForm.roomId}/assign-tenant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data.error || "Failed to assign tenant");
      toast.success("Tenant assigned and credentials generated");
      setLastGeneratedCreds({
        username: data.tenant.generatedUsername,
        password: data.tenant.generatedPassword,
      });
      // refresh rooms list to reflect occupied
      const roomsResp = await fetch(`${getApiUrl()}/admin/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (roomsResp.ok) {
        const roomsData = await roomsResp.json();
        setRooms(roomsData.rooms || []);
      }
      // clear form
      setAssignForm({
        roomId: "",
        name: "",
        email: "",
        phone: "",
        moveInDate: "",
        securityDepositPaid: "",
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Load owner profile from localStorage on mount and sync with user context
  useEffect(() => {
    // Prefer canonical key written by the profile editor
    const savedProfile =
      localStorage.getItem("ownerCompleteProfile") ||
      localStorage.getItem("ownerProfile");
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        // Map to local shape if needed
        const mapped = profileData.basicInfo
          ? {
              fullName: profileData.basicInfo.fullName,
              email: profileData.basicInfo.email,
              phone: profileData.basicInfo.primaryPhone,
              address: profileData.basicInfo.residentialAddress,
              profilePhoto: profileData.basicInfo.profilePhoto,
              buildingInfo: { name: profileData.buildingDetails?.buildingName },
            }
          : profileData;
        setOwnerProfile((prev) => ({ ...prev, ...mapped }));
      } catch (error) {
        console.error("Error loading owner profile:", error);
      }
    }

    // Listen to storage changes for canonical key
    const handleStorage = (e) => {
      if (e.key === "ownerCompleteProfile" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          const mapped = updated.basicInfo
            ? {
                fullName: updated.basicInfo.fullName,
                email: updated.basicInfo.email,
                phone: updated.basicInfo.primaryPhone,
                address: updated.basicInfo.residentialAddress,
                profilePhoto: updated.basicInfo.profilePhoto,
                buildingInfo: { name: updated.buildingDetails?.buildingName },
              }
            : updated;
          setOwnerProfile((prev) => ({ ...prev, ...mapped }));
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Sync ownerProfile with currentUser changes for real-time updates
  useEffect(() => {
    if (currentUser) {
      setOwnerProfile((prev) => ({
        ...prev,
        fullName: currentUser.fullName || currentUser.name || prev.fullName,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        profilePhoto: currentUser.profilePhoto || prev.profilePhoto,
        // Merge any additional profile data
        ...currentUser.profileData,
      }));
    }
  }, [currentUser]);

  // Listen for force UI updates for immediate photo changes
  useEffect(() => {
    const handleForceUpdate = () => {
      // Force a re-render to ensure profile updates are visible
      setAnimationState("fadeIn");
      setTimeout(() => setAnimationState(""), 300);
    };

    window.addEventListener("forceUIUpdate", handleForceUpdate);
    return () => {
      window.removeEventListener("forceUIUpdate", handleForceUpdate);
    };
  }, []);

  // Listen explicitly for uppercase OWNER_PROFILE_UPDATED (from WS) to map to local ownerProfile
  useEffect(() => {
    const handler = (event) => {
      const payload = event?.detail;
      if (!payload) return;
      // Map nested payload to local ownerProfile state
      const basic = payload.basicInfo || payload.profileData?.basicInfo || {};
      const building =
        payload.buildingDetails || payload.profileData?.buildingDetails || {};
      setOwnerProfile((prev) => ({
        ...prev,
        fullName: payload.name || basic.fullName || prev.fullName,
        email: payload.email || basic.email || prev.email,
        phone: payload.phone || basic.primaryPhone || prev.phone,
        profilePhoto:
          payload.profilePhoto || basic.profilePhoto || prev.profilePhoto,
        buildingInfo: {
          ...(prev.buildingInfo || {}),
          name: building.buildingName || prev.buildingInfo?.name,
          address: building.buildingAddress || prev.buildingInfo?.address,
        },
      }));
    };
    window.addEventListener("OWNER_PROFILE_UPDATED", handler);
    return () => window.removeEventListener("OWNER_PROFILE_UPDATED", handler);
  }, []);

  // Save owner profile changes to localStorage - used by modals
  // eslint-disable-next-line no-unused-vars
  const updateOwnerProfile = (newData) => {
    const updatedProfile = { ...ownerProfile, ...newData };
    setOwnerProfile(updatedProfile);
    localStorage.setItem("ownerProfile", JSON.stringify(updatedProfile));

    // Dispatch custom event for real-time updates across tabs
    window.dispatchEvent(
      new CustomEvent("ownerProfileUpdated", {
        detail: updatedProfile,
      })
    );
  };

  // Listen for real-time updates from other tabs/windows
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      setOwnerProfile(event.detail);
      toast.success("Profile updated successfully!");
    };

    const handleStorageChange = (event) => {
      if (event.key === "ownerProfile" && event.newValue) {
        try {
          const updatedProfile = JSON.parse(event.newValue);
          setOwnerProfile(updatedProfile);
        } catch (error) {
          console.error("Error parsing updated profile:", error);
        }
      }
    };

    window.addEventListener("ownerProfileUpdated", handleProfileUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("ownerProfileUpdated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest(".profile-section")) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Fetch payment data when month/year changes or when payment monitoring modal opens
  useEffect(() => {
    if (modalState.type === 'monitorPayments' || currentView === 'paymentMonitoring') {
      fetchPaymentSummary();
      fetchRecentTransactions();
    }
  }, [selectedMonth, selectedYear, modalState.type]);

  // Listen for real-time payment updates
  useEffect(() => {
    const handlePaymentUpdate = (event) => {
      if (event.detail?.type === 'PAYMENT_DASHBOARD_UPDATE') {
        // Refresh payment data if we're viewing the current month
        const updateMonth = event.detail.month;
        const updateYear = event.detail.year;
        if (updateMonth === selectedMonth && updateYear === selectedYear) {
          fetchPaymentSummary();
          fetchRecentTransactions();
        }
      }
    };
    
    window.addEventListener('PAYMENT_DASHBOARD_UPDATE', handlePaymentUpdate);
    return () => window.removeEventListener('PAYMENT_DASHBOARD_UPDATE', handlePaymentUpdate);
  }, [selectedMonth, selectedYear]);

  // Use real-time stats from the hook
  const stats = {
    totalTenants: activeTenants,
    totalRevenue,
    pendingRevenue,
    overdueBills,
    pendingBills,
    occupancyRate,
    occupiedRooms,
    totalRooms,
  };

  // Enhanced functions for real-time updates - used by modals
  // eslint-disable-next-line no-unused-vars
  const handleCreateRoom = async (roomData, tenantData = null) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const roomId = Date.now();
      const newRoom = {
        id: roomId,
        ...roomData,
        status: tenantData ? "occupied" : "available",
        createdAt: new Date().toISOString(),
      };

      // If tenant data is provided, create tenant account
      if (tenantData) {
        const tenantId = Date.now() + 1;
        const username = `${tenantData.name
          .toLowerCase()
          .replace(/\s+/g, ".")}.${roomData.roomNumber}`;
        const password = Math.random().toString(36).slice(-8);

        const newTenant = {
          id: tenantId,
          username,
          password, // In real app, this would be hashed
          name: tenantData.name,
          email: tenantData.email,
          phone: tenantData.phone,
          roomNumber: roomData.roomNumber,
          joinDate:
            tenantData.moveInDate || new Date().toISOString().split("T")[0],
          status: "active",
        };

        setTenantsData((prev) => [...prev, newTenant]);

        // Simulate sending credentials via email/SMS
        toast.success(
          `Room created! Login credentials sent to ${tenantData.email}`,
          {
            duration: 4000,
          }
        );
      } else {
        toast.success("Room created successfully!");
      }

      // Save to localStorage for persistence
      const updatedRooms = JSON.parse(localStorage.getItem("rooms") || "[]");
      updatedRooms.push(newRoom);
      localStorage.setItem("rooms", JSON.stringify(updatedRooms));

      // Trigger real-time update event
      window.dispatchEvent(
        new CustomEvent("roomsUpdated", { detail: updatedRooms })
      );
    } catch {
      toast.error("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (notificationData) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Use the global notification system
      console.log(
        "🚀 [Admin] Creating notification via global system:",
        notificationData
      );
      addNotification(notificationData);

      // Show success message
      if (notificationData.type === "common") {
        toast.success(
          `Notification sent to all ${tenantsData.length} tenants!`
        );
      } else {
        const selectedCount = notificationData.tenantIds?.length || 1;
        toast.success(`Notification sent to ${selectedCount} tenant(s)!`);
      }

      console.log("✅ [Admin] Notification created and sent via global system");
    } catch (error) {
      console.error("❌ [Admin] Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  // Payment reminder function - used by modals
  // eslint-disable-next-line no-unused-vars
  const handlePaymentReminder = async (tenantIds = []) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reminderCount = tenantIds.length || tenantsData.length;

      // Create reminder notification
      const reminderNotification = {
        type: tenantIds.length > 0 ? "personal" : "common",
        tenantIds: tenantIds.length > 0 ? tenantIds : undefined,
        title: "Payment Reminder",
        message:
          "This is a friendly reminder that your monthly rent payment is due soon. Please make the payment to avoid any late fees.",
        category: "payment",
        priority: "medium",
      };

      await handleCreateNotification(reminderNotification);

      toast.success(`Payment reminders sent to ${reminderCount} tenant(s)!`);
    } catch {
      toast.error("Failed to send payment reminders");
    } finally {
      setLoading(false);
    }
  };

  // Status icon helper - used by modals
  // eslint-disable-next-line no-unused-vars
  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return (
          <CheckCircle className="status-icon status-paid-icon" size={16} />
        );
      case "pending":
        return <Clock className="status-icon status-pending-icon" size={16} />;
      case "overdue":
        return (
          <AlertCircle className="status-icon status-overdue-icon" size={16} />
        );
      default:
        return null;
    }
  };

  // Tenant name helper - used by modals
  // eslint-disable-next-line no-unused-vars
  const getTenantName = (tenantId) => {
    const tenant = tenantsData.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  // Handle back to dashboard navigation
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  // Handle profile navigation from sidebar
  const handleProfileNavigation = () => {
    setCurrentView("profile");
  };

  // Payment Monitoring Functions
  const fetchPaymentSummary = async () => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payments/summary?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPaymentSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      toast.error('Failed to fetch payment summary');
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payments/recent?month=${selectedMonth}&year=${selectedYear}&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRecentTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      toast.error('Failed to fetch recent transactions');
    }
  };

  const downloadFullReport = async () => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payments/export?month=${selectedMonth}&year=${selectedYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        a.download = `Payment_Report_${monthNames[selectedMonth - 1]}_${selectedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Report downloaded successfully');
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Test notification function
  const sendTestNotification = () => {
    const testNotification = {
      type: "common",
      title: "Test Notification",
      message:
        "This is a test notification to verify the real-time system is working.",
      category: "info",
      priority: "medium",
    };

    console.log("🧪 [Admin] WORKING Test Notification:", testNotification);
    addNotification(testNotification);

    // Also check localStorage after sending
    setTimeout(() => {
      const stored = localStorage.getItem("simpleNotifications");
      if (stored) {
        const notifications = JSON.parse(stored);
        console.log(
          "💾 [Admin] localStorage after test notification:",
          notifications.length,
          "notifications"
        );
      }
    }, 1000);
  };

  // Render OwnerProfile if in profile view
  if (currentView === "profile") {
    return (
      <div className={`owner-dashboard ${isDarkTheme ? "dark" : ""}`}>
        <SlidingNavbar
          user={currentUser}
          onLogout={onLogout}
          onThemeToggle={handleThemeToggle}
          isDarkTheme={isDarkTheme}
          onOwnerProfile={handleProfileNavigation}
        />
        <OwnerProfile
          onBack={handleBackToDashboard}
          isDarkTheme={isDarkTheme}
        />
      </div>
    );
  }

  return (
    <div className={`owner-dashboard ${isDarkTheme ? "dark" : ""}`}>
      <SlidingNavbar
        user={currentUser}
        onLogout={onLogout}
        onThemeToggle={handleThemeToggle}
        isDarkTheme={isDarkTheme}
        onOwnerProfile={handleProfileNavigation}
      />

      <div className="main-content">
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            <h1>Admin Panel</h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginLeft: "1rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                📶 Real-time: {connectionStatus} | 🕒 Last data update:{" "}
                {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}
              </div>
              {dashboardLoading && (
                <div style={{ fontSize: "0.875rem", color: "#10b981" }}>
                  🔄 Updating...
                </div>
              )}
              {dashboardError && (
                <div style={{ fontSize: "0.875rem", color: "#ef4444" }}>
                  ❌ {dashboardError}
                </div>
              )}
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                📋 Context: {sentNotifications?.length ?? 0} | 💾 Storage:{" "}
                {(() => {
                  try {
                    const stored = localStorage.getItem("simpleNotifications");
                    if (!stored) return 0;
                    const parsed = JSON.parse(stored);
                    return Array.isArray(parsed) ? parsed.length : 0;
                  } catch (err) {
                    console.error("Error parsing localStorage:", err);
                    return "error";
                  }
                })()}
              </div>

              <button
                onClick={() => {
                  console.log("🔍 [DEBUG] Dashboard State:");
                  console.log("- activeTenants:", activeTenants);
                  console.log("- totalRevenue:", totalRevenue);
                  console.log("- pendingRevenue:", pendingRevenue);
                  console.log("- bills count:", billsData?.length);
                  console.log("- rooms count:", rooms?.length);
                  console.log("- lastUpdated:", lastUpdated);
                  refreshData();
                }}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <RefreshCw size={12} />
                Refresh Data
              </button>
            </div>
            <button
              onClick={sendTestNotification}
              style={{
                marginLeft: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              🧪 Test Notification
            </button>
            <button
              onClick={() => {
                // Direct localStorage approach
                const testNotification = {
                  id: Date.now() + Math.random(),
                  type: "common",
                  title: "DIRECT Test " + new Date().toLocaleTimeString(),
                  message:
                    "This notification was created directly in localStorage.",
                  category: "info",
                  priority: "high",
                  date: new Date().toISOString(),
                  timestamp: Date.now(),
                  read: false,
                  author: "Admin Panel",
                };

                // Get current notifications and add the new one
                const current = JSON.parse(
                  localStorage.getItem("simpleNotifications") || "[]"
                );
                const updated = [testNotification, ...current];

                // Save to localStorage
                localStorage.setItem(
                  "simpleNotifications",
                  JSON.stringify(updated)
                );

                // Dispatch storage event to notify other tabs
                window.dispatchEvent(
                  new StorageEvent("storage", {
                    key: "simpleNotifications",
                    newValue: JSON.stringify(updated),
                    url: window.location.href,
                  })
                );

                alert(
                  "DIRECT notification created! Check localStorage and tenant panel."
                );
              }}
              style={{
                marginLeft: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              🔴 DIRECT Test
            </button>
            <button
              onClick={() => openModal("notificationHistory")}
              style={{
                marginLeft: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              📜 History
            </button>
          </div>
          <div
            className="profile-section"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="profile-photo">
              {ownerInfo.profilePhoto ||
              currentUser?.profilePhoto ||
              ownerProfile?.profilePhoto ? (
                <img
                  src={
                    ownerInfo.profilePhoto ||
                    currentUser?.profilePhoto ||
                    ownerProfile?.profilePhoto
                  }
                  alt="Profile"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <User size={24} />
              )}
            </div>
            <span>
              {ownerInfo.fullName ||
                currentUser?.name ||
                currentUser?.fullName ||
                ownerProfile?.fullName}
            </span>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal("changeProfilePhoto");
                    setShowProfileDropdown(false);
                  }}
                >
                  <User size={16} />
                  <span>Change Photo</span>
                </div>
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView("profile");
                    setShowProfileDropdown(false);
                  }}
                >
                  <Eye size={16} />
                  <span>View Profile</span>
                </div>
                <div
                  className="dropdown-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentView("profile");
                    setShowProfileDropdown(false);
                  }}
                >
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className={`stats-overview ${animationState}`}>
          <div className="stat-card revenue">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="stat-number">
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
              <span className="stat-change positive">From all paid bills</span>
            </div>
          </div>

          <div className="stat-card tenants">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <h3>Active Tenants</h3>
              <p className="stat-number">{stats.totalTenants}</p>
              <span className="stat-change neutral">Currently active</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <h3>Pending Payments</h3>
              <p className="stat-number">
                ₹{stats.pendingRevenue.toLocaleString()}
              </p>
              <span className="stat-change negative">
                {stats.pendingBills + stats.overdueBills} bills due
              </span>
            </div>
          </div>

          <div className="stat-card occupancy">
            <div className="stat-icon">
              <Building size={24} />
            </div>
            <div className="stat-info">
              <h3>Occupancy Rate</h3>
              <p className="stat-number">{stats.occupancyRate}%</p>
              <span className="stat-change positive">
                {stats.occupiedRooms}/{stats.totalRooms} units occupied
              </span>
            </div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-section">
            <div
              className="admin-card large-card profile-card"
              onClick={() => openModal("ownerProfile")}
            >
              <div className="profile-card-content">
                <div className="profile-avatar">
                  {ownerInfo.profilePhoto ||
                  currentUser?.profilePhoto ||
                  ownerProfile?.profilePhoto ? (
                    <img
                      src={
                        ownerInfo.profilePhoto ||
                        currentUser?.profilePhoto ||
                        ownerProfile?.profilePhoto
                      }
                      alt="Profile"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <User size={28} />
                  )}
                </div>
                <div className="profile-info">
                  <h4>
                    {ownerInfo.fullName ||
                      currentUser?.name ||
                      currentUser?.fullName ||
                      ownerProfile?.fullName}
                  </h4>
                  <p>
                    {ownerInfo.buildingName ||
                      currentUser?.profileData?.buildingDetails?.buildingName ||
                      ownerProfile?.buildingInfo?.name ||
                      "Property Management"}
                  </p>
                  <span>Manage Profile</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <div className="action-row">
              <div
                className="admin-card monitor-card"
                onClick={() => openModal("monitorPayments")}
              >
                <div className="card-icon-wrapper">
                  <Eye size={24} />
                </div>
                <span>Monitor Payments</span>
                <div className="card-indicator">
                  ₹{stats.pendingRevenue.toLocaleString()} pending
                </div>
              </div>
            </div>

            <div className="profile-content">
              <div
                className="admin-card tenants-card"
                onClick={() => openModal("viewTenants")}
              >
                <div className="card-icon-wrapper">
                  <Users size={24} />
                </div>
                <span>View Tenants</span>
                <div className="card-indicator">
                  {stats.totalTenants} active
                </div>
              </div>
              <div
                className="admin-card rooms-card"
                onClick={() => openModal("roomDetails")}
              >
                <div className="card-icon-wrapper">
                  <Building size={24} />
                </div>
                <span>View/Edit Rooms</span>
                <div className="card-indicator">{stats.totalRooms} units</div>
              </div>
            </div>

            <div className="action-row">
              <div
                className="admin-card add-room-card"
                onClick={() => openModal("addRoom")}
              >
                <div className="card-icon-wrapper">
                  <Plus size={24} />
                </div>
                <span>Add Rooms</span>
                <div className="card-indicator">Create new units</div>
              </div>
              <div
                className="admin-card bills-card"
                onClick={() => openModal("manageBills")}
              >
                <div className="card-icon-wrapper">
                  <Receipt size={24} />
                </div>
                <span>Manage Bills</span>
                <div className="card-indicator">
                  {stats.overdueBills} overdue
                </div>
              </div>
            </div>

            <div className="action-row">
              <div
                className="admin-card notifications-card"
                onClick={() => openModal("postNotifications")}
              >
                <div className="card-icon-wrapper">
                  <Bell size={24} />
                </div>
                <span>Post Notifications</span>
                <div className="card-indicator">
                  Send to all or specific tenants
                </div>
              </div>
              <div
                className="admin-card notification-history-card"
                onClick={() => openModal("notificationHistory")}
              >
                <div className="card-icon-wrapper">
                  <Clock size={24} />
                </div>
                <span>Notification History</span>
                <div className="card-indicator">
                  {sentNotifications?.length ?? 0} sent
                </div>
              </div>
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
  );
};

export default OwnerDashboard;
