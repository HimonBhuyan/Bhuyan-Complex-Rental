// Debug script to test new user bill generation and client side display
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function debugNewUserBillFlow() {
  try {
    console.log('🔍 Debugging New User Bill Flow...\n');
    
    // Step 1: Login as owner to see all users
    console.log('1️⃣ Logging in as owner...');
    const ownerLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'owner',
      password: 'owner123',
      role: 'owner'
    });
    
    if (!ownerLogin.data.success) {
      console.error('❌ Owner login failed');
      return;
    }
    
    const ownerToken = ownerLogin.data.token;
    console.log('✅ Owner logged in successfully');
    
    // Step 2: Get all tenants to find the newest one
    console.log('\n2️⃣ Getting all tenants...');
    const tenantsResponse = await axios.get(`${API_BASE}/admin/tenants`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    console.log(`📋 Found ${tenantsResponse.data.tenants.length} tenants:`);
    const sortedTenants = tenantsResponse.data.tenants.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedTenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant.name} (${tenant.username}) - Room: ${tenant.room?.roomNumber || 'No room'} - Created: ${new Date(tenant.createdAt).toLocaleString()}`);
    });
    
    if (sortedTenants.length === 0) {
      console.log('❌ No tenants found');
      return;
    }
    
    // Use the most recently created tenant
    const newUser = sortedTenants[0];
    console.log(`\n👤 Testing with newest user: ${newUser.name} (${newUser.username})`);
    
    // Step 3: Check bills for this tenant directly from database
    console.log('\n3️⃣ Checking bills in database for this tenant...');
    const billsResponse = await axios.get(`${API_BASE}/admin/bills`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    const userBills = billsResponse.data.bills.filter(bill => 
      bill.tenant._id === newUser._id
    );
    
    console.log(`📄 Found ${userBills.length} bills for ${newUser.name} in database:`);
    userBills.forEach((bill, index) => {
      console.log(`   ${index + 1}. Bill ${bill.billNumber} - ₹${bill.totalAmount} - Status: ${bill.status}`);
      console.log(`      Month: ${bill.month}/${bill.year} - Due: ${new Date(bill.dueDate).toLocaleDateString()}`);
      console.log(`      Generated: ${new Date(bill.generatedAt).toLocaleDateString()}`);
    });
    
    // Step 4: Test tenant login
    console.log('\n4️⃣ Testing tenant login...');
    let tenantLogin;
    try {
      tenantLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: newUser.username,
        password: 'tenant123', // Default password
        role: 'tenant'
      });
      
      if (tenantLogin.data.success) {
        console.log('✅ Tenant login successful');
      } else {
        console.log('❌ Tenant login failed:', tenantLogin.data.error);
        return;
      }
    } catch (error) {
      console.log('❌ Tenant login error:', error.response?.data?.error || error.message);
      return;
    }
    
    const tenantToken = tenantLogin.data.token;
    
    // Step 5: Test tenant dashboard API
    console.log('\n5️⃣ Testing tenant dashboard API...');
    const dashboardResponse = await axios.get(`${API_BASE}/tenant/dashboard`, {
      headers: { 'Authorization': `Bearer ${tenantToken}` }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard API responded successfully');
      console.log(`👤 Tenant: ${dashboardResponse.data.tenant.name}`);
      console.log(`🏠 Room: ${dashboardResponse.data.tenant.room?.roomNumber || 'No room'}`);
      console.log(`📄 Bills returned by API: ${dashboardResponse.data.bills.length}`);
      
      if (dashboardResponse.data.bills.length === 0) {
        console.log('⚠️ WARNING: Dashboard API returned 0 bills for this tenant!');
        console.log('🔍 This suggests the issue is in the API query or bill-tenant association');
      } else {
        console.log('📋 Bills from dashboard API:');
        dashboardResponse.data.bills.forEach((bill, index) => {
          console.log(`   ${index + 1}. ${bill.billNumber || 'No number'} - ₹${bill.totalAmount || 0} - ${bill.status}`);
          if (bill.items) {
            console.log(`      Rent: ₹${bill.items.rent?.amount || 0}`);
            console.log(`      Electricity: ₹${bill.items.electricity?.amount || 0} (${bill.items.electricity?.unitsConsumed || 0} units)`);
            console.log(`      Water: ₹${bill.items.waterBill?.amount || 0}`);
            console.log(`      Common Area: ₹${bill.items.commonAreaCharges?.amount || 0}`);
          } else {
            console.log('      ⚠️ Bill items missing');
          }
        });
      }
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.data.error);
    }
    
    // Step 6: Test direct bill fetch
    console.log('\n6️⃣ Testing direct bill fetch API...');
    try {
      const billsDirectResponse = await axios.get(`${API_BASE}/tenant/bills`, {
        headers: { 'Authorization': `Bearer ${tenantToken}` }
      });
      
      if (billsDirectResponse.data.success) {
        console.log(`📄 Direct bills API returned: ${billsDirectResponse.data.bills.length} bills`);
      } else {
        console.log('❌ Direct bills API failed:', billsDirectResponse.data.error);
      }
    } catch (error) {
      console.log('❌ Direct bills API error:', error.response?.data?.error || error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('==============');
    
    if (userBills.length > 0 && dashboardResponse.data.bills.length === 0) {
      console.log('❌ ISSUE FOUND: Bills exist in database but dashboard API returns none');
      console.log('🔧 Possible causes:');
      console.log('   1. Bill-tenant ID association mismatch');
      console.log('   2. API query filtering issue');
      console.log('   3. Database population vs query timing');
      
      console.log('\n🔍 Checking tenant ID consistency:');
      console.log(`   Database tenant ID: ${newUser._id}`);
      console.log(`   Dashboard API tenant ID: ${dashboardResponse.data.tenant._id}`);
      console.log(`   Bill tenant ID: ${userBills[0]?.tenant._id || 'N/A'}`);
      
      if (newUser._id !== dashboardResponse.data.tenant._id) {
        console.log('❌ MISMATCH: Tenant IDs don\'t match between admin and dashboard APIs!');
      } else if (userBills[0] && userBills[0].tenant._id !== newUser._id) {
        console.log('❌ MISMATCH: Bill tenant ID doesn\'t match user ID!');
      } else {
        console.log('✅ Tenant IDs match - issue might be in API query logic');
      }
    } else if (userBills.length === 0) {
      console.log('❌ ISSUE: No bills found in database for this tenant');
      console.log('🔧 Bill generation might have failed or bills created for different tenant');
    } else if (dashboardResponse.data.bills.length > 0) {
      console.log('✅ SUCCESS: Bills found in database and returned by API');
      console.log('🎉 The client dashboard should be working correctly');
    }
    
    console.log('\n📱 NEXT STEPS:');
    console.log('==============');
    console.log(`1. Open browser: http://localhost:5173/login`);
    console.log(`2. Login with: ${newUser.username} / tenant123`);
    console.log(`3. Navigate to: http://localhost:5173/client`);
    console.log(`4. Check browser console for debug logs`);
    console.log(`5. Look for bills in "Pay Bills" tab`);
    
  } catch (error) {
    console.error('❌ Debug script error:', error.response?.data || error.message);
  }
}

debugNewUserBillFlow();