import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Building, User, Lock, Eye, EyeOff, ArrowRight, Shield, Home, Users } from 'lucide-react'
import ForgotPasswordModal from './ForgotPasswordModal'
import './Login.css'

// Error Boundary Component
class LoginErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Login component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontFamily: 'system-ui'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1rem' }}>
            <h2>Login Error</h2>
            <p>Something went wrong with the login page. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'tenant'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAnimated, setIsAnimated] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  const features = [
    {
      icon: Home,
      title: 'Tenant Dashboard',
      description: 'Manage your rental payments, view bills, and track your account balance'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with detailed transaction history'
    },
    {
      icon: Users,
      title: 'Communication Hub',
      description: 'Direct communication with property management and emergency contacts'
    }
  ]
  
  useEffect(() => {
    setIsAnimated(true)
    
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [features.length])

  // Demo users for development
  const demoUsers = [
    {
      id: 1,
      username: 'john.doe',
      password: 'tenant123',
      role: 'tenant',
      name: 'John Doe',
      roomNumber: '101',
      phone: '+1-234-567-8901',
      email: 'john.doe@email.com',
      securityDeposit: 3000,
      rentAmount: 1500,
      depositStatus: 'paid'
    },
    {
      id: 2,
      username: 'jane.smith',
      password: 'tenant123',
      role: 'tenant',
      name: 'Jane Smith',
      roomNumber: '202',
      phone: '+1-234-567-8902',
      email: 'jane.smith@email.com',
      securityDeposit: 3500,
      rentAmount: 1800,
      depositStatus: 'paid'
    },
    {
      id: 3,
      username: 'owner',
      password: 'owner123',
      role: 'owner',
      name: 'Building Owner',
      email: 'owner@building.com'
    }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Make API call to backend
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store JWT token
        localStorage.setItem('token', data.token)
        toast.success(`Welcome back, ${data.user.name}!`)
        onLogin(data.user)
      } else {
        toast.error(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      // Fallback to demo authentication if backend is not available
      const user = demoUsers.find(u => 
        u.username === formData.username && 
        u.password === formData.password && 
        u.role === formData.role
      )

      if (user) {
        toast.success(`Welcome back, ${user.name}! (Demo Mode)`)
        onLogin(user)
      } else {
        toast.error('Login failed. Please check your credentials and ensure the backend server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="login-page">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
      </div>
      
      <div className="login-container">
        {/* Left Panel - Features Showcase */}
        <div className="features-panel">
          <div className="brand-section">
            <div className="brand-logo">
              <Building size={48} />
            </div>
            <h1 className="brand-title">Bhuyan Complex Management System</h1>
            <p className="brand-subtitle">Modern. Secure. Efficient.</p>
          </div>
          
          <div className="features-showcase">
            <div className="feature-card">
              <div className="feature-icon">
                {currentFeature === 0 && <Home size={32} />}
                {currentFeature === 1 && <Shield size={32} />}
                {currentFeature === 2 && <Users size={32} />}
              </div>
              <h3>{features[currentFeature].title}</h3>
              <p>{features[currentFeature].description}</p>
            </div>
          </div>
          
          <div className="feature-indicators">
            {features.map((_, index) => (
              <div 
                key={index}
                className={`indicator ${index === currentFeature ? 'active' : ''}`}
                onClick={() => setCurrentFeature(index)}
              />
            ))}
          </div>
        </div>
        
        {/* Right Panel - Login Form */}
        <div className="login-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <h2>Bhuyan Complex Rent Management System</h2>
              <p>Sign in to access your account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">I am a</label>
                <div className="role-selector">
                  <div 
                    className={`role-option ${formData.role === 'tenant' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'tenant'})}
                  >
                    <Home size={20} />
                    <span>Tenant</span>
                  </div>
                  <div 
                    className={`role-option ${formData.role === 'owner' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, role: 'owner'})}
                  >
                    <Building size={20} />
                    <span>Owner</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <div className="input-icon">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your password"
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
              
              <button
                type="submit"
                className={`login-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
              
              <div className="forgot-password-section">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot your password?
                </button>
              </div>
            </form>
            
            <div className="demo-section">
              <div className="demo-divider">
                <span>Demo Accounts</span>
              </div>
              
              <div className="demo-grid">
                <div 
                  className="demo-card tenant" 
                  onClick={() => setFormData({username: 'john.doe', password: 'tenant123', role: 'tenant'})}
                >
                  <div className="demo-icon">
                    <Home size={16} />
                  </div>
                  <div className="demo-info">
                    <strong>Tenant</strong>
                    <span>john.doe / tenant123</span>
                  </div>
                </div>
                
                <div 
                  className="demo-card owner" 
                  onClick={() => setFormData({username: 'owner', password: 'owner123', role: 'owner'})}
                >
                  <div className="demo-icon">
                    <Building size={16} />
                  </div>
                  <div className="demo-info">
                    <strong>Owner</strong>
                    <span>owner / owner123</span>
                  </div>
                </div>
              </div>
              
              <p className="demo-note">Click on any demo account to auto-fill credentials</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

const LoginWithErrorBoundary = (props) => (
  <LoginErrorBoundary>
    <Login {...props} />
  </LoginErrorBoundary>
)

export default LoginWithErrorBoundary
