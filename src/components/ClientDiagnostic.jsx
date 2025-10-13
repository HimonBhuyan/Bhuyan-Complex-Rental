import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useUser } from '../context/UserContext'
import { useRealTimeNotifications } from '../context/RealTimeNotificationContext'

const ClientDiagnostic = () => {
  const [tests, setTests] = useState({
    userContext: null,
    websocket: null,
    api: null,
    notifications: null
  })
  const [loading, setLoading] = useState(true)
  const { user } = useUser()
  const { connectionStatus, notifications, loading: notificationLoading } = useRealTimeNotifications()

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    console.log('🔍 Running client-side diagnostics...')

    // Test 1: User Context
    const userTest = user ? 'PASS' : 'FAIL'
    console.log(`👤 User Context: ${userTest}`, user)

    // Test 2: WebSocket Connection
    const wsTest = connectionStatus === 'connected' ? 'PASS' : 'FAIL'
    console.log(`📡 WebSocket: ${wsTest} (Status: ${connectionStatus})`)

    // Test 3: API Connection
    let apiTest = 'FAIL'
    try {
      const response = await fetch('http://localhost:3001/api/notifications')
      if (response.ok) {
        apiTest = 'PASS'
        console.log('🌐 API: PASS')
      }
    } catch (error) {
      console.error('🌐 API: FAIL', error)
    }

    // Test 4: Notifications
    const notificationsTest = !notificationLoading ? 'PASS' : 'LOADING'
    console.log(`🔔 Notifications: ${notificationsTest} (Count: ${notifications.length})`)

    setTests({
      userContext: userTest,
      websocket: wsTest,
      api: apiTest,
      notifications: notificationsTest
    })

    setLoading(false)
  }

  const testLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'john.doe',
          password: 'tenant123',
          role: 'tenant'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Test login successful!')
        console.log('✅ Test login successful:', data.user)
      } else {
        toast.error('Test login failed: ' + data.error)
        console.error('❌ Test login failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Test login error:', error)
      toast.error('Login test failed: ' + error.message)
    }
  }

  const testWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:3001')
      ws.onopen = () => {
        toast.success('WebSocket test connection successful!')
        console.log('✅ WebSocket test: Connected')
        ws.close()
      }
      ws.onerror = (error) => {
        toast.error('WebSocket test failed')
        console.error('❌ WebSocket test: Failed', error)
      }
    } catch (error) {
      console.error('❌ WebSocket test error:', error)
      toast.error('WebSocket test error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', background: 'white', margin: '1rem', borderRadius: '8px' }}>
        <h2>Running Diagnostics...</h2>
        <div>Please wait while we test the client-side functionality.</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', background: 'white', margin: '1rem', borderRadius: '8px', fontFamily: 'monospace' }}>
      <h2>🔍 Client-Side Diagnostics</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Test Results:</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ color: tests.userContext === 'PASS' ? 'green' : 'red' }}>
            👤 User Context: {tests.userContext} {user ? `(${user.name} - ${user.role})` : '(No user)'}
          </div>
          <div style={{ color: tests.websocket === 'PASS' ? 'green' : 'red' }}>
            📡 WebSocket: {tests.websocket} (Status: {connectionStatus})
          </div>
          <div style={{ color: tests.api === 'PASS' ? 'green' : 'red' }}>
            🌐 API Connection: {tests.api}
          </div>
          <div style={{ color: tests.notifications === 'PASS' ? 'green' : 'orange' }}>
            🔔 Notifications: {tests.notifications} (Count: {notifications.length})
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Manual Tests:</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={runDiagnostics}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Re-run Diagnostics
          </button>
          <button 
            onClick={testLogin}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔐 Test Login
          </button>
          <button 
            onClick={testWebSocket}
            style={{ 
              padding: '0.5rem 1rem', 
              background: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📡 Test WebSocket
          </button>
        </div>
      </div>

      <div>
        <h3>System Info:</h3>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          <div>🌐 Backend: http://localhost:3001</div>
          <div>⚛️ Frontend: http://localhost:5174</div>
          <div>👤 Current User: {user ? `${user.name} (${user.role})` : 'Not logged in'}</div>
          <div>🔗 WebSocket Status: {connectionStatus}</div>
          <div>📱 User Agent: {navigator.userAgent}</div>
        </div>
      </div>
    </div>
  )
}

export default ClientDiagnostic