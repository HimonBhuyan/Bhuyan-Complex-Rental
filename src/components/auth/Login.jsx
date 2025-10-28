import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Building, User, Lock, Shield, Home, Users, Eye, EyeOff } from 'lucide-react'
import { getApiUrl } from '../../utils/api'
import ForgotPasswordModal from './ForgotPasswordModal'
import './Login.css'

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
  
  // Reset form when component mounts (after logout)
  useEffect(() => {
    console.log('🔄 [Login] Component mounted - resetting form');
    setFormData({
      username: '',
      password: '',
      role: 'tenant'
    });
    setLoading(false);
    
    // Listen for logout events to reset form
    const handleLogout = () => {
      console.log('🚪 [Login] Received logout event - resetting form');
      setFormData({
        username: '',
        password: '',
        role: 'tenant'
      });
      setLoading(false);
    };
    
    window.addEventListener('userLoggedOut', handleLogout);
    return () => window.removeEventListener('userLoggedOut', handleLogout);
  }, [])
  
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
    console.log('🔑 [Login] Starting login process...');
    
    // Clear any existing tokens before login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setLoading(true)

    try {
      console.log('🌍 [Login] Making API call to backend...');
      // Make API call to backend
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role
        })
      })
      
      console.log('📨 [Login] Backend response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json()
      console.log('📊 [Login] Backend response data:', data);
      
      if (data.success && data.token && data.user) {
        // Store JWT token
        localStorage.setItem('token', data.token)
        console.log('✅ [Login] Token stored, calling onLogin...');
        toast.success(`Welcome back, ${data.user.name}!`)
        onLogin(data.user)
      } else {
        console.error('❌ [Login] API returned failure:', data);
        toast.error(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      console.error('❌ [Login] Login error:', error)
      console.log('🔄 [Login] Attempting fallback to demo authentication...');
      
      // Fallback to demo authentication if backend is not available
      const user = demoUsers.find(u => 
        u.username === formData.username.trim() && 
        u.password === formData.password && 
        u.role === formData.role
      )

      if (user) {
        console.log('✅ [Login] Demo user found, logging in...');
        toast.success(`Welcome back, ${user.name}! (Demo Mode)`)
        onLogin(user)
      } else {
        console.error('❌ [Login] Demo user not found');
        toast.error('Login failed. Please check your credentials and try again.')
      }
    } finally {
      setLoading(false)
      console.log('🏁 [Login] Login process completed');
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
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className={`login-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  )
}

export default Login