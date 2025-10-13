// Script to create a test tenant account
// Using built-in fetch API available in Node.js 18+

const createTestTenant = async () => {
  console.log('🔧 Creating test tenant account...\n');
  
  try {
    // 1. Login as owner
    console.log('1️⃣ Logging in as owner...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'owner',
        password: 'owner123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok || !loginData.success) {
      throw new Error('Owner login failed: ' + JSON.stringify(loginData));
    }
    
    console.log('✅ Owner login successful');
    const ownerToken = loginData.token;
    
    // 2. Get available rooms
    console.log('\n2️⃣ Getting available rooms...');
    const roomsResponse = await fetch('http://localhost:3001/api/admin/rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const roomsData = await roomsResponse.json();
    if (!roomsResponse.ok || !roomsData.success) {
      throw new Error('Failed to get rooms: ' + JSON.stringify(roomsData));
    }
    
    console.log('✅ Rooms loaded:', roomsData.rooms.length, 'rooms');
    const availableRoom = roomsData.rooms.find(room => room.status === 'vacant');
    
    if (!availableRoom) {
      throw new Error('No vacant rooms available');
    }
    
    console.log('🏠 Using room:', availableRoom.roomNumber);
    
    // 3. Create tenant for the room
    console.log('\n3️⃣ Creating tenant account...');
    const tenantData = {
      name: 'Test Tenant User',
      email: 'testtenant@example.com',
      phone: '+1-555-123-4567',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+1-555-987-6543',
        relation: 'Parent'
      },
      moveInDate: '2024-01-01',
      securityDepositPaid: availableRoom.securityDeposit
    };
    
    const createTenantResponse = await fetch(`http://localhost:3001/api/admin/rooms/${availableRoom._id}/assign-tenant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tenantData)
    });
    
    const createTenantData = await createTenantResponse.json();
    if (!createTenantResponse.ok || !createTenantData.success) {
      throw new Error('Failed to create tenant: ' + JSON.stringify(createTenantData));
    }
    
    console.log('✅ Tenant created successfully!');
    console.log('📋 Tenant Details:');
    console.log(`   Username: ${createTenantData.tenant.generatedUsername}`);
    console.log(`   Password: ${createTenantData.tenant.generatedPassword}`);
    console.log(`   Name: ${createTenantData.tenant.name}`);
    console.log(`   Room: ${availableRoom.roomNumber}`);
    console.log(`   ID: ${createTenantData.tenant._id}`);
    
    // 4. Test tenant login
    console.log('\n4️⃣ Testing tenant login...');
    const tenantLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: createTenantData.tenant.generatedUsername,
        password: createTenantData.tenant.generatedPassword
      })
    });
    
    const tenantLoginData = await tenantLoginResponse.json();
    if (!tenantLoginResponse.ok || !tenantLoginData.success) {
      throw new Error('Tenant login test failed: ' + JSON.stringify(tenantLoginData));
    }
    
    console.log('✅ Tenant login test successful!');
    console.log(`   User ID: ${tenantLoginData.user.id}`);
    console.log(`   User Type: ${tenantLoginData.user.userType}`);
    
    // Return tenant credentials for further testing
    return {
      username: createTenantData.tenant.generatedUsername,
      password: createTenantData.tenant.generatedPassword,
      id: createTenantData.tenant._id,
      token: tenantLoginData.token
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  createTestTenant().then((tenant) => {
    console.log('\n🎉 Test tenant created successfully!');
    console.log('\n🔑 Save these credentials for testing:');
    console.log(`Username: ${tenant.username}`);
    console.log(`Password: ${tenant.password}`);
    console.log(`ID: ${tenant.id}`);
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Failed to create test tenant:', error.message);
    process.exit(1);
  });
}

module.exports = { createTestTenant };