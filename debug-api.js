// Quick script to test API endpoints and debug client dashboard issues
const axios = require('axios');

async function testAPIs() {
  try {
    console.log('🧪 Testing API Endpoints...\n');
    
    // First, get all tenants to see who exists
    const ownerLogin = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'owner',
      password: 'owner123',
      role: 'owner'
    });
    
    if (!ownerLogin.data.success) {
      console.error('❌ Owner login failed');
      return;
    }
    
    const ownerToken = ownerLogin.data.token;
    console.log('✅ Owner logged in');
    
    // Get all tenants
    const tenantsResponse = await axios.get('http://localhost:3001/api/admin/tenants', {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    console.log('📋 Available tenants:');
    tenantsResponse.data.tenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.name} (${tenant.username}) - Room: ${tenant.room?.roomNumber || 'No room'}`);
    });
    
    if (tenantsResponse.data.tenants.length === 0) {
      console.log('❌ No tenants found. Need to create tenant first.');
      return;
    }
    
    // Try known working tenant credentials first
    const knownTenants = [
      { username: 'jane.smith', password: 'tenant123' },
      { username: 'john.doe', password: 'tenant123' }
    ];
    
    let tenantLogin = null;
    let workingTenant = null;
    
    // Try known credentials first
    for (const testTenant of knownTenants) {
      console.log(`\n🔐 Trying to login as: ${testTenant.username}`);
      try {
        tenantLogin = await axios.post('http://localhost:3001/api/auth/login', {
          username: testTenant.username,
          password: testTenant.password,
          role: 'tenant'
        });
        
        if (tenantLogin.data.success) {
          console.log('✅ Login successful!');
          workingTenant = testTenant;
          break;
        }
      } catch (err) {
        console.log('❌ Login failed for', testTenant.username);
        continue;
      }
    }
    
    if (!tenantLogin || !tenantLogin.data.success) {
      console.log('\n⚠️ Known credentials failed, trying first tenant with default password...');
      const tenant = tenantsResponse.data.tenants[0];
      console.log(`🔐 Trying: ${tenant.username}`);
      
      try {
        tenantLogin = await axios.post('http://localhost:3001/api/auth/login', {
          username: tenant.username,
          password: 'tenant123',
          role: 'tenant'
        });
      } catch (loginError) {
        console.error('❌ Final login attempt failed:', loginError.response?.data || loginError.message);
        return;
      }
    }
      
    if (tenantLogin && tenantLogin.data.success) {
      console.log('✅ Tenant login successful');
      const tenantToken = tenantLogin.data.token;
        
        // Test dashboard API
        console.log('\n📊 Testing dashboard API...');
        const dashboardResponse = await axios.get('http://localhost:3001/api/tenant/dashboard', {
          headers: { 'Authorization': `Bearer ${tenantToken}` }
        });
        
        if (dashboardResponse.data.success) {
          console.log('✅ Dashboard API working');
          console.log('👤 Tenant:', dashboardResponse.data.tenant.name);
          console.log('🏠 Room:', dashboardResponse.data.tenant.room?.roomNumber);
          console.log('📄 Bills found:', dashboardResponse.data.bills.length);
          
          // Show bill details
          dashboardResponse.data.bills.forEach((bill, index) => {
            console.log(`\n📋 Bill ${index + 1}:`);
            console.log(`   Number: ${bill.billNumber}`);
            console.log(`   Period: ${new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
            console.log(`   Status: ${bill.status}`);
            console.log(`   Rent: ₹${bill.items?.rent?.amount || 0}`);
            console.log(`   Electricity: ₹${bill.items?.electricity?.amount || 0} (${bill.items?.electricity?.unitsConsumed || 0} units)`);
            console.log(`   Water: ₹${bill.items?.waterBill?.amount || 0}`);
            console.log(`   Common Area: ₹${bill.items?.commonAreaCharges?.amount || 0}`);
            console.log(`   Total: ₹${bill.totalAmount}`);
            if (bill.lateFee > 0) {
              console.log(`   Late Fee: ₹${bill.lateFee} (${bill.daysLate} days)`);
            }
            console.log(`   Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`);
          });
          
          return {
            tenant,
            tenantToken,
            bills: dashboardResponse.data.bills
          };
        } else {
          console.error('❌ Dashboard API failed:', dashboardResponse.data);
        }
    } else {
      console.log('❌ No successful tenant login found');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testAPIs();