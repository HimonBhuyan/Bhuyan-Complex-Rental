import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Building, User, Lock, Eye, EyeOff, Home } from 'lucide-react'

const SimpleLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'tenant'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = demoUsers.find(u => 
        u.username === formData.username && 
        u.password === formData.password && 
        u.role === formData.role
      )

      if (user) {
        toast.success(`Welcome back, ${user.name}!`)
        onLogin(user)
      } else {
        toast.error('Invalid credentials. Please try again.')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Building size={40} style={{ color: '#667eea', marginBottom: '1rem' }} />
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#333', 
            margin: '0 0 0.5rem 0' 
          }}>
            Rental Management System
          </h1>
          <p style={{ color: '#666', margin: '0', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              color: '#374151', 
              fontSize: '0.875rem' 
            }}>
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
              required
            >
              <option value="tenant">Tenant</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              color: '#374151', 
              fontSize: '0.875rem' 
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 600, 
              color: '#374151', 
              fontSize: '0.875rem' 
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 3rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1rem',
            color: '#374151',
            margin: '0 0 1rem 0',
            fontWeight: 600
          }}>
            Demo Credentials
          </h3>
          <div style={{
            color: '#6b7280',
            fontSize: '0.8rem',
            lineHeight: '1.6'
          }}>
            <div>
              <strong>Tenant:</strong> john.doe / tenant123<br />
              <strong>Tenant:</strong> jane.smith / tenant123<br />
              <strong>Owner:</strong> owner / owner123
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleLogin