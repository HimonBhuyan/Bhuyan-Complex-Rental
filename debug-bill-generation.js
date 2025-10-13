// Using built-in fetch (Node 18+) or axios
const axios = require('axios');

async function fetch(url, options = {}) {
  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body ? JSON.parse(options.body) : undefined
    });
    return {
      ok: response.status >= 200 && response.status < 300,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data))
    };
  } catch (error) {
    return {
      ok: false,
      json: () => Promise.resolve(error.response?.data || {}),
      text: () => Promise.resolve(JSON.stringify(error.response?.data || {error: error.message}))
    };
  }
}

async function testBillGeneration() {
  console.log('🔍 Testing Bill Generation API...\n');
  
  try {
    // First, let's test if server is running
    console.log('1. Testing server health...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Server health:', healthData);
    
    // Test login to get token
    console.log('\n2. Testing admin login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
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
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    const token = loginData.token;
    
    // Test fetching tenants for billing
    console.log('\n3. Testing tenants-for-billing endpoint...');
    const tenantsResponse = await fetch('http://localhost:3001/api/admin/tenants-for-billing', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!tenantsResponse.ok) {
      console.error('❌ Tenants fetch failed:', await tenantsResponse.text());
      return;
    }
    
    const tenantsData = await tenantsResponse.json();
    console.log('✅ Tenants data:', JSON.stringify(tenantsData, null, 2));
    
    if (!tenantsData.tenants || tenantsData.tenants.length === 0) {
      console.log('⚠️  No tenants found! You need to add tenants first.');
      console.log('\nTo add a tenant:');
      console.log('1. Go to admin dashboard');
      console.log('2. Click "Add Rooms"');
      console.log('3. Create a room and assign a tenant');
      return;
    }
    
    // Test bill generation with first tenant
    const tenant = tenantsData.tenants[0];
    console.log(`\n4. Testing bill generation for tenant: ${tenant.name}`);
    
    const billData = {
      tenantId: tenant._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      rent: tenant.room.rent || 15000,
      electricity: {
        meterStartReading: 1000,
        meterEndReading: 1150,
        chargesPerUnit: 8.5
      },
      waterBill: 500,
      commonAreaCharges: 300
    };
    
    console.log('Bill data to send:', JSON.stringify(billData, null, 2));
    
    const billResponse = await fetch('http://localhost:3001/api/admin/bills/generate-individual', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(billData)
    });
    
    const billResult = await billResponse.json();
    
    console.log('Response status:', billResponse.ok);
    console.log('Response data:', JSON.stringify(billResult, null, 2));
    
    if (billResponse.ok) {
      console.log('✅ Bill generation successful!');
    } else {
      console.error('❌ Bill generation failed!');
      
      // Let's try to see if there are any existing bills for this tenant
      console.log('\n5. Checking existing bills for this tenant...');
      const existingBillsResponse = await fetch('http://localhost:3001/api/admin/bills', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (existingBillsResponse.ok) {
        const existingBills = await existingBillsResponse.json();
        console.log('Existing bills:', JSON.stringify(existingBills, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

testBillGeneration();