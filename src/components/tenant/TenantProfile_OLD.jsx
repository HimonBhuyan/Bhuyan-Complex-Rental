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
import './TenantProfile.css'

const TenantProfile = ({ onLogout }) => {
  const navigate = useNavigate()
  const { user, updateProfile } = useUser()
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState({})
  
  // Profile Data State
  const [profileData, setProfileData] = useState({
    // Basic Information
    fullName: user?.name || '',
    profilePhoto: user?.profilePhoto || null,
    roomNumber: user?.roomNumber || '',
    phone: user?.phone || '',
    email: user?.email || '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    
    // Rental Details
    rentAmount: '',
    securityDeposit: '',
    leaseStartDate: '',
    leaseEndDate: '',
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

  useEffect(() => {
    // Load existing profile data from backend API
    const loadProfileData = async () => {
      if (!user?.id) return
      
      console.log('📂 [TenantProfile] Loading profile data...')
      setLoading(true)
      
      try {
        // Try to load from backend first
        const token = localStorage.getItem('token')
        if (token) {
          console.log('🌍 [TenantProfile] Attempting to load from backend...')
          const response = await fetch('http://localhost:3001/api/tenant/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.tenant) {
              console.log('✅ [TenantProfile] Profile loaded from backend')
              
              // Map backend data to component state
              const backendProfileData = {
                fullName: data.tenant.name || user?.name || '',
                profilePhoto: data.tenant.profilePhoto || user?.profilePhoto || null,
                roomNumber: data.tenant.room?.roomNumber || user?.roomNumber || '',
                phone: data.tenant.phone || user?.phone || '',
                email: data.tenant.email || user?.email || '',
                
                // Rental details from backend profile data
                rentAmount: data.tenant.profileData?.rentalDetails?.rentAmount || data.tenant.room?.rent?.toString() || '1500',
                securityDeposit: data.tenant.profileData?.rentalDetails?.securityDeposit || data.tenant.room?.securityDeposit?.toString() || '3000',
                leaseStartDate: data.tenant.profileData?.rentalDetails?.leaseStartDate || '2024-01-01',
                leaseEndDate: data.tenant.profileData?.rentalDetails?.leaseEndDate || '2024-12-31',
                outstandingBill: data.tenant.profileData?.rentalDetails?.outstandingBill || '0',
                
                // Emergency contact from backend
                emergencyContactName: data.tenant.profileData?.emergencyContact?.name || 'Emergency Contact',
                emergencyContactPhone: data.tenant.profileData?.emergencyContact?.phone || '+1-234-567-8999',
                emergencyContactRelation: data.tenant.profileData?.emergencyContact?.relation || 'Parent',
                
                // Preferences from backend
                paymentDueDate: data.tenant.profileData?.preferences?.paymentDueDate || '10',
                
                // Documents from backend
                documents: data.tenant.profileData?.documents || {
                  governmentId: null,
                  rentalAgreement: null,
                  proofOfResidence: null
                }
              }
              
              setProfileData(backendProfileData)
              setOriginalData(backendProfileData)
              return // Successfully loaded from backend
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [TenantProfile] Backend load failed, using fallback:', error)
      }
      
      // Fallback to localStorage and user context
      console.log('💾 [TenantProfile] Loading from localStorage fallback...')
      const savedPhoto = localStorage.getItem(`userProfilePhoto_${user?.id}`)
      
      const fallbackProfileData = {
        ...profileData,
        profilePhoto: user?.profilePhoto || savedPhoto || null,
        fullName: user?.name || profileData.fullName,
        phone: user?.phone || profileData.phone,
        email: user?.email || profileData.email,
        roomNumber: user?.roomNumber || profileData.roomNumber
      }
      
      setProfileData(fallbackProfileData)
      setOriginalData(fallbackProfileData)
      
      setLoading(false)
    }

    loadProfileData()
  }, [user?.id, user?.profilePhoto])

  // Sync profile data when user context updates (real-time updates)
  useEffect(() => {
    if (user) {
      // Also check for persistent photo storage
      const savedPhoto = localStorage.getItem(`userProfilePhoto_${user.id}`)
      
      setProfileData(prev => ({
        ...prev,
        fullName: user.fullName || user.name || prev.fullName,
        profilePhoto: user.profilePhoto || savedPhoto || prev.profilePhoto,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        roomNumber: user.roomNumber || prev.roomNumber
      }))
    }
  }, [user])

  // Listen for WebSocket profile updates from other devices/tabs
  useEffect(() => {
    const handleTenantProfileUpdate = (event) => {
      console.log('📡 [TenantProfile] Received profile update from WebSocket:', event.detail)
      
      const updatedProfileData = event.detail
      if (updatedProfileData && updatedProfileData.userId === user?.id) {
        // Map the received data to our component state
        const newProfileData = {
          fullName: updatedProfileData.name || updatedProfileData.fullName || profileData.fullName,
          profilePhoto: updatedProfileData.profilePhoto || profileData.profilePhoto,
          phone: updatedProfileData.phone || profileData.phone,
          email: updatedProfileData.email || profileData.email,
          roomNumber: updatedProfileData.roomNumber || profileData.roomNumber,
          emergencyContactName: updatedProfileData.emergencyContactName || profileData.emergencyContactName,
          emergencyContactPhone: updatedProfileData.emergencyContactPhone || profileData.emergencyContactPhone,
          emergencyContactRelation: updatedProfileData.emergencyContactRelation || profileData.emergencyContactRelation,
          rentAmount: updatedProfileData.rentAmount || profileData.rentAmount,
          securityDeposit: updatedProfileData.securityDeposit || profileData.securityDeposit,
          leaseStartDate: updatedProfileData.leaseStartDate || profileData.leaseStartDate,
          leaseEndDate: updatedProfileData.leaseEndDate || profileData.leaseEndDate,
          paymentDueDate: updatedProfileData.paymentDueDate || profileData.paymentDueDate,
          outstandingBill: updatedProfileData.outstandingBill || profileData.outstandingBill,
          documents: updatedProfileData.documents || profileData.documents
        }
        
        setProfileData(newProfileData)
        
        // Update user context
        updateProfile({
          fullName: newProfileData.fullName,
          name: newProfileData.fullName,
          phone: newProfileData.phone,
          email: newProfileData.email,
          profilePhoto: newProfileData.profilePhoto,
          roomNumber: newProfileData.roomNumber
        })
        
        toast.success('Profile updated from another device!')
      }
    }

    // Listen for both custom events and profile-specific events
    window.addEventListener('tenantProfileUpdated', handleTenantProfileUpdate)
    window.addEventListener('profileUpdate', handleTenantProfileUpdate)
    
    return () => {
      window.removeEventListener('tenantProfileUpdated', handleTenantProfileUpdate)
      window.removeEventListener('profileUpdate', handleTenantProfileUpdate)
    }
  }, [user?.id, profileData, updateProfile])

  const handleThemeToggle = () => {
    setIsDarkTheme(!isDarkTheme)
    document.documentElement.classList.toggle('dark', !isDarkTheme)
  }

  const handleInputChange = (field, value) => {
    const updatedData = {
      ...profileData,
      [field]: value
    }
    setProfileData(updatedData)
    
    // Update user context in real-time for immediate UI updates
    if (['fullName', 'phone', 'email', 'roomNumber'].includes(field)) {
      updateProfile(updatedData)
    }
  }

  const handleDocumentUpload = async (documentType, file) => {
    if (!file) return

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
      console.log(`🔄 [TenantProfile] Uploading ${documentType}...`)
      toast.loading(`Uploading ${getDocumentLabel(documentType)}...`, { duration: 3000 })
      
      // Convert file to base64 for storage
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
        data: fileBase64 // Store base64 data
      }
      
      // Update local state immediately
      const updatedDocuments = {
        ...profileData.documents,
        [documentType]: documentInfo
      }
      
      const updatedProfileData = {
        ...profileData,
        documents: updatedDocuments
      }
      
      setProfileData(updatedProfileData)
      
      // Save to backend
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const backendData = {
            basicInfo: {
              fullName: updatedProfileData.fullName,
              primaryPhone: updatedProfileData.phone,
              email: updatedProfileData.email,
              profilePhoto: updatedProfileData.profilePhoto
            },
            emergencyContact: {
              name: updatedProfileData.emergencyContactName,
              phone: updatedProfileData.emergencyContactPhone,
              relation: updatedProfileData.emergencyContactRelation
            },
            preferences: {
              paymentDueDate: updatedProfileData.paymentDueDate
            },
            documents: updatedDocuments
          }
          
          const response = await fetch('http://localhost:3001/api/tenant/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendData)
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log(`✅ [TenantProfile] Document saved to database`)
            console.log(`📡 [TenantProfile] Broadcast to ${result.broadcastedTo} clients`)
            
            // Update localStorage
            localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(updatedProfileData))
            
            // Dispatch event for real-time updates
            window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
              detail: updatedProfileData
            }))
            
            toast.success(`${getDocumentLabel(documentType)} uploaded and saved to database!`)
          } else {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        } catch (backendError) {
          console.warn('⚠️ [TenantProfile] Backend save failed for document:', backendError)
          // Keep local storage update as fallback
          localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(updatedProfileData))
          toast.success(`${getDocumentLabel(documentType)} uploaded locally!`)
        }
      } else {
        // No token - save locally only
        localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(updatedProfileData))
        toast.success(`${getDocumentLabel(documentType)} uploaded locally!`)
      }
    } catch (error) {
      console.error(`❌ [TenantProfile] Error uploading ${documentType}:`, error)
      toast.error(`Failed to upload ${getDocumentLabel(documentType)}: ${error.message}`)
    } finally {
      setUploadingDocuments(prev => ({ ...prev, [documentType]: false }))
    }
  }

  // Save profile data to backend
  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      console.log('🚀 [TenantProfile] Saving profile to backend...')
      
      // Get JWT token for authentication
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      // Prepare profile data for backend
      const profileDataForBackend = {
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
        rentalDetails: {
          rentAmount: profileData.rentAmount,
          securityDeposit: profileData.securityDeposit,
          leaseStartDate: profileData.leaseStartDate,
          leaseEndDate: profileData.leaseEndDate,
          outstandingBill: profileData.outstandingBill
        },
        documents: profileData.documents
      }
      
      // Make API call to save profile data
      const response = await fetch('http://localhost:3001/api/tenant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileDataForBackend)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ [TenantProfile] Profile saved successfully to MongoDB')
      console.log('📡 [TenantProfile] Broadcast to', result.broadcastedTo, 'clients')
      
      // Update localStorage as backup
      localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(profileData))
      
      // Update global user context
      const userUpdateData = {
        fullName: profileData.fullName,
        name: profileData.fullName,
        phone: profileData.phone,
        email: profileData.email,
        profilePhoto: profileData.profilePhoto
      }
      
      updateProfile(userUpdateData)
      setOriginalData(profileData)
      setIsEditing(false)
      
      // Dispatch custom event for additional components
      window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
        detail: profileData
      }))
      
      toast.success('Profile saved successfully to database!')
    } catch (error) {
      console.error('❌ [TenantProfile] Error saving profile:', error)
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setProfileData(originalData)
    setIsEditing(false)
  }

  const getDocumentLabel = (docType) => {
    switch (docType) {
      case 'governmentId': return 'Government ID'
      case 'rentalAgreement': return 'Rental Agreement'
      case 'proofOfResidence': return 'Proof of Current Residence'
      default: return 'Document'
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
                  // Handle both URL and base64 data
                  const viewUrl = document.data || document.url
                  if (viewUrl) {
                    window.open(viewUrl, '_blank')
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
                onClick={() => document.getElementById(`${documentType}-input`).click()}
                disabled={isUploading}
              >
                <Upload size={16} />
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-area" onClick={() => document.getElementById(`${documentType}-input`).click()}>
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

  if (loading && Object.keys(originalData).length === 0) {
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
              onClick={() => navigate('/tenant')}
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
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="btn-spinner"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              </>
            ) : (
              <button 
                className="btn-primary"
                onClick={() => setIsEditing(true)}
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
                      
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please choose a valid image file')
                        return
                      }
                      
                      try {
                        // Show upload progress
                        toast.loading('Uploading profile picture...', { duration: 3000 })
                        
                        // Convert image to base64 for storage
                        const convertToBase64 = (file) => {
                          return new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.readAsDataURL(file)
                            reader.onload = () => resolve(reader.result)
                            reader.onerror = error => reject(error)
                          })
                        }
                        
                        const photoBase64 = await convertToBase64(file)
                        
                        // Save to backend first
                        const token = localStorage.getItem('token')
                        if (token) {
                          try {
                            console.log('🚀 [TenantProfile] Saving photo to backend...')
                            
                            const photoUpdateData = {
                              basicInfo: {
                                fullName: profileData.fullName,
                                primaryPhone: profileData.phone,
                                email: profileData.email,
                                profilePhoto: photoBase64
                              },
                              emergencyContact: {
                                name: profileData.emergencyContactName,
                                phone: profileData.emergencyContactPhone,
                                relation: profileData.emergencyContactRelation
                              },
                              preferences: {
                                paymentDueDate: profileData.paymentDueDate
                              },
                              documents: profileData.documents
                            }
                            
                            const response = await fetch('http://localhost:3001/api/tenant/profile', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify(photoUpdateData)
                            })
                            
                            if (response.ok) {
                              const result = await response.json()
                              console.log('✅ [TenantProfile] Photo saved to MongoDB')
                              console.log('📡 [TenantProfile] Photo broadcast to', result.broadcastedTo, 'clients')
                              
                              // Success - update local state
                              const updatedData = {
                                ...profileData,
                                profilePhoto: photoBase64
                              }
                              
                              setProfileData(updatedData)
                              
                              // Update localStorage as backup
                              localStorage.setItem(`userProfilePhoto_${user?.id}`, photoBase64)
                              localStorage.setItem(`tenantProfile_${user?.id}`, JSON.stringify(updatedData))
                              
                              // Update user context for immediate UI updates
                              updateProfile({ ...updatedData, name: updatedData.fullName })
                              
                              // Dispatch custom event for other components
                              window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
                                detail: updatedData
                              }))
                              
                              toast.success('Profile photo saved to database!')
                            } else {
                              throw new Error(`HTTP error! status: ${response.status}`)
                            }
                          } catch (backendError) {
                            console.warn('⚠️ [TenantProfile] Backend photo save failed, using local fallback:', backendError)
                            
                            // Fallback to local storage only
                            const updatedData = {
                              ...profileData,
                              profilePhoto: photoBase64
                            }
                            
                            setProfileData(updatedData)
                            localStorage.setItem(`userProfilePhoto_${user?.id}`, photoBase64)
                            updateProfile(updatedData)
                            
                            toast.success('Profile photo updated locally!')
                          }
                        } else {
                          // No auth token - fallback to local only
                          const updatedData = {
                            ...profileData,
                            profilePhoto: photoBase64
                          }
                          
                          setProfileData(updatedData)
                          localStorage.setItem(`userProfilePhoto_${user?.id}`, photoBase64)
                          updateProfile(updatedData)
                          
                          toast.success('Profile photo updated locally!')
                        }
                      } catch (error) {
                        console.error('❌ [TenantProfile] Error uploading photo:', error)
                        toast.error('Failed to upload photo: ' + (error.message || 'Unknown error'))
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
                  <span className="form-value currency">
                    ${profileData.rentAmount || '0'}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>
                    <Shield size={16} />
                    Security Deposit
                  </label>
                  <span className="form-value currency">
                    ${profileData.securityDeposit || '0'}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Lease Start Date
                  </label>
                  <span className="form-value">
                    {profileData.leaseStartDate ? 
                      new Date(profileData.leaseStartDate).toLocaleDateString() : 
                      'Not provided'
                    }
                  </span>
                </div>
                
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Lease End Date
                  </label>
                  <span className="form-value">
                    {profileData.leaseEndDate ? 
                      new Date(profileData.leaseEndDate).toLocaleDateString() : 
                      'Not provided'
                    }
                  </span>
                </div>
                
                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    Payment Due Date
                  </label>
                  <span className="form-value">
                    {profileData.paymentDueDate}th of every month
                  </span>
                </div>
                
                <div className="form-group">
                  <label>
                    <CreditCard size={16} />
                    Current Outstanding Bill
                  </label>
                  <span className={`form-value currency ${profileData.outstandingBill > 0 ? 'outstanding' : 'paid'}`}>
                    ${profileData.outstandingBill}
                  </span>
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
              <DocumentUploadSection
                documentType="governmentId"
                label="Government ID Proof"
                description="Upload a clear copy of your Aadhar Card, Passport, Driving License, or other government-issued ID"
                icon={UserCheck}
              />
              
              <DocumentUploadSection
                documentType="rentalAgreement"
                label="Rental Agreement Copy"
                description="Upload a signed copy of your rental/lease agreement"
                icon={FileText}
              />
              
              <DocumentUploadSection
                documentType="proofOfResidence"
                label="Proof of Current Residence"
                description="Upload utility bill, bank statement, or other document showing your current address"
                icon={MapPin}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantProfile