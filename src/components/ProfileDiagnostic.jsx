import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const ProfileDiagnostic = () => {
  const [status, setStatus] = useState('');
  const [token, setToken] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setStatus('Token found in localStorage');
    } else {
      setStatus('No token found - need to login first');
    }
  }, []);

  const addResult = (test, success, details) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testLogin = async () => {
    setLoading(true);
    addResult('Login Test', false, 'Starting...');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'john.doe',
          password: 'tenant123',
          role: 'tenant'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setToken(result.token);
        localStorage.setItem('token', result.token);
        addResult('Login Test', true, `Login successful. User: ${result.user.name}, Room: ${result.user.room?.roomNumber}`);
        toast.success('Login successful!');
      } else {
        addResult('Login Test', false, `Login failed: ${result.error || 'Unknown error'}`);
        toast.error('Login failed!');
      }
    } catch (error) {
      addResult('Login Test', false, `Error: ${error.message}`);
      toast.error('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testGetProfile = async () => {
    if (!token) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    addResult('Get Profile Test', false, 'Starting...');

    try {
      const response = await fetch('http://localhost:3001/api/tenant/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setProfileData(result.tenant);
        addResult('Get Profile Test', true, `Profile loaded. Name: ${result.tenant.name}, Email: ${result.tenant.email}`);
        toast.success('Profile loaded successfully!');
      } else {
        addResult('Get Profile Test', false, `Failed: ${result.error || 'Unknown error'}`);
        toast.error('Failed to load profile!');
      }
    } catch (error) {
      addResult('Get Profile Test', false, `Error: ${error.message}`);
      toast.error('Profile load error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSaveProfile = async () => {
    if (!token || !profileData) {
      toast.error('Please login and load profile first');
      return;
    }

    setLoading(true);
    addResult('Save Profile Test', false, 'Starting...');

    const testData = {
      basicInfo: {
        fullName: 'John Doe Updated',
        primaryPhone: profileData.phone || '+1-234-567-8901',
        email: profileData.email || 'john.doe@email.com',
        profilePhoto: profileData.profilePhoto || null
      },
      emergencyContact: {
        name: 'Test Emergency Contact',
        phone: '+1-555-999-8888',
        relation: 'Parent'
      },
      preferences: {
        paymentDueDate: '15'
      },
      rentalDetails: {
        rentAmount: profileData.room?.rent?.toString() || '1500',
        securityDeposit: profileData.room?.securityDeposit?.toString() || '3000',
        leaseStartDate: '2024-01-01',
        leaseEndDate: '2024-12-31',
        outstandingBill: '0'
      },
      documents: {
        governmentId: null,
        rentalAgreement: null,
        proofOfResidence: null
      }
    };

    try {
      const response = await fetch('http://localhost:3001/api/tenant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        addResult('Save Profile Test', true, `Profile saved successfully! Updated name and emergency contact.`);
        toast.success('Profile saved successfully!');
        
        // Reload profile to verify changes
        setTimeout(() => testGetProfile(), 1000);
      } else {
        addResult('Save Profile Test', false, `Failed: ${result.error || 'Unknown error'}`);
        toast.error('Failed to save profile!');
      }
    } catch (error) {
      addResult('Save Profile Test', false, `Error: ${error.message}`);
      toast.error('Profile save error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔬 Profile Diagnostic Tool</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <strong>Status:</strong> {status}
        <br />
        <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}
        <br />
        <strong>Profile Loaded:</strong> {profileData ? 'Yes' : 'No'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ margin: '5px', padding: '10px 15px', fontSize: '14px' }}
        >
          {loading ? 'Loading...' : '1. Test Login'}
        </button>
        
        <button 
          onClick={testGetProfile} 
          disabled={loading || !token}
          style={{ margin: '5px', padding: '10px 15px', fontSize: '14px' }}
        >
          {loading ? 'Loading...' : '2. Test Get Profile'}
        </button>
        
        <button 
          onClick={testSaveProfile} 
          disabled={loading || !token || !profileData}
          style={{ margin: '5px', padding: '10px 15px', fontSize: '14px' }}
        >
          {loading ? 'Loading...' : '3. Test Save Profile'}
        </button>
        
        <button 
          onClick={clearResults}
          style={{ margin: '5px', padding: '10px 15px', fontSize: '14px', backgroundColor: '#f44336', color: 'white' }}
        >
          Clear Results
        </button>
      </div>

      {profileData && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
          <h3>📋 Current Profile Data:</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(profileData, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3>📊 Test Results:</h3>
        {testResults.length === 0 ? (
          <p>No tests run yet. Click the test buttons above.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{ 
                  margin: '10px 0', 
                  padding: '10px', 
                  backgroundColor: result.success ? '#e8f5e8' : '#ffe8e8',
                  borderRadius: '5px',
                  borderLeft: `4px solid ${result.success ? '#4CAF50' : '#f44336'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{result.test}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>{result.timestamp}</span>
                </div>
                <div style={{ marginTop: '5px', fontSize: '14px' }}>
                  {result.success ? '✅' : '❌'} {result.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDiagnostic;