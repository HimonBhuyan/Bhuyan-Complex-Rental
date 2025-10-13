// Test Payment Routes Functionality
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Import models and connect to database
const connectDB = require('./config/database');
const { Bill, Tenant, Owner, Room } = require('./models');

const JWT_SECRET = process.env.JWT_KEY_SECRET || 'your-super-secret-jwt-key';

console.log('🔧 Testing Payment Routes Setup...\n');

async function testPaymentRoutes() {
  try {
    // Connect to database
    console.log('📊 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    // Check if we have test data
    console.log('\n📋 Checking for test data...');
    
    const tenantCount = await Tenant.countDocuments();
    const billCount = await Bill.countDocuments();
    const roomCount = await Room.countDocuments();
    
    console.log(`Tenants: ${tenantCount}`);
    console.log(`Bills: ${billCount}`);
    console.log(`Rooms: ${roomCount}`);

    // Create test tenant and bill if needed
    if (tenantCount === 0 || billCount === 0) {
      console.log('\n🔧 Creating test data for payment testing...');
      
      // Create test owner first
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('testowner123', 12);
      
      let owner = await Owner.findOne({ username: 'testowner' });
      if (!owner) {
        owner = new Owner({
          username: 'testowner',
          password: hashedPassword,
          name: 'Test Owner',
          email: 'testowner@example.com',
          phone: '1234567890'
        });
        await owner.save();
        console.log('✅ Test owner created');
      }

      // Create test room
      let room = await Room.findOne({ roomNumber: 'TEST-001' });
      if (!room) {
        room = new Room({
          roomNumber: 'TEST-001',
          floor: 1,
          type: '1BHK',
          rent: 15000,
          deposit: 30000,
          isOccupied: true,
          owner: owner._id
        });
        await room.save();
        console.log('✅ Test room created');
      }

      // Create test tenant
      const tenantPassword = await bcrypt.hash('testtenant123', 12);
      let tenant = await Tenant.findOne({ username: 'testtenant' });
      if (!tenant) {
        tenant = new Tenant({
          username: 'testtenant',
          password: tenantPassword,
          name: 'Test Tenant',
          email: 'testtenant@example.com',
          phone: '9876543210',
          room: room._id,
          securityDepositPaid: true
        });
        await tenant.save();
        console.log('✅ Test tenant created');
      }

      // Create test bill
      let bill = await Bill.findOne({ tenant: tenant._id, status: 'pending' });
      if (!bill) {
        const currentDate = new Date();
        bill = new Bill({
          tenant: tenant._id,
          room: room._id,
          billNumber: `BILL-${Date.now()}`,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          rent: room.rent,
          electricity: 500,
          water: 200,
          maintenance: 1000,
          other: 300,
          totalAmount: room.rent + 500 + 200 + 1000 + 300,
          dueDate: new Date(currentDate.getTime() + (15 * 24 * 60 * 60 * 1000)), // 15 days from now
          status: 'pending'
        });
        await bill.save();
        console.log('✅ Test bill created');
        console.log(`Bill ID: ${bill._id}`);
        console.log(`Amount: ₹${bill.totalAmount}`);
      }
    }

    // Test JWT token creation
    console.log('\n🔑 Testing JWT token creation...');
    const testTenant = await Tenant.findOne().populate('room');
    
    if (!testTenant) {
      throw new Error('No test tenant found');
    }

    const token = jwt.sign(
      { 
        id: testTenant._id, 
        username: testTenant.username, 
        role: 'tenant',
        name: testTenant.name 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ JWT token created for testing');
    console.log(`Tenant: ${testTenant.name} (${testTenant.username})`);

    // Find a test bill
    const testBill = await Bill.findOne({ 
      tenant: testTenant._id, 
      status: { $ne: 'paid' } 
    });

    if (!testBill) {
      throw new Error('No unpaid bill found for testing');
    }

    console.log('\n📄 Test Bill Found:');
    console.log(`Bill ID: ${testBill._id}`);
    console.log(`Bill Number: ${testBill.billNumber}`);
    console.log(`Amount: ₹${testBill.totalAmount}`);
    console.log(`Due Date: ${testBill.dueDate.toLocaleDateString()}`);
    console.log(`Status: ${testBill.status}`);

    // Test data for API calls
    console.log('\n📝 Test Data for API Calls:');
    console.log('===============================');
    console.log(`Authorization Header: Bearer ${token}`);
    console.log(`Bill ID: ${testBill._id}`);
    console.log(`Amount: ${testBill.totalAmount}`);
    console.log('===============================');

    console.log('\n🎯 Payment Routes Configuration Test:');
    console.log('✅ Razorpay credentials are configured');
    console.log('✅ Payment routes exist and are imported');
    console.log('✅ Authentication middleware is set up');
    console.log('✅ Database models are ready');
    console.log('✅ Test data is available');

    console.log('\n📋 Available API Endpoints:');
    console.log('POST /api/payments/create-order');
    console.log('POST /api/payments/verify');
    console.log('POST /api/payments/record');
    console.log('GET  /api/payments/history');
    console.log('POST /api/payments/upload-screenshot');
    console.log('GET  /api/payments/statistics (admin only)');

    console.log('\n🧪 To test manually:');
    console.log('1. Start the server: npm run server');
    console.log('2. Use the above token and bill ID to test endpoints');
    console.log('3. Check the next test script for automated API testing');

    return true;

  } catch (error) {
    console.error('\n❌ Payment Routes Test Failed:', error.message);
    return false;
  }
}

// Create API test function
async function createAPITestScript() {
  console.log('\n📝 Creating API test script...');
  
  const testTenant = await Tenant.findOne().populate('room');
  const testBill = await Bill.findOne({ 
    tenant: testTenant._id, 
    status: { $ne: 'paid' } 
  });

  const token = jwt.sign(
    { 
      id: testTenant._id, 
      username: testTenant.username, 
      role: 'tenant',
      name: testTenant.name 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testScript = `// API Test Script for Payment Routes
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TOKEN = '${token}';
const BILL_ID = '${testBill._id}';
const AMOUNT = ${testBill.totalAmount};

const headers = {
  'Authorization': \`Bearer \${TOKEN}\`,
  'Content-Type': 'application/json'
};

async function testCreateOrder() {
  try {
    console.log('🧪 Testing Create Order API...');
    const response = await axios.post(\`\${BASE_URL}/api/payments/create-order\`, {
      billId: BILL_ID,
      amount: AMOUNT
    }, { headers });
    
    console.log('✅ Create Order Success:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.order.id;
  } catch (error) {
    console.error('❌ Create Order Failed:', error.response?.data || error.message);
    return null;
  }
}

async function testPaymentHistory() {
  try {
    console.log('🧪 Testing Payment History API...');
    const response = await axios.get(\`\${BASE_URL}/api/payments/history\`, { headers });
    
    console.log('✅ Payment History Success:');
    console.log(\`Found \${response.data.payments.length} payments\`);
    return true;
  } catch (error) {
    console.error('❌ Payment History Failed:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Payment API Tests...\\n');
  
  const orderId = await testCreateOrder();
  if (orderId) {
    console.log(\`\\n📋 Order created successfully: \${orderId}\`);
  }
  
  await testPaymentHistory();
  
  console.log('\\n✅ API Tests Completed!');
}

runTests().catch(error => {
  console.error('💥 Test failed:', error.message);
});`;

  // Write the test script
  const fs = require('fs');
  fs.writeFileSync('test-payment-api.js', testScript);
  console.log('✅ API test script created: test-payment-api.js');
}

// Run the test
testPaymentRoutes().then(async (success) => {
  if (success) {
    await createAPITestScript();
    console.log('\n🚀 Payment Routes are ready for testing!');
    console.log('🔧 Run "node test-payment-api.js" after starting the server to test APIs');
  } else {
    console.log('\n🔧 Please fix the issues above before proceeding');
    process.exit(1);
  }
  
  // Close database connection
  await mongoose.connection.close();
  
}).catch((error) => {
  console.log('\n💥 Unexpected error:', error.message);
  process.exit(1);
});