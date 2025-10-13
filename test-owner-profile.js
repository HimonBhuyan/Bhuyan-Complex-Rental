// Test script to verify Owner Profile API functionality
const testOwnerProfile = async () => {
  console.log('🔍 Testing Owner Profile API functionality...\n');
  
  try {
    // 1. Test owner login
    console.log('1️⃣ Testing owner login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'owner',
        password: 'owner123',
        role: 'owner'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.success) {
      throw new Error('Owner login failed: ' + JSON.stringify(loginData));
    }
    
    console.log('✅ Owner login successful');
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${loginData.user.username}`);
    
    // 2. Test GET owner profile
    console.log('\n2️⃣ Testing GET owner profile...');
    const getProfileResponse = await fetch('http://localhost:3001/api/owner/profile', {
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
      throw new Error('GET owner profile failed');
    }
    console.log('✅ GET owner profile successful\n');
    
    // 3. Test PUT owner profile (save profile)
    console.log('3️⃣ Testing PUT owner profile (save profile)...');
    const testProfileUpdate = {
      basicInfo: {
        fullName: 'Updated Owner Name',
        profilePhoto: null,
        primaryPhone: '+1-555-999-8888',
        secondaryPhone: '+1-555-999-8889',
        email: 'updated.owner@example.com',
        residentialAddress: '123 Updated Street, City',
        officeAddress: '456 Updated Office Ave'
      },
      buildingDetails: {
        buildingName: 'Updated Building Name',
        buildingAddress: '789 Updated Building St',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        totalFloors: 5,
        totalUnits: 20,
        unitTypes: ['Residential', 'Commercial'],
        amenities: ['Updated Parking', 'Updated Security']
      },
      billingSettings: {
        bankDetails: {
          bankName: 'Updated Bank',
          accountNumber: '****5678',
          ifscCode: 'UPD001234',
          accountHolderName: 'Updated Owner Name'
        },
        upiDetails: {
          upiId: 'updated.owner@upi',
          qrCode: null
        },
        defaultRentRates: {
          '1bhk': 1300,
          '2bhk': 1900,
          '3bhk': 2600
        }
      },
      documents: []
    };

    const putProfileResponse = await fetch('http://localhost:3001/api/owner/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testProfileUpdate)
    });

    const putProfileData = await putProfileResponse.json();
    console.log('PUT Profile response status:', putProfileResponse.status);
    console.log('PUT Profile response:', JSON.stringify(putProfileData, null, 2));
    
    if (!putProfileResponse.ok) {
      throw new Error('PUT owner profile failed: ' + JSON.stringify(putProfileData));
    }
    console.log('✅ PUT owner profile successful\n');
    
    // 4. Test GET profile again to verify changes
    console.log('4️⃣ Verifying owner profile changes...');
    const verifyProfileResponse = await fetch('http://localhost:3001/api/owner/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyProfileData = await verifyProfileResponse.json();
    console.log('Verify Profile response status:', verifyProfileResponse.status);
    console.log('Verify Profile response:', JSON.stringify(verifyProfileData, null, 2));
    
    if (verifyProfileData.success && verifyProfileData.owner.name === 'Updated Owner Name') {
      console.log('✅ Owner profile update verified successfully');
    } else {
      console.log('❌ Owner profile update not reflected in database');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
testOwnerProfile().then(() => {
  console.log('\n🎉 Owner Profile API tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Owner Profile API tests failed:', error);
  process.exit(1);
});