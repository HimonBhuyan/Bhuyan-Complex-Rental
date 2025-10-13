import React, { useState, useEffect } from 'react';

const TestApp = () => {
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [loginTest, setLoginTest] = useState('Not tested');

  // Test backend connection
  const testBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setBackendStatus('✅ Connected - ' + JSON.stringify(data));
    } catch (error) {
      setBackendStatus('❌ Failed - ' + error.message);
    }
  };

  // Test login
  const testLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'owner',
          password: 'owner123',
          role: 'owner'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setLoginTest('✅ Login Success - ' + data.user.name);
      } else {
        setLoginTest('❌ Login Failed - ' + data.error);
      }
    } catch (error) {
      setLoginTest('❌ Login Error - ' + error.message);
    }
  };

  useEffect(() => {
    testBackend();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '30px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1>🔧 Rental Management System Test</h1>
        
        <div style={{ margin: '20px 0' }}>
          <h3>Frontend Status:</h3>
          <p style={{ 
            background: 'rgba(34, 197, 94, 0.2)', 
            padding: '10px', 
            borderRadius: '8px',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            ✅ React App is Working
          </p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h3>Backend Connection:</h3>
          <p style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            padding: '10px', 
            borderRadius: '8px',
            fontFamily: 'monospace'
          }}>
            {backendStatus}
          </p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h3>Authentication Test:</h3>
          <p style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            padding: '10px', 
            borderRadius: '8px',
            fontFamily: 'monospace'
          }}>
            {loginTest}
          </p>
          <button 
            onClick={testLogin}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              margin: '10px 0'
            }}
          >
            Test Login
          </button>
        </div>

        <div style={{ margin: '30px 0' }}>
          <h3>Navigation Test:</h3>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Go to Login Page
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            style={{
              background: '#764ba2',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              margin: '5px'
            }}
          >
            Go to Main App
          </button>
        </div>

        <div style={{ marginTop: '30px', fontSize: '14px', opacity: '0.8' }}>
          <p><strong>If you see this page, your frontend React server is working correctly.</strong></p>
          <p>The black page issue is likely due to:</p>
          <ul style={{ textAlign: 'left' }}>
            <li>Context provider errors</li>
            <li>CSS loading issues</li>
            <li>Component import errors</li>
            <li>JavaScript runtime errors</li>
          </ul>
          <p>Check your browser's developer console (F12) for error messages.</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;