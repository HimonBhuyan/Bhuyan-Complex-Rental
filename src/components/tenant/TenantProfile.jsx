import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useUser } from '../../context/UserContext'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  X,
  ArrowLeft,
  Shield,
  UserCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import SlidingNavbar from '../SlidingNavbar'
import { getApiUrl } from '../../utils/api'
import './TenantProfile.css'

const TenantProfile = ({ onLogout }) => {
  const navigate = useNavigate()
  const { user, updateProfile } = useUser()
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploadingDocuments, setUploadingDocuments] = useState({})
  
  // Profile Data State
  const [profileData, setProfileData] = useState({
    // Basic Information
    fullName: '',
    profilePhoto: null,
    roomNumber: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Rental Details
    rentAmount: '1500',
    securityDeposit: '3000',
    leaseStartDate: '2024-01-01',
    leaseEndDate: '2024-12-31',
    paymentDueDate: '10',
    outstandingBill: '0',
    
    // Documents
    documents: {
      governmentId: null,
      rentalAgreement: null,
      proofOfResidence: null
    }
  })
  
  const [originalData, setOriginalData] = useState({})

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        setInitialLoading(false)
        return
      }
      
      console.log('📂 [TenantProfile] Loading profile data...')
      
      try {
        const token = localStorage.getItem('token')
        if (token) {
          console.log('🌍 [TenantProfile] Loading from backend...')
          const response = await fetch(`${getApiUrl()}/tenant/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ [TenantProfile] Backend response:', data)
            
            if (data.success && data.tenant) {
              const tenant = data.tenant
              const backendProfileData = {
                fullName: tenant.name || '',
                profilePhoto: tenant.profilePhoto || null,
                roomNumber: tenant.room?.roomNumber || '',
                phone: tenant.phone || '',
                email: tenant.email || '',
                
                // From profileData object
                emergencyContactName: tenant.profileData?.emergencyContact?.name || '',
                emergencyContactPhone: tenant.profileData?.emergencyContact?.phone || '',
                emergencyContactRelation: tenant.profileData?.emergencyContact?.relation || '',
                
                rentAmount: tenant.profileData?.rentalDetails?.rentAmount || tenant.room?.rent?.toString() || '1500',
                securityDeposit: tenant.profileData?.rentalDetails?.securityDeposit || tenant.room?.securityDeposit?.toString() || '3000',
                leaseStartDate: tenant.profileData?.rentalDetails?.leaseStartDate || '2024-01-01',
                leaseEndDate: tenant.profileData?.rentalDetails?.leaseEndDate || '2024-12-31',
                paymentDueDate: tenant.profileData?.preferences?.paymentDueDate || '10',
                outstandingBill: tenant.profileData?.rentalDetails?.outstandingBill || '0',
                
                documents: tenant.profileData?.documents || {
                  governmentId: null,
                  rentalAgreement: null,
                  proofOfResidence: null
                }
              }
              
              console.log('📝 [TenantProfile] Setting profile data:', backendProfileData)
              setProfileData(backendProfileData)
              setOriginalData(backendProfileData)
              setInitialLoading(false)
              return
            }
          } else {
            console.warn('⚠️ [TenantProfile] Backend response not OK:', response.status)
          }
        }
      } catch (error) {
        console.warn('⚠️ [TenantProfile] Backend load failed:', error)
      }
      
      // Fallback to user context data
      console.log('💾 [TenantProfile] Using fallback data from user context')
      const fallbackData = {
        fullName: user?.name || '',
        profilePhoto: user?.profilePhoto || null,
        roomNumber: user?.roomNumber || '',
        phone: user?.phone || '',
        email: user?.email || '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        rentAmount: '1500',
        securityDeposit: '3000',
        leaseStartDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        paymentDueDate: '10',
        outstandingBill: '0',
        documents: {
          governmentId: null,
          rentalAgreement: null,
          proofOfResidence: null
        }
      }
      
      setProfileData(fallbackData)
      setOriginalData(fallbackData)
      setInitialLoading(false)
    }

    loadProfileData()
  }, [user?.id])

  // Listen for WebSocket profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('📡 [TenantProfile] Received WebSocket profile update:', event.detail)
      
      const updatedData = event.detail
      if (updatedData && updatedData.userId === user?.id) {
        const newProfileData = {
          ...profileData,
          fullName: updatedData.name || updatedData.fullName || profileData.fullName,
          profilePhoto: updatedData.profilePhoto || profileData.profilePhoto,
          phone: updatedData.phone || profileData.phone,
          email: updatedData.email || profileData.email,
          roomNumber: updatedData.roomNumber || profileData.roomNumber,
          // Add other fields that might be updated
          emergencyContactName: updatedData.emergencyContactName || profileData.emergencyContactName,
          emergencyContactPhone: updatedData.emergencyContactPhone || profileData.emergencyContactPhone,
          emergencyContactRelation: updatedData.emergencyContactRelation || profileData.emergencyContactRelation,
          // ... other fields
        }
        
        setProfileData(newProfileData)
        setOriginalData(newProfileData)
        
        // Update user context
        updateProfile({
          name: newProfileData.fullName,
          phone: newProfileData.phone,
          email: newProfileData.email,
          profilePhoto: newProfileData.profilePhoto,
          roomNumber: newProfileData.roomNumber
        })
        
        toast.success('Profile updated from another device!')
      }
    }

    // Listen for WebSocket events and custom events
    window.addEventListener('TENANT_PROFILE_UPDATED', handleProfileUpdate)
    window.addEventListener('tenantProfileUpdated', handleProfileUpdate)
    window.addEventListener('profileUpdate', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('TENANT_PROFILE_UPDATED', handleProfileUpdate)
      window.removeEventListener('tenantProfileUpdated', handleProfileUpdate)
      window.removeEventListener('profileUpdate', handleProfileUpdate)
    }
  }, [user?.id, profileData, updateProfile])

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.classList.toggle('dark', !isDarkTheme)
  }

  const handleInputChange = (field, value) => {
    console.log(`📝 [TenantProfile] Field changed: ${field} = ${value}`)
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // FIXED Save Profile Function
  const handleSaveProfile = async () => {
    console.log('🚀 [TenantProfile] Save button clicked - starting save process...')
    
    if (loading) {
      console.log('⚠️ [TenantProfile] Already loading, ignoring click')
      return
    }

    setLoading(true)
    
    try {
      console.log('🔍 [TenantProfile] Current profile data:', profileData)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }
      
      console.log('🔑 [TenantProfile] Token found, preparing data...')
      
      // Prepare profile data for backend (matching the expected format)
      const profileDataForBackend = {
        basicInfo: {
          fullName: profileData.fullName || '',
          primaryPhone: profileData.phone || '',
          email: profileData.email || '',
          profilePhoto: profileData.profilePhoto || null
        },
        emergencyContact: {
          name: profileData.emergencyContactName || '',
          phone: profileData.emergencyContactPhone || '',
          relation: profileData.emergencyContactRelation || ''
        },
        preferences: {
          paymentDueDate: profileData.paymentDueDate || '10'
        },
        documents: profileData.documents || {}
      }
      
      console.log('📤 [TenantProfile] Sending data to backend:', profileDataForBackend)
      
      const response = await fetch(`${getApiUrl()}/tenant/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileDataForBackend)
      })
      
      console.log('📨 [TenantProfile] Backend response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [TenantProfile] Backend error response:', errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ [TenantProfile] Profile saved successfully:', result)
      
      // Update localStorage as backup
      localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(profileData))
      
      // Update original data to reflect saved state
      setOriginalData({...profileData})
      setIsEditing(false)
      
      // Update global user context with new data
      const userUpdateData = {
        name: profileData.fullName,
        phone: profileData.phone,
        email: profileData.email,
        profilePhoto: profileData.profilePhoto,
        roomNumber: profileData.roomNumber
      }
      
      updateProfile(userUpdateData)
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
        detail: { 
          ...profileData, 
          userId: user?.id,
          name: profileData.fullName
        }
      }))
      
      toast.success('Profile saved successfully!')
      console.log('🎉 [TenantProfile] Save process completed successfully')
      
    } catch (error) {
      console.error('❌ [TenantProfile] Error saving profile:', error)
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
      console.log('🔄 [TenantProfile] Loading state reset')
    }
  }

  // FIXED Cancel Function
  const handleCancelEdit = () => {
    console.log('❌ [TenantProfile] Cancel button clicked')
    console.log('🔄 [TenantProfile] Restoring original data:', originalData)
    
    setProfileData({...originalData})
    setIsEditing(false)
    
    toast.info('Changes cancelled')
    console.log('✅ [TenantProfile] Cancel completed')
  }

  // FIXED Document Upload Function
  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return

    console.log(`📄 [TenantProfile] Starting document upload: ${documentType}`)

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, JPG, JPEG, or PNG files only')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadingDocuments(prev => ({ ...prev, [documentType]: true }))
    
    try {
      console.log(`🔄 [TenantProfile] Processing ${documentType}...`)
      
      // Convert file to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => resolve(reader.result)
          reader.onerror = error => reject(error)
        })
      }
      
      const fileBase64 = await convertToBase64(file)
      
      const documentInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: fileBase64
      }
      
      // Update profile data immediately for UI feedback
      const updatedDocuments = {
        ...profileData.documents,
        [documentType]: documentInfo
      }
      
      setProfileData(prev => ({
        ...prev,
        documents: updatedDocuments
      }))
      
      // If editing, save to backend immediately
      if (isEditing) {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const backendData = {
              basicInfo: {
                fullName: profileData.fullName,
                primaryPhone: profileData.phone,
                email: profileData.email,
                profilePhoto: profileData.profilePhoto
              },
              emergencyContact: {
                name: profileData.emergencyContactName,
                phone: profileData.emergencyContactPhone,
                relation: profileData.emergencyContactRelation
              },
              preferences: {
                paymentDueDate: profileData.paymentDueDate
              },
              documents: updatedDocuments
            }
            
            const response = await fetch(`${getApiUrl()}/tenant/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(backendData)
            })
            
            if (response.ok) {
              console.log(`✅ [TenantProfile] Document ${documentType} saved to backend`)
              toast.success(`${getDocumentLabel(documentType)} uploaded and saved!`)
            } else {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
          } catch (backendError) {
            console.warn('⚠️ [TenantProfile] Backend save failed for document:', backendError)
            toast.success(`${getDocumentLabel(documentType)} uploaded locally!`)
          }
        }
      } else {
        toast.success(`${getDocumentLabel(documentType)} uploaded! Click "Edit Profile" and "Save Changes" to persist.`)
      }
      
      // Update localStorage
      localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify({
        ...profileData,
        documents: updatedDocuments
      }))
      
    } catch (error) {
      console.error(`❌ [TenantProfile] Error uploading ${documentType}:`, error)
      toast.error(`Failed to upload ${getDocumentLabel(documentType)}: ${error.message}`)
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [documentType]: false }))
    }
  }

  const getDocumentLabel = (docType) => {
    switch (docType) {
      case 'governmentId': return 'Government ID'
      case 'rentalAgreement': return 'Rental Agreement'
      case 'proofOfResidence': return 'Proof of Current Residence'
      default: return 'Document'
    }
  }

  // View document function
  const viewDocument = (document) => {
    if (!document || !document.data) {
      toast.error('Document data not available')
      return
    }

    try {
      // Open document in new window
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        if (document.type === 'application/pdf') {
          newWindow.document.write(`
            <html>
              <head><title>${document.name}</title></head>
              <body style="margin:0;">
                <embed width="100%" height="100%" src="${document.data}" type="application/pdf" />
              </body>
            </html>
          `)
        } else {
          newWindow.document.write(`
            <html>
              <head><title>${document.name}</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;">
                <img src="${document.data}" style="max-width:100%;max-height:100%;" />
              </body>
            </html>
          `)
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error)
      toast.error('Failed to view document')
    }
  }

  // Download document function
  const downloadDocument = (document) => {
    if (!document || !document.data) {
      toast.error('Document data not available')
      return
    }

    try {
      const link = window.document.createElement('a')
      link.href = document.data
      link.download = document.name || 'document'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      toast.success('Document downloaded!')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const DocumentUploadSection = ({ documentType, label, description, icon: Icon }) => {
    const document = profileData.documents[documentType]
    const isUploading = uploadingDocuments[documentType]
    
    return (
      <div className="document-upload-section">
        <div className="document-header">
          <div className="document-title">
            <Icon size={20} />
            <h4>{label}</h4>
          </div>
          {document && (
            <div className="document-status">
              <CheckCircle size={16} className="success-icon" />
              <span>Uploaded</span>
            </div>
          )}
        </div>
        
        <p className="document-description">{description}</p>
        
        {document ? (
          <div className="uploaded-document">
            <div className="document-info">
              <FileText size={24} />
              <div className="document-details">
                <span className="document-name">{document.name}</span>
                <span className="document-size">{formatFileSize(document.size)}</span>
                <span className="upload-date">
                  Uploaded on {new Date(document.uploadDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="document-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    const docObj = document
                    if (docObj?.data || docObj?.url) {
                      // Build a temp object with expected fields for helper reuse
                      viewDocument({ data: docObj.data || docObj.url, name: docObj.name, type: docObj.type })
                    } else {
                      toast.error('Document data not available')
                    }
                  }}
                >
                  <Eye size={16} />
                  View
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => downloadDocument({ data: document.data || document.url, name: document.name, type: document.type })}
                >
                  <Download size={16} />
                  Download
                </button>
              <button 
                className="btn-primary"
                onClick={() => window.document.getElementById(`${documentType}-input`).click()}
                disabled={isUploading}
              >
                <Upload size={16} />
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="upload-area" 
            onClick={() => window.document.getElementById(`${documentType}-input`).click()}
            style={{ cursor: 'pointer' }}
          >
            <Upload size={32} />
            <p>Click to upload or drag and drop</p>
            <span>PDF, JPG, JPEG, PNG (Max 5MB)</span>
          </div>
        )}
        
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <span>Uploading...</span>
          </div>
        )}
        
        <input
          id={`${documentType}-input`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => handleDocumentUpload(documentType, e.target.files[0])}
        />
      </div>
    )
  }

  if (initialLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className={`tenant-profile ${isDarkTheme ? 'dark' : ''}`}>
      <SlidingNavbar 
        onLogout={onLogout} 
        onThemeToggle={handleThemeToggle}
        isDarkTheme={isDarkTheme}
      />
      
      <div className="main-content">
        <div className="profile-header">
          <div className="header-left">
            <button 
              className="back-btn"
              onClick={() => navigate('/client')}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1>My Profile</h1>
          </div>
          
          <div className="header-actions">
            {isEditing ? (
              <>
                <button 
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? (
                    <div className="btn-spinner"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button 
                className="btn-primary"
                onClick={() => {
                  console.log('✏️ [TenantProfile] Edit button clicked')
                  setIsEditing(true)
                }}
              >
                <Edit size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="profile-content">
          {/* Basic Information Section */}
          <div className="profile-section">
            <div className="section-header">
              <User size={24} />
              <h2>Basic Information</h2>
            </div>
            
            <div className="section-content">
              <div className="profile-photo-section">
                <div className="current-photo">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <div className="photo-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => document.getElementById('profile-photo-input').click()}
                    disabled={!isEditing}
                  >
                    <Upload size={16} />
                    {profileData.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  <span className="photo-note">Optional - JPG, PNG (Max 2MB)</span>
                </div>
                <input
                  id="profile-photo-input"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Profile photo must be less than 2MB')
                        return
                      }
                      
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please choose a valid image file')
                        return
                      }
                      
                      try {
                        toast.loading('Uploading profile picture...', { duration: 2000 })
                        
                        const convertToBase64 = (file) => {
                          return new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.readAsDataURL(file)
                            reader.onload = () => resolve(reader.result)
                            reader.onerror = error => reject(error)
                          })
                        }
                        
                        const photoBase64 = await convertToBase64(file)
                        setProfileData(prev => ({
                          ...prev,
                          profilePhoto: photoBase64
                        }))
                        
                        // Update user context immediately
                        updateProfile({
                          profilePhoto: photoBase64
                        })
                        
                        // Save to localStorage
                        localStorage.setItem(`userProfilePhoto_${user?.id}`, photoBase64)
                        
                        toast.success('Profile photo updated!')
                      } catch (error) {
                        console.error('Error uploading photo:', error)
                        toast.error('Failed to upload photo')
                      }
                    }
                  }}
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={16} />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <span className="form-value">{profileData.fullName || 'Not provided'}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <Home size={16} />
                    Room/Apartment Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.roomNumber}
                      onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                      placeholder="e.g., 101, A-204"
                    />
                  ) : (
                    <span className="form-value">{profileData.roomNumber || 'Not provided'}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <Phone size={16} />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1-234-567-8900"
                    />
                  ) : (
                    <span className="form-value">{profileData.phone || 'Not provided'}</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  ) : (
                    <span className="form-value">{profileData.email || 'Not provided'}</span>
                  )}
                </div>
              </div>
              
              <div className="emergency-contact">
                <h3>
                  <AlertTriangle size={20} />
                  Emergency Contact
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Contact Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.emergencyContactName}
                        onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                        placeholder="Emergency contact name"
                      />
                    ) : (
                      <span className="form-value">{profileData.emergencyContactName || 'Not provided'}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Contact Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.emergencyContactPhone}
                        onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                        placeholder="+1-234-567-8900"
                      />
                    ) : (
                      <span className="form-value">{profileData.emergencyContactPhone || 'Not provided'}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Relationship</label>
                    {isEditing ? (
                      <select
                        value={profileData.emergencyContactRelation}
                        onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                      >
                        <option value="">Select relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Friend">Friend</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <span className="form-value">{profileData.emergencyContactRelation || 'Not provided'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Details Section */}
          <div className="profile-section">
            <div className="section-header">
              <Home size={24} />
              <h2>Rental Details</h2>
            </div>
            
            <div className="section-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <DollarSign size={16} />
                    Monthly Rent Amount
                  </label>
                  <span className="form-value">${profileData.rentAmount || 'Not set'}</span>
                  {isEditing && <small className="readonly-note">This field is managed by the owner.</small>}
                </div>
                
                <div className="form-group">
                  <label>
                    <Shield size={16} />
                    Security Deposit
                  </label>
                  <span className="form-value">${profileData.securityDeposit || 'Not set'}</span>
                  {isEditing && <small className="readonly-note">This field is managed by the owner.</small>}
                </div>
                
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Lease Start Date
                  </label>
                  <span className="form-value">{profileData.leaseStartDate || 'Not set'}</span>
                  {isEditing && <small className="readonly-note">This field is managed by the owner.</small>}
                </div>
                
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Lease End Date
                  </label>
                  <span className="form-value">{profileData.leaseEndDate || 'Not set'}</span>
                  {isEditing && <small className="readonly-note">This field is managed by the owner.</small>}
                </div>
                
                <div className="form-group">
                  <label>
                    <CreditCard size={16} />
                    Payment Due Date (Monthly)
                  </label>
                  <span className="form-value">{profileData.paymentDueDate}th of each month</span>
                  {isEditing && <small className="readonly-note">This field is managed by the owner.</small>}
                </div>
                
                <div className="form-group">
                  <label>
                    <AlertTriangle size={16} />
                    Outstanding Bill Amount
                  </label>
                  <span className="form-value">${profileData.outstandingBill || '0'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="profile-section">
            <div className="section-header">
              <FileText size={24} />
              <h2>Required Documents</h2>
            </div>
            
            <div className="section-content">
              <div className="documents-grid">
                <DocumentUploadSection
                  documentType="governmentId"
                  label="Government ID"
                  description="Upload a copy of your driver's license, passport, or state ID"
                  icon={UserCheck}
                />
                
                <DocumentUploadSection
                  documentType="rentalAgreement"
                  label="Rental Agreement"
                  description="Upload your signed rental agreement or lease document"
                  icon={FileText}
                />
                
                <DocumentUploadSection
                  documentType="proofOfResidence"
                  label="Proof of Current Residence"
                  description="Upload utility bill, bank statement, or other proof of current address"
                  icon={Home}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantProfile