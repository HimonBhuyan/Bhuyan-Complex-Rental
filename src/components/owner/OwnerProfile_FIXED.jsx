import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useUser } from '../../context/UserContext'
import { useOwner } from '../../context/OwnerContext'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Home, 
  FileText, 
  Upload, 
  Save, 
  Edit, 
  Camera, 
  Banknote,
  Calculator,
  AlertCircle,
  Download,
  Trash2,
  Eye,
  Map,
  CreditCard,
  Zap,
  Droplets,
  Wrench,
  Car,
  Receipt,
  Shield,
  CheckCircle
} from 'lucide-react'
import './OwnerProfile.css'

const OwnerProfile = ({ onBack, isDarkTheme }) => {
  const { user, updateProfile } = useUser()
  const { updateOwnerInfo } = useOwner()
  const [activeTab, setActiveTab] = useState('basic')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Owner profile state
  const [profileData, setProfileData] = useState({
    basicInfo: {
      fullName: '',
      profilePhoto: null,
      primaryPhone: '',
      secondaryPhone: '',
      email: '',
      residentialAddress: '',
      officeAddress: ''
    },
    buildingDetails: {
      buildingName: '',
      buildingAddress: '',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      totalFloors: 4,
      totalUnits: 16,
      unitTypes: ['Residential'],
      amenities: ['Parking', 'Security', 'Elevator', 'Garden', 'Generator']
    },
    billingSettings: {
      bankDetails: {
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
      },
      upiDetails: {
        upiId: '',
        qrCode: null
      },
      defaultRentRates: {
        '1bhk': 1200,
        '2bhk': 1800,
        '3bhk': 2500,
        'studio': 950
      },
      utilityRates: {
        electricity: { type: 'per_unit', rate: 8.5 },
        water: { type: 'flat', rate: 50 },
        maintenance: { type: 'flat', rate: 100 },
        parking: { type: 'flat', rate: 75 }
      },
      otherCharges: [
        { name: 'Security Charge', amount: 200, frequency: 'monthly' },
        { name: 'Generator Maintenance', amount: 150, frequency: 'monthly' }
      ],
      penaltyRules: {
        gracePeriod: 3,
        lateFeePerDay: 50,
        maxPenalty: 500
      }
    },
    documents: []
  })

  const [originalData, setOriginalData] = useState({})

  // Load profile data from backend on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setInitialLoading(false)
        return
      }
      
      console.log('📂 [OwnerProfile] Loading profile data...')
      
      try {
        const token = localStorage.getItem('token')
        if (token) {
          console.log('🌍 [OwnerProfile] Loading from backend...')
          const response = await fetch('http://localhost:3001/api/owner/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ [OwnerProfile] Backend response:', data)
            
            if (data.success && data.owner) {
              const owner = data.owner
              
              // Map backend data to component state
              const backendProfileData = {
                basicInfo: {
                  fullName: owner.name || '',
                  profilePhoto: owner.profilePhoto || null,
                  primaryPhone: owner.phone || '',
                  secondaryPhone: owner.profileData?.basicInfo?.secondaryPhone || '',
                  email: owner.email || '',
                  residentialAddress: owner.address || owner.profileData?.basicInfo?.residentialAddress || '',
                  officeAddress: owner.profileData?.basicInfo?.officeAddress || ''
                },
                buildingDetails: owner.profileData?.buildingDetails || {
                  buildingName: 'My Building',
                  buildingAddress: owner.address || '',
                  coordinates: { lat: 40.7128, lng: -74.0060 },
                  totalFloors: 4,
                  totalUnits: 16,
                  unitTypes: ['Residential'],
                  amenities: ['Parking', 'Security', 'Elevator', 'Garden']
                },
                billingSettings: owner.profileData?.billingSettings || {
                  bankDetails: {
                    bankName: '',
                    accountNumber: '',
                    ifscCode: '',
                    accountHolderName: owner.name || ''
                  },
                  upiDetails: {
                    upiId: '',
                    qrCode: null
                  },
                  defaultRentRates: {
                    '1bhk': 1200,
                    '2bhk': 1800,
                    '3bhk': 2500
                  }
                },
                documents: owner.profileData?.documents || []
              }
              
              console.log('📝 [OwnerProfile] Setting profile data:', backendProfileData)
              setProfileData(backendProfileData)
              setOriginalData(backendProfileData)
              setInitialLoading(false)
              return
            }
          } else {
            console.warn('⚠️ [OwnerProfile] Backend response not OK:', response.status)
          }
        }
      } catch (error) {
        console.warn('⚠️ [OwnerProfile] Backend load failed:', error)
      }
      
      // Fallback to user context data
      console.log('💾 [OwnerProfile] Using fallback data from user context')
      const fallbackData = {
        basicInfo: {
          fullName: user?.name || user?.fullName || '',
          profilePhoto: user?.profilePhoto || null,
          primaryPhone: user?.phone || '',
          secondaryPhone: '',
          email: user?.email || '',
          residentialAddress: user?.address || '',
          officeAddress: ''
        },
        buildingDetails: {
          buildingName: 'My Building',
          buildingAddress: user?.address || '',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          totalFloors: 4,
          totalUnits: 16,
          unitTypes: ['Residential'],
          amenities: ['Parking', 'Security', 'Elevator']
        },
        billingSettings: {
          bankDetails: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            accountHolderName: user?.name || ''
          },
          upiDetails: {
            upiId: '',
            qrCode: null
          },
          defaultRentRates: {
            '1bhk': 1200,
            '2bhk': 1800,
            '3bhk': 2500
          }
        },
        documents: []
      }
      
      setProfileData(fallbackData)
      setOriginalData(fallbackData)
      setInitialLoading(false)
    }
    
    loadProfileData()
  }, [user?.id])

  // Enhanced WebSocket real-time updates
  useEffect(() => {
    const handleOwnerProfileUpdate = (event) => {
      console.log('📡 [OwnerProfile] Received WebSocket profile update:', event.detail)
      
      const updatedData = event.detail
      if (updatedData && updatedData.ownerId === user?.id) {
        console.log('🔄 [OwnerProfile] Processing real-time profile update...')
        
        // Update profile data with new information
        setProfileData(prev => {
          const newData = {
            ...prev,
            basicInfo: {
              ...prev.basicInfo,
              fullName: updatedData.name || updatedData.profileData?.basicInfo?.fullName || prev.basicInfo.fullName,
              profilePhoto: updatedData.profilePhoto || updatedData.profileData?.basicInfo?.profilePhoto || prev.basicInfo.profilePhoto,
              primaryPhone: updatedData.phone || updatedData.profileData?.basicInfo?.primaryPhone || prev.basicInfo.primaryPhone,
              email: updatedData.email || updatedData.profileData?.basicInfo?.email || prev.basicInfo.email,
              residentialAddress: updatedData.address || updatedData.profileData?.basicInfo?.residentialAddress || prev.basicInfo.residentialAddress,
              // Update other basic info fields if available
              secondaryPhone: updatedData.profileData?.basicInfo?.secondaryPhone || prev.basicInfo.secondaryPhone,
              officeAddress: updatedData.profileData?.basicInfo?.officeAddress || prev.basicInfo.officeAddress
            },
            buildingDetails: updatedData.profileData?.buildingDetails || prev.buildingDetails,
            billingSettings: updatedData.profileData?.billingSettings || prev.billingSettings,
            documents: updatedData.profileData?.documents || prev.documents
          }
          
          console.log('✅ [OwnerProfile] Profile data updated from WebSocket')
          return newData
        })
        
        // Update original data as well to reflect the new saved state
        setOriginalData(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            fullName: updatedData.name || updatedData.profileData?.basicInfo?.fullName || prev.basicInfo.fullName,
            profilePhoto: updatedData.profilePhoto || prev.basicInfo.profilePhoto,
            primaryPhone: updatedData.phone || prev.basicInfo.primaryPhone,
            email: updatedData.email || prev.basicInfo.email
          }
        }))
        
        // Update user context to sync with other components
        updateProfile({
          name: updatedData.name || updatedData.profileData?.basicInfo?.fullName,
          phone: updatedData.phone || updatedData.profileData?.basicInfo?.primaryPhone,
          email: updatedData.email || updatedData.profileData?.basicInfo?.email,
          profilePhoto: updatedData.profilePhoto || updatedData.profileData?.basicInfo?.profilePhoto,
          address: updatedData.address || updatedData.profileData?.basicInfo?.residentialAddress
        })
        
        // Update OwnerContext as well
        updateOwnerInfo({
          fullName: updatedData.name || updatedData.profileData?.basicInfo?.fullName,
          email: updatedData.email || updatedData.profileData?.basicInfo?.email,
          primaryPhone: updatedData.phone || updatedData.profileData?.basicInfo?.primaryPhone,
          profilePhoto: updatedData.profilePhoto || updatedData.profileData?.basicInfo?.profilePhoto
        })
        
        toast.success('Profile updated from another device!')
      }
    }

    // Listen for WebSocket events
    window.addEventListener('OWNER_PROFILE_UPDATED', handleOwnerProfileUpdate)
    window.addEventListener('ownerProfileUpdated', handleOwnerProfileUpdate)
    
    return () => {
      window.removeEventListener('OWNER_PROFILE_UPDATED', handleOwnerProfileUpdate)
      window.removeEventListener('ownerProfileUpdated', handleOwnerProfileUpdate)
    }
  }, [user?.id, updateProfile, updateOwnerInfo])

  // ENHANCED Save profile function
  const saveProfile = async () => {
    console.log('🚀 [OwnerProfile] Save button clicked - starting save process...')
    
    if (loading) {
      console.log('⚠️ [OwnerProfile] Already loading, ignoring click')
      return
    }

    setLoading(true)
    
    try {
      console.log('🔍 [OwnerProfile] Current profile data:', profileData)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }
      
      console.log('🔑 [OwnerProfile] Token found, preparing data...')
      
      // Make API call to save profile data
      const response = await fetch('http://localhost:3001/api/owner/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      
      console.log('📨 [OwnerProfile] Backend response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [OwnerProfile] Backend error response:', errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ [OwnerProfile] Profile saved successfully:', result)
      console.log('📡 [OwnerProfile] Broadcast to', result.broadcastedTo, 'WebSocket clients')
      
      // Update localStorage as backup
      localStorage.setItem('ownerCompleteProfile', JSON.stringify(profileData))
      
      // Update original data to reflect saved state
      setOriginalData({...profileData})
      setIsEditing(false)
      
      // Update global user context with profile changes
      const userUpdateData = {
        name: profileData.basicInfo.fullName,
        phone: profileData.basicInfo.primaryPhone,
        email: profileData.basicInfo.email,
        profilePhoto: profileData.basicInfo.profilePhoto,
        address: profileData.basicInfo.residentialAddress,
        profileData: profileData
      }
      
      updateProfile(userUpdateData)
      
      // Update OwnerContext with new profile data
      updateOwnerInfo({
        fullName: profileData.basicInfo.fullName,
        email: profileData.basicInfo.email,
        primaryPhone: profileData.basicInfo.primaryPhone,
        secondaryPhone: profileData.basicInfo.secondaryPhone,
        profilePhoto: profileData.basicInfo.profilePhoto,
        residentialAddress: profileData.basicInfo.residentialAddress,
        officeAddress: profileData.basicInfo.officeAddress,
        buildingName: profileData.buildingDetails.buildingName,
        buildingAddress: profileData.buildingDetails.buildingAddress,
        totalFloors: profileData.buildingDetails.totalFloors,
        totalUnits: profileData.buildingDetails.totalUnits
      })
      
      // Dispatch custom event for real-time sync
      window.dispatchEvent(new CustomEvent('ownerProfileUpdated', {
        detail: {
          ...profileData,
          ownerId: user?.id,
          name: profileData.basicInfo.fullName,
          email: profileData.basicInfo.email,
          phone: profileData.basicInfo.primaryPhone,
          profilePhoto: profileData.basicInfo.profilePhoto
        }
      }))
      
      toast.success('Profile saved successfully and synced across devices!')
      console.log('🎉 [OwnerProfile] Save process completed successfully')
      
    } catch (error) {
      console.error('❌ [OwnerProfile] Error saving profile:', error)
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
      console.log('🔄 [OwnerProfile] Loading state reset')
    }
  }

  // Cancel edit function
  const cancelEdit = () => {
    console.log('❌ [OwnerProfile] Cancel button clicked')
    console.log('🔄 [OwnerProfile] Restoring original data:', originalData)
    
    setProfileData({...originalData})
    setIsEditing(false)
    toast.info('Changes cancelled')
  }

  // ENHANCED Document upload function
  const handleDocumentUpload = async (file, category) => {
    setLoading(true)
    try {
      console.log(`📄 [OwnerProfile] Starting document upload: ${category}`)
      
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      // Convert to base64 for storage
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result)
          reader.onerror = error => reject(error)
        })
      }
      
      const fileBase64 = await convertToBase64(file)
      
      const newDocument = {
        id: Date.now(),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'Image',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        category,
        data: fileBase64
      }
      
      // Update documents in profile data
      const updatedProfileData = {
        ...profileData,
        documents: [...profileData.documents, newDocument]
      }
      
      setProfileData(updatedProfileData)
      
      // If editing, save to backend immediately
      if (isEditing) {
        try {
          const token = localStorage.getItem('token')
          if (token) {
            const response = await fetch('http://localhost:3001/api/owner/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updatedProfileData)
            })
            
            if (response.ok) {
              console.log('✅ [OwnerProfile] Document uploaded and saved to backend')
              toast.success('Document uploaded and saved successfully!')
            } else {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
          }
        } catch (backendError) {
          console.warn('⚠️ [OwnerProfile] Backend save failed for document:', backendError)
          toast.success('Document uploaded locally! Click "Save" to persist.')
        }
      } else {
        toast.success('Document uploaded! Click "Edit" and "Save" to persist.')
      }
      
    } catch (error) {
      console.error('❌ [OwnerProfile] Error uploading document:', error)
      toast.error('Failed to upload document: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ENHANCED Profile photo upload function  
  const handlePhotoUpload = async (file) => {
    setLoading(true)
    try {
      // Validate file size and type
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Please choose an image smaller than 2MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please choose a valid image file')
        return
      }

      console.log('🖼️ [OwnerProfile] Processing profile photo upload...')
      toast.loading('Uploading profile picture...', { duration: 2000 })
      
      // Convert to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result)
          reader.onerror = error => reject(error)
        })
      }
      
      const photoBase64 = await convertToBase64(file)
      
      // Update local profile data immediately
      const updatedProfileData = {
        ...profileData,
        basicInfo: { ...profileData.basicInfo, profilePhoto: photoBase64 }
      }
      setProfileData(updatedProfileData)
      
      // Save to localStorage
      localStorage.setItem('ownerCompleteProfile', JSON.stringify(updatedProfileData))
      localStorage.setItem(`userProfilePhoto_${user?.id}`, photoBase64)
      
      // Save to backend immediately
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch('http://localhost:3001/api/owner/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedProfileData)
          })
          
          if (response.ok) {
            console.log('✅ [OwnerProfile] Photo saved to backend successfully')
            
            // Update contexts for real-time sync
            updateProfile({
              profilePhoto: photoBase64,
              name: updatedProfileData.basicInfo.fullName,
              phone: updatedProfileData.basicInfo.primaryPhone,
              email: updatedProfileData.basicInfo.email
            })
            
            updateOwnerInfo({
              profilePhoto: photoBase64
            })
            
            // Dispatch event for cross-tab sync
            window.dispatchEvent(new CustomEvent('ownerProfileUpdated', {
              detail: {
                ...updatedProfileData,
                ownerId: user?.id,
                profilePhoto: photoBase64
              }
            }))
            
            toast.success('Profile photo updated and synced across devices!')
          } else {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        }
      } catch (backendError) {
        console.warn('⚠️ [OwnerProfile] Backend photo save failed:', backendError)
        toast.success('Profile photo updated locally!')
      }
      
    } catch (error) {
      console.error('❌ [OwnerProfile] Error uploading photo:', error)
      toast.error('Failed to upload photo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Tab configuration
  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: User },
    { id: 'building', label: 'Building Details', icon: Building },
    { id: 'billing', label: 'Billing & Finance', icon: CreditCard },
    { id: 'documents', label: 'Document Management', icon: FileText }
  ]

  const getCategoryColor = (category) => {
    const colors = {
      ownership: '#10b981',
      tax: '#f59e0b',
      legal: '#6366f1',
      safety: '#ef4444',
      utility: '#8b5cf6'
    }
    return colors[category] || '#6b7280'
  }

  const renderBasicInfo = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Basic Information</h3>
        {isEditing ? (
          <div className="edit-actions">
            <button 
              className="btn btn-secondary"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn btn-success"
              onClick={saveProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : <><Save size={16} /> Save</>}
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-secondary"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} /> Edit
          </button>
        )}
      </div>

      <div className="profile-photo-section">
        <div className="photo-container">
          {profileData.basicInfo.profilePhoto ? (
            <img src={profileData.basicInfo.profilePhoto} alt="Profile" className="profile-photo" />
          ) : (
            <div className="photo-placeholder">
              <User size={48} />
            </div>
          )}
          {isEditing && (
            <label className="photo-upload-btn">
              <Camera size={16} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => e.target.files[0] && handlePhotoUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
        <div className="photo-info">
          <h4>{profileData.basicInfo.fullName || 'Owner Name'}</h4>
          <p>Property Owner</p>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-group">
          <label>Full Name</label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control"
              value={profileData.basicInfo.fullName}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, fullName: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <User size={18} />
              <span>{profileData.basicInfo.fullName || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Primary Contact</label>
          {isEditing ? (
            <input 
              type="tel" 
              className="form-control"
              value={profileData.basicInfo.primaryPhone}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, primaryPhone: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <Phone size={18} />
              <span>{profileData.basicInfo.primaryPhone || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Secondary Contact</label>
          {isEditing ? (
            <input 
              type="tel" 
              className="form-control"
              value={profileData.basicInfo.secondaryPhone}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, secondaryPhone: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <Phone size={18} />
              <span>{profileData.basicInfo.secondaryPhone || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Email Address</label>
          {isEditing ? (
            <input 
              type="email" 
              className="form-control"
              value={profileData.basicInfo.email}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, email: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <Mail size={18} />
              <span>{profileData.basicInfo.email || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group full-width">
          <label>Residential Address</label>
          {isEditing ? (
            <textarea 
              className="form-control"
              rows={3}
              value={profileData.basicInfo.residentialAddress}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, residentialAddress: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <MapPin size={18} />
              <span>{profileData.basicInfo.residentialAddress || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group full-width">
          <label>Office Address</label>
          {isEditing ? (
            <textarea 
              className="form-control"
              rows={3}
              value={profileData.basicInfo.officeAddress}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, officeAddress: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <Building size={18} />
              <span>{profileData.basicInfo.officeAddress || 'Not provided'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Add other render methods here (renderBuildingDetails, renderBillingSettings, renderDocuments)
  // ... (truncated for space, but they follow the same pattern)

  const renderBuildingDetails = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Building Details</h3>
        {isEditing ? (
          <div className="edit-actions">
            <button className="btn btn-secondary" onClick={cancelEdit} disabled={loading}>
              Cancel
            </button>
            <button className="btn btn-success" onClick={saveProfile} disabled={loading}>
              {loading ? 'Saving...' : <><Save size={16} /> Save</>}
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit size={16} /> Edit
          </button>
        )}
      </div>

      <div className="info-grid">
        <div className="info-group">
          <label>Building Name</label>
          {isEditing ? (
            <input 
              type="text" 
              className="form-control"
              value={profileData.buildingDetails.buildingName}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                buildingDetails: { ...prev.buildingDetails, buildingName: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <Building size={18} />
              <span>{profileData.buildingDetails.buildingName || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Total Floors</label>
          {isEditing ? (
            <input 
              type="number" 
              className="form-control"
              value={profileData.buildingDetails.totalFloors}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                buildingDetails: { ...prev.buildingDetails, totalFloors: parseInt(e.target.value) || 0 }
              }))}
            />
          ) : (
            <div className="info-display">
              <Home size={18} />
              <span>{profileData.buildingDetails.totalFloors || 0} floors</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Total Units</label>
          {isEditing ? (
            <input 
              type="number" 
              className="form-control"
              value={profileData.buildingDetails.totalUnits}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                buildingDetails: { ...prev.buildingDetails, totalUnits: parseInt(e.target.value) || 0 }
              }))}
            />
          ) : (
            <div className="info-display">
              <Home size={18} />
              <span>{profileData.buildingDetails.totalUnits || 0} units</span>
            </div>
          )}
        </div>

        <div className="info-group full-width">
          <label>Building Address</label>
          {isEditing ? (
            <textarea 
              className="form-control"
              rows={3}
              value={profileData.buildingDetails.buildingAddress}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                buildingDetails: { ...prev.buildingDetails, buildingAddress: e.target.value }
              }))}
            />
          ) : (
            <div className="info-display">
              <MapPin size={18} />
              <span>{profileData.buildingDetails.buildingAddress || 'Not provided'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderDocuments = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Document Management</h3>
        {isEditing && (
          <div className="upload-actions">
            <input
              type="file"
              id="document-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  const category = prompt('Enter document category (ownership, tax, legal, safety, utility):')
                  if (category) {
                    handleDocumentUpload(file, category)
                  }
                }
              }}
            />
            <button 
              className="btn btn-primary"
              onClick={() => document.getElementById('document-upload').click()}
              disabled={loading}
            >
              <Upload size={16} /> Upload Document
            </button>
          </div>
        )}
      </div>

      <div className="documents-grid">
        {profileData.documents.length === 0 ? (
          <div className="empty-documents">
            <FileText size={48} />
            <p>No documents uploaded yet</p>
            {isEditing && (
              <button 
                className="btn btn-primary"
                onClick={() => document.getElementById('document-upload').click()}
              >
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          profileData.documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <div className="document-icon" style={{ backgroundColor: getCategoryColor(doc.category) }}>
                  <FileText size={24} />
                </div>
                <div className="document-info">
                  <h4>{doc.name}</h4>
                  <p>{doc.category} • {doc.type} • {doc.size}</p>
                  <small>Uploaded: {doc.uploadDate}</small>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  className="btn-icon"
                  onClick={() => {
                    if (doc.data) {
                      window.open(doc.data, '_blank')
                    } else {
                      toast.error('Document data not available')
                    }
                  }}
                >
                  <Eye size={16} />
                </button>
                <button className="btn-icon">
                  <Download size={16} />
                </button>
                {isEditing && (
                  <button 
                    className="btn-icon delete"
                    onClick={() => {
                      setProfileData(prev => ({
                        ...prev,
                        documents: prev.documents.filter(d => d.id !== doc.id)
                      }))
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  if (initialLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading owner profile...</p>
      </div>
    )
  }

  return (
    <div className={`owner-profile ${isDarkTheme ? 'dark' : ''}`}>
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>Owner Profile Management</h1>
        <div className="profile-status">
          {loading && <span className="status-indicator loading">Syncing...</span>}
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="profile-content">
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'building' && renderBuildingDetails()}
          {activeTab === 'billing' && renderBuildingDetails()} {/* Placeholder */}
          {activeTab === 'documents' && renderDocuments()}
        </div>
      </div>
    </div>
  )
}

export default OwnerProfile