import { createContext, useContext, useState, useEffect } from 'react'

const OwnerContext = createContext()

export const useOwner = () => {
  const context = useContext(OwnerContext)
  if (!context) {
    throw new Error('useOwner must be used within an OwnerProvider')
  }
  return context
}

export const OwnerProvider = ({ children }) => {
  const [ownerInfo, setOwnerInfo] = useState({
    // Basic Information
    fullName: 'John Anderson',
    email: 'john.anderson@rentalpro.com',
    primaryPhone: '+1-555-123-4567',
    secondaryPhone: '+1-555-123-4568',
    profilePhoto: null,
    residentialAddress: '123 Main Street, Downtown, City - 12345',
    officeAddress: '456 Business Avenue, Commercial District - 67890',
    
    // Building Information
    buildingName: 'Sunset Apartments',
    buildingAddress: '456 Oak Avenue, City Center - 54321',
    totalFloors: 4,
    totalUnits: 16,
    unitTypes: ['1BHK', '2BHK', '3BHK', 'Studio'],
    amenities: ['Parking', 'Security', 'Elevator', 'Garden', 'Generator'],
    
    // Contact & Availability
    officeHours: '9 AM - 6 PM (Mon-Fri)',
    emergencyAvailable: '24/7 Emergency',
    emergencyPhone: '+1-555-0123',
    managementCompany: 'Rental Management Co.',
    managementPhone: '+1-555-0124',
    managementEmail: 'management@rentalbuilding.com',
    
    // Banking Details (for tenant reference)
    bankName: 'First National Bank',
    upiId: 'john.anderson@paytm',
    
    // Property Management
    maintenancePhone: '+1-555-0125',
    maintenanceEmail: 'maintenance@rentalbuilding.com',
    securityPhone: '+1-555-0126',
    securityEmail: 'security@rentalbuilding.com'
  })

  // Helper to map a payload (from backend or localStorage) to our ownerInfo shape
  const mapPayloadToOwnerInfo = (payload) => {
    if (!payload) return {}
    // Support both flat structure (from local events) and nested profileData (from server WS)
    const basic = payload.basicInfo || payload.profileData?.basicInfo || {}
    const building = payload.buildingDetails || payload.profileData?.buildingDetails || {}
    const billing = payload.billingSettings || payload.profileData?.billingSettings || {}

    return {
      fullName: payload.name || basic.fullName,
      email: payload.email || basic.email,
      primaryPhone: payload.phone || basic.primaryPhone,
      secondaryPhone: basic.secondaryPhone,
      profilePhoto: payload.profilePhoto || basic.profilePhoto,
      residentialAddress: payload.address || basic.residentialAddress,
      officeAddress: basic.officeAddress,
      buildingName: building.buildingName,
      buildingAddress: building.buildingAddress,
      totalFloors: building.totalFloors,
      totalUnits: building.totalUnits,
      unitTypes: building.unitTypes,
      amenities: building.amenities,
      bankName: billing.bankDetails?.bankName,
      upiId: billing.upiDetails?.upiId
    }
  }

  // Load owner information from localStorage on mount and wire up real-time listeners
  useEffect(() => {
    const loadOwnerData = () => {
      try {
        // Try to get owner data from multiple sources
        const ownerProfile = localStorage.getItem('ownerCompleteProfile')
        const userProfile = localStorage.getItem('user')
        
        let updatedOwnerInfo = { ...ownerInfo }
        
        // Load from owner complete profile (canonical)
        if (ownerProfile) {
          const profileData = JSON.parse(ownerProfile)
          updatedOwnerInfo = { ...updatedOwnerInfo, ...mapPayloadToOwnerInfo(profileData) }
        }
        
        // Load from current user if they're an owner
        if (userProfile) {
          const userData = JSON.parse(userProfile)
          if (userData.role === 'owner') {
            updatedOwnerInfo = {
              ...updatedOwnerInfo,
              fullName: userData.fullName || userData.name || updatedOwnerInfo.fullName,
              email: userData.email || updatedOwnerInfo.email,
              primaryPhone: userData.phone || updatedOwnerInfo.primaryPhone,
              profilePhoto: userData.profilePhoto || updatedOwnerInfo.profilePhoto
            }
          }
        }
        
        // Check for dedicated photo storage
        const savedPhoto = localStorage.getItem(`userProfilePhoto_owner`) // fallback
        if (savedPhoto) {
          updatedOwnerInfo.profilePhoto = savedPhoto
        }
        
        setOwnerInfo(updatedOwnerInfo)
      } catch (error) {
        console.error('Error loading owner data:', error)
      }
    }

    loadOwnerData()
    
    // Listen for owner profile updates from WebSocket and local updates
    const handleOwnerProfileUpdate = (event) => {
      const payload = event?.detail
      if (payload) {
        // Merge event payload directly for immediate UI update
        setOwnerInfo(prev => ({ ...prev, ...mapPayloadToOwnerInfo(payload) }))
        
        // Stamp last update for diagnostics and cross-tab sync
        try {
          const lastUpdated = new Date().toISOString()
          localStorage.setItem('ownerProfileLastUpdated', lastUpdated)
          window.dispatchEvent(new CustomEvent('ownerProfileLastUpdated', { detail: { lastUpdated } }))
        } catch {}
        
        // Also persist canonical copy if it looks like a full profile structure
        try {
          if (payload.basicInfo || payload.buildingDetails || payload.billingSettings) {
            localStorage.setItem('ownerCompleteProfile', JSON.stringify({
              basicInfo: payload.basicInfo || {
                fullName: payload.name,
                email: payload.email,
                primaryPhone: payload.phone,
                profilePhoto: payload.profilePhoto,
                residentialAddress: payload.address
              },
              buildingDetails: payload.buildingDetails,
              billingSettings: payload.billingSettings,
              documents: payload.documents
            }))
          }
        } catch {}
      } else {
        // Fallback: refresh from localStorage
        loadOwnerData()
      }
    }
    
    window.addEventListener('ownerProfileUpdated', handleOwnerProfileUpdate)
    window.addEventListener('OWNER_PROFILE_UPDATED', handleOwnerProfileUpdate)
    window.addEventListener('userUpdated', handleOwnerProfileUpdate)

    // Keep in sync when localStorage changes (cross-tab)
    const handleStorage = (e) => {
      if (e.key === 'ownerCompleteProfile' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue)
          setOwnerInfo(prev => ({ ...prev, ...mapPayloadToOwnerInfo(payload) }))
        } catch {}
      }
      if (e.key === 'ownerProfileLastUpdated' && e.newValue) {
        // no-op; consumers read timestamp directly, but this confirms a change occurred
      }
    }
    window.addEventListener('storage', handleStorage)
    
    return () => {
      window.removeEventListener('ownerProfileUpdated', handleOwnerProfileUpdate)
      window.removeEventListener('OWNER_PROFILE_UPDATED', handleOwnerProfileUpdate)
      window.removeEventListener('userUpdated', handleOwnerProfileUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const updateOwnerInfo = (newData) => {
    setOwnerInfo(prev => ({ ...prev, ...newData }))
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('ownerInfoUpdated', {
      detail: { ...ownerInfo, ...newData }
    }))
  }

  const value = {
    ownerInfo,
    updateOwnerInfo
  }

  return (
    <OwnerContext.Provider value={value}>
      {children}
    </OwnerContext.Provider>
  )
}

export default OwnerContext
