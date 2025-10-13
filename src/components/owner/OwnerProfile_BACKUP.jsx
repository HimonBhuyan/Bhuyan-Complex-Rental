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
  
  // Owner profile state
  const [profileData, setProfileData] = useState({
    basicInfo: {
      fullName: user?.fullName || user?.name || 'John Anderson',
      profilePhoto: user?.profilePhoto || null,
      primaryPhone: user?.phone || '+1-555-123-4567',
      secondaryPhone: '+1-555-123-4568',
      email: user?.email || 'john.anderson@rentalpro.com',
      residentialAddress: user?.address || '123 Main Street, Downtown, City - 12345',
      officeAddress: '456 Business Avenue, Commercial District - 67890'
    },
    buildingDetails: {
      buildingName: 'Sunset Apartments',
      buildingAddress: '456 Oak Avenue, City Center - 54321',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      totalFloors: 4,
      totalUnits: 16,
      unitTypes: ['Residential'],
      amenities: ['Parking', 'Security', 'Elevator', 'Garden', 'Generator']
    },
    billingSettings: {
      bankDetails: {
        bankName: 'First National Bank',
        accountNumber: '****1234',
        ifscCode: 'FNB001234',
        accountHolderName: 'John Anderson'
      },
      upiDetails: {
        upiId: 'john.anderson@paytm',
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
    documents: [
      { id: 1, name: 'Property Ownership Certificate', type: 'PDF', size: '2.4 MB', uploadDate: '2024-01-15', category: 'ownership' },
      { id: 2, name: 'Property Tax Certificate', type: 'PDF', size: '1.8 MB', uploadDate: '2024-02-01', category: 'tax' },
      { id: 3, name: 'Building Construction Permit', type: 'PDF', size: '3.2 MB', uploadDate: '2024-01-20', category: 'legal' },
      { id: 4, name: 'Fire Safety Certificate', type: 'PDF', size: '1.5 MB', uploadDate: '2024-03-01', category: 'safety' },
      { id: 5, name: 'Electricity Connection Certificate', type: 'PDF', size: '1.2 MB', uploadDate: '2024-01-10', category: 'utility' }
    ]
  })

  // Load profile data from backend and localStorage on mount
  useEffect(() => {
    const loadProfileData = async () => {
      console.log('📂 [OwnerProfile] Loading profile data...')
      
      try {
        // Try to load from backend first
        const token = localStorage.getItem('token')
        if (token) {
          console.log('🌍 [OwnerProfile] Attempting to load from backend...')
          const response = await fetch('http://localhost:3001/api/owner/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.owner.profileData) {
              console.log('✅ [OwnerProfile] Profile loaded from backend')
              setProfileData(prevData => ({ ...prevData, ...data.owner.profileData }))
              return // Successfully loaded from backend
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [OwnerProfile] Backend load failed, falling back to localStorage:', error)
      }
      
      // Fallback to localStorage if backend fails
      console.log('💾 [OwnerProfile] Loading from localStorage fallback...')
      const savedProfile = localStorage.getItem('ownerCompleteProfile')
      const savedPhoto = localStorage.getItem(`userProfilePhoto_${user?.id}`)
      
      let profileToLoad = {}
      
      if (savedProfile) {
        try {
          profileToLoad = JSON.parse(savedProfile)
        } catch (error) {
          console.error('Error parsing localStorage profile:', error)
        }
      }
      
      // Ensure profile photo is loaded from persistent storage
      if (savedPhoto && profileToLoad.basicInfo) {
        profileToLoad.basicInfo.profilePhoto = savedPhoto
      } else if (savedPhoto) {
        profileToLoad = {
          ...profileToLoad,
          basicInfo: {
            ...profileToLoad.basicInfo,
            profilePhoto: savedPhoto
          }
        }
      }
      
      if (Object.keys(profileToLoad).length > 0) {
        console.log('✅ [OwnerProfile] Profile loaded from localStorage')
        setProfileData(prevData => ({ ...prevData, ...profileToLoad }))
      }
    }
    
    if (user?.id) {
      loadProfileData()
    }
  }, [user?.id])

  // Sync profile data when user context updates (real-time updates)
  useEffect(() => {
    if (user) {
      // Also check for persistent photo storage
      const savedPhoto = localStorage.getItem(`userProfilePhoto_${user.id}`)
      
      setProfileData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          fullName: user.fullName || user.name || prev.basicInfo.fullName,
          profilePhoto: user.profilePhoto || savedPhoto || prev.basicInfo.profilePhoto,
          primaryPhone: user.phone || prev.basicInfo.primaryPhone,
          email: user.email || prev.basicInfo.email,
          residentialAddress: user.address || prev.basicInfo.residentialAddress,
          // Merge any additional profile data from user context
          ...user.profileData?.basicInfo
        }
      }))
    }
  }, [user])

  // Save profile data to backend
  const saveProfile = async () => {
    setLoading(true)
    try {
      console.log('🚀 [OwnerProfile] Saving profile to backend...')
      
      // Get JWT token for authentication
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      // Make API call to save profile data
      const response = await fetch('http://localhost:3001/api/owner/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ [OwnerProfile] Profile saved successfully to MongoDB')
      console.log('📡 [OwnerProfile] Broadcast to', result.broadcastedTo, 'clients')
      
      // Update localStorage as backup
      localStorage.setItem('ownerCompleteProfile', JSON.stringify(profileData))
      
      // Update global user context with profile changes
      const userUpdateData = {
        fullName: profileData.basicInfo.fullName,
        name: profileData.basicInfo.fullName, // Update display name
        phone: profileData.basicInfo.primaryPhone,
        email: profileData.basicInfo.email,
        profilePhoto: profileData.basicInfo.profilePhoto,
        // Include full profile data
        profileData: profileData
      }
      
      // Use UserContext to update globally
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
        totalUnits: profileData.buildingDetails.totalUnits,
        unitTypes: profileData.buildingDetails.unitTypes,
        amenities: profileData.buildingDetails.amenities,
        bankName: profileData.billingSettings.bankDetails?.bankName,
        accountNumber: profileData.billingSettings.bankDetails?.accountNumber,
        upiId: profileData.billingSettings.upiDetails?.upiId
      })
      
      // Also dispatch custom event for additional components
      window.dispatchEvent(new CustomEvent('ownerProfileUpdated', {
        detail: profileData
      }))
      
      toast.success('Profile saved successfully to database!')
      setIsEditing(false)
    } catch (error) {
      console.error('❌ [OwnerProfile] Error saving profile:', error)
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file, category) => {
    setLoading(true)
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newDocument = {
        id: Date.now(),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'Image',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        category
      }
      
      setProfileData(prev => ({
        ...prev,
        documents: [...prev.documents, newDocument]
      }))
      
      toast.success('Document uploaded successfully!')
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  // Handle profile photo upload
  const handlePhotoUpload = async (file) => {
    setLoading(true)
    try {
      // Validate file size (max 2MB for better performance)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Please choose an image smaller than 2MB')
        setLoading(false)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please choose a valid image file')
        setLoading(false)
        return
      }

      // Convert image to base64 for persistent storage
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result)
          reader.onerror = error => reject(error)
        })
      }
      
      // Show upload progress
      toast.loading('Uploading profile picture...', { duration: 2000 })
      
      // Simulate photo upload
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Convert to base64 for permanent storage
      const photoBase64 = await convertToBase64(file)
      
      // Update local profile data
      const updatedProfileData = {
        ...profileData,
        basicInfo: { ...profileData.basicInfo, profilePhoto: photoBase64 }
      }
      setProfileData(updatedProfileData)
      
      // Save updated profile data to localStorage
      localStorage.setItem('ownerCompleteProfile', JSON.stringify(updatedProfileData))
      
      // Also save specifically to user's profile storage
      const userProfileKey = `userProfilePhoto_${user?.id}`
      localStorage.setItem(userProfileKey, photoBase64)
      
      // Save photo update to backend as well
      try {
        const token = localStorage.getItem('token')
        if (token) {
          console.log('🖼️ [OwnerProfile] Saving photo to backend...')
          const response = await fetch('http://localhost:3001/api/owner/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedProfileData)
          })
          
          if (response.ok) {
            console.log('✅ [OwnerProfile] Photo saved to MongoDB successfully')
          }
        }
      } catch (backendError) {
        console.warn('⚠️ [OwnerProfile] Backend photo save failed, using local only:', backendError)
      }
      
      // Update global user context immediately for real-time updates
      const userUpdateData = {
        profilePhoto: photoBase64,
        fullName: updatedProfileData.basicInfo.fullName,
        name: updatedProfileData.basicInfo.fullName,
        phone: updatedProfileData.basicInfo.primaryPhone,
        email: updatedProfileData.basicInfo.email,
        profileData: updatedProfileData
      }
      
      updateProfile(userUpdateData)
      
      // Update OwnerContext with new photo
      updateOwnerInfo({
        profilePhoto: photoBase64
      })
      
      // Force immediate update of the photo display
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceUIUpdate'))
      }, 100)
      
      toast.success('Profile photo updated and synced!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
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
        <button 
          className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`}
          onClick={isEditing ? saveProfile : () => setIsEditing(true)}
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? <><Save size={16} /> Save</> : <><Edit size={16} /> Edit</>}
        </button>
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
          <h4>{profileData.basicInfo.fullName}</h4>
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
              <span>{profileData.basicInfo.fullName}</span>
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
              <span>{profileData.basicInfo.primaryPhone}</span>
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
              <span>{profileData.basicInfo.secondaryPhone}</span>
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
              <span>{profileData.basicInfo.email}</span>
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
              <span>{profileData.basicInfo.residentialAddress}</span>
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
              <span>{profileData.basicInfo.officeAddress}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderBuildingDetails = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Building Details</h3>
        <button 
          className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`}
          onClick={isEditing ? saveProfile : () => setIsEditing(true)}
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? <><Save size={16} /> Save</> : <><Edit size={16} /> Edit</>}
        </button>
      </div>

      <div className="building-overview-card">
        <div className="building-image">
          <Building size={48} />
        </div>
        <div className="building-summary">
          <h4>{profileData.buildingDetails.buildingName}</h4>
          <p>{profileData.buildingDetails.buildingAddress}</p>
          <div className="building-stats">
            <span>{profileData.buildingDetails.totalFloors} Floors</span>
            <span>{profileData.buildingDetails.totalUnits} Units</span>
            <span>94% Occupied</span>
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-group">
          <label>Building Name / Identifier</label>
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
              <span>{profileData.buildingDetails.buildingName}</span>
            </div>
          )}
        </div>

        <div className="info-group">
          <label>Number of Floors</label>
          {isEditing ? (
            <input 
              type="number" 
              className="form-control"
              value={profileData.buildingDetails.totalFloors}
              onChange={(e) => setProfileData(prev => ({
                ...prev,
                buildingDetails: { ...prev.buildingDetails, totalFloors: parseInt(e.target.value) }
              }))}
            />
          ) : (
            <div className="info-display">
              <Home size={18} />
              <span>{profileData.buildingDetails.totalFloors} Floors</span>
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
                buildingDetails: { ...prev.buildingDetails, totalUnits: parseInt(e.target.value) }
              }))}
            />
          ) : (
            <div className="info-display">
              <Home size={18} />
              <span>{profileData.buildingDetails.totalUnits} Units</span>
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
              <span>{profileData.buildingDetails.buildingAddress}</span>
            </div>
          )}
        </div>
      </div>

      <div className="unit-types-section">
        <h4>Unit Types</h4>
        <div className="unit-types-grid">
          {['Residential', 'Commercial', 'Mixed'].map(type => (
            <label key={type} className="unit-type-option">
              <input 
                type="checkbox" 
                checked={profileData.buildingDetails.unitTypes.includes(type)}
                disabled={!isEditing}
                onChange={(e) => {
                  if (e.target.checked) {
                    setProfileData(prev => ({
                      ...prev,
                      buildingDetails: {
                        ...prev.buildingDetails,
                        unitTypes: [...prev.buildingDetails.unitTypes, type]
                      }
                    }))
                  } else {
                    setProfileData(prev => ({
                      ...prev,
                      buildingDetails: {
                        ...prev.buildingDetails,
                        unitTypes: prev.buildingDetails.unitTypes.filter(t => t !== type)
                      }
                    }))
                  }
                }}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="amenities-section">
        <h4>Building Amenities</h4>
        <div className="amenities-grid">
          {profileData.buildingDetails.amenities.map(amenity => (
            <div key={amenity} className="amenity-chip">
              <CheckCircle size={14} />
              <span>{amenity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderBillingSettings = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Billing & Finance Settings</h3>
        <button 
          className={`btn ${isEditing ? 'btn-success' : 'btn-secondary'}`}
          onClick={isEditing ? saveProfile : () => setIsEditing(true)}
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? <><Save size={16} /> Save</> : <><Edit size={16} /> Edit</>}
        </button>
      </div>

      {/* Bank Details */}
      <div className="billing-subsection">
        <h4><Banknote size={20} /> Bank Account Details</h4>
        <div className="info-grid">
          <div className="info-group">
            <label>Bank Name</label>
            {isEditing ? (
              <input 
                type="text" 
                className="form-control"
                value={profileData.billingSettings.bankDetails.bankName}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    bankDetails: { ...prev.billingSettings.bankDetails, bankName: e.target.value }
                  }
                }))}
              />
            ) : (
              <div className="info-display">
                <Banknote size={18} />
                <span>{profileData.billingSettings.bankDetails.bankName}</span>
              </div>
            )}
          </div>

          <div className="info-group">
            <label>Account Number</label>
            {isEditing ? (
              <input 
                type="text" 
                className="form-control"
                value={profileData.billingSettings.bankDetails.accountNumber}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    bankDetails: { ...prev.billingSettings.bankDetails, accountNumber: e.target.value }
                  }
                }))}
              />
            ) : (
              <div className="info-display">
                <CreditCard size={18} />
                <span>{profileData.billingSettings.bankDetails.accountNumber}</span>
              </div>
            )}
          </div>

          <div className="info-group">
            <label>IFSC Code</label>
            {isEditing ? (
              <input 
                type="text" 
                className="form-control"
                value={profileData.billingSettings.bankDetails.ifscCode}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    bankDetails: { ...prev.billingSettings.bankDetails, ifscCode: e.target.value }
                  }
                }))}
              />
            ) : (
              <div className="info-display">
                <Building size={18} />
                <span>{profileData.billingSettings.bankDetails.ifscCode}</span>
              </div>
            )}
          </div>

          <div className="info-group">
            <label>UPI ID</label>
            {isEditing ? (
              <input 
                type="text" 
                className="form-control"
                value={profileData.billingSettings.upiDetails.upiId}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    upiDetails: { ...prev.billingSettings.upiDetails, upiId: e.target.value }
                  }
                }))}
              />
            ) : (
              <div className="info-display">
                <Phone size={18} />
                <span>{profileData.billingSettings.upiDetails.upiId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Default Rent Rates */}
      <div className="billing-subsection">
        <h4><Home size={20} /> Default Rent Rates</h4>
        <div className="rent-rates-grid">
          {Object.entries(profileData.billingSettings.defaultRentRates).map(([type, rate]) => (
            <div key={type} className="rent-rate-card">
              <div className="rate-header">
                <span className="unit-type">{type.toUpperCase()}</span>
                <span className="rate-amount">₹{rate}/month</span>
              </div>
              {isEditing && (
                <input 
                  type="number" 
                  className="form-control"
                  value={rate}
                  onChange={(e) => setProfileData(prev => ({
                    ...prev,
                    billingSettings: {
                      ...prev.billingSettings,
                      defaultRentRates: {
                        ...prev.billingSettings.defaultRentRates,
                        [type]: parseInt(e.target.value)
                      }
                    }
                  }))}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Utility Rates */}
      <div className="billing-subsection">
        <h4><Calculator size={20} /> Utility Rates</h4>
        <div className="utility-rates-grid">
          {Object.entries(profileData.billingSettings.utilityRates).map(([utility, config]) => {
            const icons = { electricity: Zap, water: Droplets, maintenance: Wrench, parking: Car }
            const Icon = icons[utility]
            
            return (
              <div key={utility} className="utility-rate-card">
                <div className="utility-header">
                  <Icon size={20} />
                  <span className="utility-name">{utility.charAt(0).toUpperCase() + utility.slice(1)}</span>
                </div>
                <div className="rate-config">
                  <span className="rate-type">
                    {config.type === 'per_unit' ? 'Per Unit' : 'Flat Rate'}
                  </span>
                  <div className="rate-input-group">
                    <span>₹</span>
                    {isEditing ? (
                      <input 
                        type="number" 
                        step="0.1"
                        className="form-control"
                        value={config.rate}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          billingSettings: {
                            ...prev.billingSettings,
                            utilityRates: {
                              ...prev.billingSettings.utilityRates,
                              [utility]: { ...config, rate: parseFloat(e.target.value) }
                            }
                          }
                        }))}
                      />
                    ) : (
                      <span>{config.rate}</span>
                    )}
                    <span>{config.type === 'per_unit' ? '/unit' : '/month'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Penalty Rules */}
      <div className="billing-subsection">
        <h4><AlertCircle size={20} /> Penalty Rules</h4>
        <div className="penalty-rules-grid">
          <div className="penalty-rule">
            <label>Grace Period (Days)</label>
            {isEditing ? (
              <input 
                type="number" 
                className="form-control"
                value={profileData.billingSettings.penaltyRules.gracePeriod}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    penaltyRules: {
                      ...prev.billingSettings.penaltyRules,
                      gracePeriod: parseInt(e.target.value)
                    }
                  }
                }))}
              />
            ) : (
              <span className="rule-value">{profileData.billingSettings.penaltyRules.gracePeriod} Days</span>
            )}
          </div>

          <div className="penalty-rule">
            <label>Late Fee (Per Day)</label>
            {isEditing ? (
              <input 
                type="number" 
                className="form-control"
                value={profileData.billingSettings.penaltyRules.lateFeePerDay}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    penaltyRules: {
                      ...prev.billingSettings.penaltyRules,
                      lateFeePerDay: parseInt(e.target.value)
                    }
                  }
                }))}
              />
            ) : (
              <span className="rule-value">₹{profileData.billingSettings.penaltyRules.lateFeePerDay}/day</span>
            )}
          </div>

          <div className="penalty-rule">
            <label>Maximum Penalty</label>
            {isEditing ? (
              <input 
                type="number" 
                className="form-control"
                value={profileData.billingSettings.penaltyRules.maxPenalty}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  billingSettings: {
                    ...prev.billingSettings,
                    penaltyRules: {
                      ...prev.billingSettings.penaltyRules,
                      maxPenalty: parseInt(e.target.value)
                    }
                  }
                }))}
              />
            ) : (
              <span className="rule-value">₹{profileData.billingSettings.penaltyRules.maxPenalty}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderDocumentManagement = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>Document Management</h3>
        <label className="btn btn-primary">
          <Upload size={16} /> Upload Document
          <input 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'general')}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="documents-grid">
        {profileData.documents.map(doc => (
          <div key={doc.id} className="document-card">
            <div className="document-header">
              <div className="doc-icon" style={{ backgroundColor: `${getCategoryColor(doc.category)}20` }}>
                <FileText size={24} style={{ color: getCategoryColor(doc.category) }} />
              </div>
              <div className="document-actions">
                <button className="action-btn">
                  <Eye size={16} />
                </button>
                <button className="action-btn">
                  <Download size={16} />
                </button>
                <button className="action-btn danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="document-info">
              <h5>{doc.name}</h5>
              <div className="document-meta">
                <span className="doc-type">{doc.type}</span>
                <span className="doc-size">{doc.size}</span>
              </div>
              <div className="document-details">
                <span className={`category-badge ${doc.category}`}>
                  {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                </span>
                <span className="upload-date">Uploaded {doc.uploadDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="upload-categories">
        <h4>Upload by Category</h4>
        <div className="category-uploads">
          {[
            { name: 'Ownership Proofs', category: 'ownership', icon: Shield },
            { name: 'Tax Certificates', category: 'tax', icon: Receipt },
            { name: 'Legal Documents', category: 'legal', icon: FileText },
            { name: 'Safety Certificates', category: 'safety', icon: AlertCircle },
            { name: 'Utility Documents', category: 'utility', icon: Zap }
          ].map(({ name, category, icon: CategoryIcon }) => (
            <label key={category} className="category-upload">
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], category)}
                style={{ display: 'none' }}
              />
              <div className="category-info">
                <CategoryIcon size={20} style={{ color: getCategoryColor(category) }} />
                <span>{name}</span>
              </div>
              <Upload size={16} />
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className={`owner-profile ${isDarkTheme ? 'dark' : ''}`}>
      <div className="main-content">
        <div className="profile-header">
          <div className="header-left">
            <button className="back-btn" onClick={onBack}>
              ← Back to Dashboard
            </button>
            <h1>Owner Profile</h1>
          </div>
        </div>

        <div className="profile-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button 
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="profile-content">
          {activeTab === 'basic' && renderBasicInfo()}
          {activeTab === 'building' && renderBuildingDetails()}
          {activeTab === 'billing' && renderBillingSettings()}
          {activeTab === 'documents' && renderDocumentManagement()}
        </div>
      </div>
    </div>
  )
}

export default OwnerProfile