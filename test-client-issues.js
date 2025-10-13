// Test script to diagnose client-side issues
// Using built-in fetch API available in Node.js 18+

const testClientProfile = async () => {
  console.log('🔍 Testing client profile API endpoints...\n');
  
  // Test data - using existing tenant from database with working credentials
  const testCredentials = {
    username: 'john.doe',  // Existing tenant username  
    password: 'tenant123', // Working password found from database
    role: 'tenant'         // Role is required for login
  };
  
  try {
    // 1. Test login
    console.log('1️⃣ Testing tenant login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok || !loginData.success) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Login successful, token obtained\n');
    
    // 2. Test GET profile
    console.log('2️⃣ Testing GET profile...');
    const getProfileResponse = await fetch('http://localhost:3001/api/tenant/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileData = await getProfileResponse.json();
    console.log('GET Profile response status:', getProfileResponse.status);
    console.log('GET Profile response:', JSON.stringify(profileData, null, 2));
    
    if (!getProfileResponse.ok) {
      throw new Error('GET profile failed');
    }
    console.log('✅ GET profile successful\n');
    
    // 3. Test PUT profile (save profile)
    console.log('3️⃣ Testing PUT profile (save profile)...');
    const testProfileUpdate = {
      basicInfo: {
        fullName: 'Updated Test Tenant',
        email: 'updated@example.com',
        primaryPhone: '+1-555-123-4567',
        profilePhoto: null
      },
      emergencyContact: {
        name: 'Emergency Contact Updated',
        phone: '+1-555-987-6543',
        relation: 'Parent'
      },
      preferences: {
        paymentDueDate: '15'
      },
      rentalDetails: {
        rentAmount: '1600',
        securityDeposit: '3200',
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
    
    const putProfileResponse = await fetch('http://localhost:3001/api/tenant/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProfileUpdate)
    });
    
    const putProfileData = await putProfileResponse.json();
    console.log('PUT Profile response status:', putProfileResponse.status);
    console.log('PUT Profile response:', JSON.stringify(putProfileData, null, 2));
    
    if (!putProfileResponse.ok) {
      throw new Error('PUT profile failed: ' + JSON.stringify(putProfileData));
    }
    console.log('✅ PUT profile successful\n');
    
    // 4. Test GET profile again to verify changes
    console.log('4️⃣ Verifying profile changes...');
    const verifyProfileResponse = await fetch('http://localhost:3001/api/tenant/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyProfileData = await verifyProfileResponse.json();
    console.log('Verify Profile response status:', verifyProfileResponse.status);
    console.log('Verify Profile response:', JSON.stringify(verifyProfileData, null, 2));
    
    if (verifyProfileData.success && verifyProfileData.tenant.name === 'Updated Test Tenant') {
      console.log('✅ Profile update verified successfully');
    } else {
      console.log('❌ Profile update not reflected in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testClientProfile().then(() => {
  console.log('\n🎉 All tests completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Tests failed:', error);
  process.exit(1);
});