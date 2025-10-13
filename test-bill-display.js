// Test script to verify bill generation and client dashboard display
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Owner login to generate bill
async function loginAsOwner() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'owner',
      password: 'owner123', 
      role: 'owner'
    });
    
    if (response.data.success) {
      console.log('✅ Owner login successful');
      return response.data.token;
    }
  } catch (error) {
    console.error('❌ Owner login failed:', error.response?.data || error.message);
    return null;
  }
}

// Get tenants for billing
async function getTenants(token) {
  try {
    const response = await axios.get(`${API_BASE}/admin/tenants-for-billing`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.tenants.length > 0) {
      console.log('✅ Found tenants:', response.data.tenants.length);
      return response.data.tenants[0]; // Get first tenant
    }
    
    console.log('⚠️ No tenants found for billing');
    return null;
  } catch (error) {
    console.error('❌ Failed to get tenants:', error.response?.data || error.message);
    return null;
  }
}

// Generate a test bill
async function generateTestBill(token, tenant) {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const billData = {
      tenantId: tenant._id,
      month: month,
      year: year,
      rent: tenant.room.rent,
      electricity: {
        meterStartReading: 1000,
        meterEndReading: 1200,
        chargesPerUnit: 8.5
      },
      waterBill: 500,
      commonAreaCharges: 300
    };
    
    const response = await axios.post(`${API_BASE}/admin/bills/generate-individual`, billData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ Bill generated successfully!');
      console.log('📧 Bill Number:', response.data.bill.billNumber);
      console.log('💰 Total Amount: ₹' + response.data.bill.totalAmount);
      console.log('📅 Due Date:', new Date(response.data.bill.dueDate).toLocaleDateString());
      console.log('⚡ Electricity: ' + billData.electricity.meterEndReading - billData.electricity.meterStartReading + ' units × ₹' + billData.electricity.chargesPerUnit + ' = ₹' + ((billData.electricity.meterEndReading - billData.electricity.meterStartReading) * billData.electricity.chargesPerUnit));
      return response.data.bill;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('✅ Bill for current month already exists');
      return { alreadyExists: true };
    }
    console.error('❌ Failed to generate bill:', error.response?.data || error.message);
    return null;
  }
}

// Test the tenant login and dashboard data fetch
async function testTenantDashboard(tenant) {
  try {
    // Login as tenant
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: tenant.username,
      password: 'tenant123', // Default password
      role: 'tenant'
    });
    
    if (!loginResponse.data.success) {
      console.log('⚠️ Tenant login failed, tenant might not exist yet');
      return;
    }
    
    const tenantToken = loginResponse.data.token;
    console.log('✅ Tenant login successful:', tenant.username);
    
    // Fetch dashboard data
    const dashboardResponse = await axios.get(`${API_BASE}/tenant/dashboard`, {
      headers: { 'Authorization': `Bearer ${tenantToken}` }
    });
    
    if (dashboardResponse.data.success) {
      const { bills } = dashboardResponse.data;
      console.log('✅ Tenant dashboard data fetched');
      console.log('📋 Bills found:', bills.length);
      
      bills.forEach((bill, index) => {
        console.log(`\n📄 Bill ${index + 1}:`);
        console.log('   Number:', bill.billNumber);
        console.log('   Period:', new Date(bill.year, bill.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        console.log('   Status:', bill.status.toUpperCase());
        console.log('   Rent: ₹' + bill.items.rent.amount);
        if (bill.items.electricity.amount > 0) {
          console.log('   Electricity: ₹' + bill.items.electricity.amount + ' (' + bill.items.electricity.unitsConsumed + ' units)');
        }
        if (bill.items.waterBill.amount > 0) {
          console.log('   Water: ₹' + bill.items.waterBill.amount);
        }
        if (bill.items.commonAreaCharges.amount > 0) {
          console.log('   Common Area: ₹' + bill.items.commonAreaCharges.amount);
        }
        console.log('   Total: ₹' + (bill.totalWithLateFee || bill.totalAmount));
        if (bill.lateFee > 0) {
          console.log('   Late Fee: ₹' + bill.lateFee + ' (' + bill.daysLate + ' days overdue)');
        }
        console.log('   Due Date:', new Date(bill.dueDate).toLocaleDateString());
      });
    }
  } catch (error) {
    console.error('❌ Failed to test tenant dashboard:', error.response?.data || error.message);
  }
}

// Main test function
async function runTest() {
  console.log('🧪 Starting Bill Display Test...\n');
  
  // Login as owner
  const token = await loginAsOwner();
  if (!token) return;
  
  // Get tenants
  const tenant = await getTenants(token);
  if (!tenant) {
    console.log('⚠️ No active tenants found. Please add a tenant first through the admin dashboard.');
    return;
  }
  
  console.log('👤 Testing with tenant:', tenant.name, '(Room:', tenant.room.roomNumber + ')');
  
  // Generate bill
  const bill = await generateTestBill(token, tenant);
  if (!bill) return;
  
  // Test tenant dashboard
  await testTenantDashboard(tenant);
  
  console.log('\n✅ Test completed!');
  console.log('\n📱 Next steps:');
  console.log('1. Open http://localhost:5174 in your browser');
  console.log('2. Login as tenant:', tenant.username, '/ tenant123');
  console.log('3. Navigate to "Pay Bills" tab to see the enhanced bill display');
  console.log('4. Check that electricity details show units and charges per unit');
  console.log('5. Verify late fees are calculated for overdue bills');
  console.log('6. Test the "Previous Bills" section for bill history');
}

// Run the test
runTest().catch(console.error);