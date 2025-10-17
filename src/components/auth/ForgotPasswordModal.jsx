import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, X, ArrowRight, ArrowLeft, Shield } from 'lucide-react'
import { getApiUrl } from '../../utils/api'
import './ForgotPasswordModal.css'

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1) // 1: Email, 2: Verification, 3: New Password
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
    role: 'tenant'
  })
  const [verificationToken, setVerificationToken] = useState('')

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Please enter your email address')
      return
    }
    
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role
        })
      })

      const data = await response.json()

      if (data.success) {
        setVerificationToken(data.resetToken)
        if (data.devMode) {
          toast.success('Development Mode: Check server console for verification code')
          console.log('🔑 Development Mode - Verification Code:', data.code)
        } else {
          toast.success('Verification code sent to your email')
        }
        setCurrentStep(2)
      } else {
        toast.error(data.error || 'Email not found. Please check your email address.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    
    if (!formData.verificationCode) {
      toast.error('Please enter the verification code')
      return
    }

    if (formData.verificationCode.length !== 6) {
      toast.error('Verification code must be 6 digits')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
          resetToken: verificationToken
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Code verified successfully')
        setCurrentStep(3)
      } else {
        toast.error(data.error || 'Invalid or expired verification code')
      }
    } catch (error) {
      console.error('Code verification error:', error)
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep3Submit = async (e) => {
    e.preventDefault()
    
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in both password fields')
      return
    }

    if (!validatePassword(formData.newPassword)) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
          newPassword: formData.newPassword,
          resetToken: verificationToken
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Password reset successfully! You can now login with your new password.')
        handleClose()
      } else {
        toast.error(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setFormData({
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: '',
      role: 'tenant'
    })
    setVerificationToken('')
    onClose()
  }

  const goBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resendCode = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role
        })
      })

      const data = await response.json()

      if (data.success) {
        setVerificationToken(data.resetToken)
        if (data.devMode) {
          toast.success('Development Mode: Check server console for new verification code')
          console.log('🔑 Development Mode - New Verification Code:', data.code)
        } else {
          toast.success('New verification code sent to your email')
        }
      } else {
        toast.error(data.error || 'Failed to resend verification code')
      }
    } catch (error) {
      toast.error('Failed to resend verification code')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="icon-wrapper">
              <Shield size={24} />
            </div>
            <h2>Reset Password</h2>
            <p>Step {currentStep} of 3</p>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="modal-content">
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="step-form">
              <div className="step-header">
                <h3>Enter Your Email</h3>
                <p>We'll send a verification code to reset your password</p>
              </div>

              <div className="form-group">
                <label className="form-label">I am a</label>
                <div className="role-selector">
                  <div 
                    className={`role-option ${formData.role === 'tenant' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'tenant'})}
                  >
                    <span>Tenant</span>
                  </div>
                  <div 
                    className={`role-option ${formData.role === 'owner' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'owner'})}
                  >
                    <span>Owner</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Sending Code...
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="step-form">
              <div className="step-header">
                <h3>Enter Verification Code</h3>
                <p>We sent a 6-digit code to <strong>{formData.email}</strong></p>
                {process.env.NODE_ENV === 'development' && (
                  <div className="dev-info">
                    <p>💡 <strong>Development Mode:</strong> Check the server console for the verification code</p>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Shield size={20} />
                  </div>
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleInputChange}
                    className="form-input code-input"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={goBackStep}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>

              <div className="resend-section">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={resendCode}
                  disabled={loading}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="step-form">
              <div className="step-header">
                <h3>Set New Password</h3>
                <p>Choose a strong password for your account</p>
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="password-requirements">
                <p>Password must be at least 6 characters long</p>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="back-btn"
                  onClick={goBackStep}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal