// Generate a properly structured test bill for jane.smith
const axios = require('axios');

async function createProperBill() {
  try {
    // Login as owner
    const ownerLogin = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'owner',
      password: 'owner123',
      role: 'owner'
    });
    
    const ownerToken = ownerLogin.data.token;
    console.log('✅ Owner logged in');
    
    // Get tenant ID for jane.smith
    const tenantsResponse = await axios.get('http://localhost:3001/api/admin/tenants', {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    const janeSmith = tenantsResponse.data.tenants.find(t => t.username === 'jane.smith');
    if (!janeSmith) {
      console.log('❌ jane.smith not found');
      return;
    }
    
    console.log('👤 Found Jane Smith:', janeSmith.name, 'Room:', janeSmith.room.roomNumber);
    
    // Generate a proper bill for current month
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const billData = {
      tenantId: janeSmith._id,
      month: month,
      year: year,
      rent: janeSmith.room.rent || 20000,
      electricity: {
        meterStartReading: 1500,
        meterEndReading: 1750,
        chargesPerUnit: 9.0
      },
      waterBill: 600,
      commonAreaCharges: 400
    };
    
    console.log('🔧 Generating bill with data:', {
      month,
      year,
      rent: billData.rent,
      electricity: `${billData.electricity.unitsConsumed || (billData.electricity.meterEndReading - billData.electricity.meterStartReading)} units × ₹${billData.electricity.chargesPerUnit}`,
      water: billData.waterBill,
      commonArea: billData.commonAreaCharges
    });
    
    const response = await axios.post('http://localhost:3001/api/admin/bills/generate-individual', billData, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ New bill generated successfully!');
      console.log('📧 Bill Number:', response.data.bill.billNumber);
      console.log('💰 Total Amount: ₹' + response.data.bill.totalAmount);
      
      // Now test the tenant dashboard again
      const tenantLogin = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'jane.smith',
        password: 'tenant123',
        role: 'tenant'
      });
      
      const tenantToken = tenantLogin.data.token;
      const dashboardResponse = await axios.get('http://localhost:3001/api/tenant/dashboard', {
        headers: { 'Authorization': `Bearer ${tenantToken}` }
      });
      
      if (dashboardResponse.data.success) {
        console.log('\\n📊 Updated Dashboard Data:');
        console.log('📄 Bills found:', dashboardResponse.data.bills.length);
        
        dashboardResponse.data.bills.forEach((bill, index) => {
          console.log(`\\n📋 Bill ${index + 1}:`);
          console.log(`   Number: ${bill.billNumber || 'Missing'}`);
          console.log(`   Period: ${bill.month}/${bill.year}`);
          console.log(`   Status: ${bill.status}`);
          console.log(`   Rent: ₹${bill.items?.rent?.amount || 'Missing'}`);
          console.log(`   Electricity: ₹${bill.items?.electricity?.amount || 'Missing'} (${bill.items?.electricity?.unitsConsumed || 'Missing'} units)`);
          console.log(`   Water: ₹${bill.items?.waterBill?.amount || 'Missing'}`);
          console.log(`   Common Area: ₹${bill.items?.commonAreaCharges?.amount || 'Missing'}`);
          console.log(`   Total: ₹${bill.totalAmount || 'Missing'}`);
          console.log(`   Due Date: ${new Date(bill.dueDate).toLocaleDateString()}`);
        });
        
        console.log('\\n🎉 Client Dashboard should now show proper bill data!');
        console.log('🌐 Test at: http://localhost:5173/client');
        console.log('🔐 Login: jane.smith / tenant123');
      }
    }
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('✅ Bill already exists for current month');
      
      // Still test the dashboard
      const tenantLogin = await axios.post('http://localhost:3001/api/auth/login', {
        username: 'jane.smith',
        password: 'tenant123',
        role: 'tenant'
      });
      
      const tenantToken = tenantLogin.data.token;
      const dashboardResponse = await axios.get('http://localhost:3001/api/tenant/dashboard', {
        headers: { 'Authorization': `Bearer ${tenantToken}` }
      });
      
      console.log('📊 Current bills:', dashboardResponse.data.bills.length);
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

createProperBill();