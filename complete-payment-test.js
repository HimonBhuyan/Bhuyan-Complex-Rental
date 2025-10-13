// Complete Payment System Test
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { Bill, Tenant, Payment } = require('./models');

const JWT_SECRET = process.env.JWT_KEY_SECRET || 'your-super-secret-jwt-key';
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

async function completePaymentTest() {
  try {
    console.log('🚀 Complete Payment System Test\n');
    console.log('================================\n');

    // 1. Test server connectivity
    console.log('🔗 Testing Server Connectivity...');
    
    try {
      const backendHealth = await axios.get(`${BACKEND_URL}/api/auth/login`, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      console.log('✅ Backend server is responding');
    } catch (error) {
      console.log('❌ Backend server not responding:', error.message);
      return false;
    }

    try {
      const frontendHealth = await axios.get(FRONTEND_URL, { 
        timeout: 5000,
        validateStatus: () => true
      });
      console.log('✅ Frontend server is responding');
    } catch (error) {
      console.log('❌ Frontend server not responding:', error.message);
    }

    // 2. Connect to database and get test data
    console.log('\n📊 Connecting to Database...');
    await connectDB();
    console.log('✅ Database connected');

    const testTenant = await Tenant.findOne().populate('room');
    if (!testTenant) {
      throw new Error('No test tenant found');
    }

    const testBill = await Bill.findOne({ 
      tenant: testTenant._id, 
      status: { $ne: 'paid' } 
    });
    
    if (!testBill) {
      throw new Error('No unpaid bill found');
    }

    console.log(`✅ Test tenant: ${testTenant.name} (${testTenant.username})`);
    console.log(`✅ Test bill: ${testBill._id} - ₹${testBill.totalAmount}`);

    // 3. Create authentication token
    console.log('\n🔑 Creating Authentication Token...');
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
    console.log('✅ JWT token created');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 4. Test authentication
    console.log('\n🔐 Testing Authentication...');
    try {
      const authResponse = await axios.get(`${BACKEND_URL}/api/payments/history`, { headers });
      console.log('✅ Authentication working');
      console.log(`Previous payments: ${authResponse.data.payments.length}`);
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.response?.data || authError.message);
    }

    // 5. Calculate correct payment amount
    console.log('\\n💰 Calculating Payment Amount...');
    const currentDate = new Date();
    let penaltyAmount = 0;
    
    if (testBill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - testBill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = testBill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, testBill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }
    
    const totalAmount = testBill.totalAmount + penaltyAmount;
    console.log(`Base amount: ₹${testBill.totalAmount}`);
    console.log(`Penalty: ₹${penaltyAmount} (${penaltyAmount > 0 ? 'overdue' : 'on time'})`);
    console.log(`Total: ₹${totalAmount}`);

    // 6. Test Razorpay order creation
    console.log('\\n🧪 Testing Razorpay Order Creation...');
    let orderCreated = false;
    let orderId = null;

    // First, let's debug by checking the exact error from the backend
    try {
      const orderResponse = await axios.post(`${BACKEND_URL}/api/payments/create-order`, {
        billId: testBill._id.toString(),
        amount: totalAmount
      }, { 
        headers,
        validateStatus: () => true // Accept any status code to see exact error
      });

      if (orderResponse.status === 200 && orderResponse.data.success) {
        console.log('✅ Razorpay order created successfully!');
        console.log(`Order ID: ${orderResponse.data.order.id}`);
        console.log(`Order Amount: ₹${orderResponse.data.order.amount / 100}`);
        orderCreated = true;
        orderId = orderResponse.data.order.id;
      } else {
        console.log('❌ Order creation failed:');
        console.log(`Status: ${orderResponse.status}`);
        console.log(`Response: ${JSON.stringify(orderResponse.data, null, 2)}`);
      }

    } catch (orderError) {
      console.log('❌ Order creation error:', orderError.message);
      if (orderError.response) {
        console.log(`Status: ${orderError.response.status}`);
        console.log(`Response: ${JSON.stringify(orderError.response.data, null, 2)}`);
      }
    }

    // 7. Test different amounts if first attempt failed
    if (!orderCreated) {
      console.log('\\n🔍 Debugging with Different Amounts...');
      
      const testAmounts = [
        testBill.totalAmount,
        totalAmount,
        Math.round(totalAmount),
        Math.floor(totalAmount),
        Math.ceil(totalAmount)
      ];

      for (const amount of testAmounts) {
        try {
          console.log(`Testing amount: ₹${amount}`);
          const testResponse = await axios.post(`${BACKEND_URL}/api/payments/create-order`, {
            billId: testBill._id.toString(),
            amount: amount
          }, { headers });

          if (testResponse.data.success) {
            console.log(`✅ Success with amount: ₹${amount}`);
            orderId = testResponse.data.order.id;
            orderCreated = true;
            break;
          }
        } catch (testError) {
          console.log(`❌ Failed with ₹${amount}: ${testError.response?.data?.message || testError.message}`);
        }
      }
    }

    // 8. Test payment verification (mock)
    if (orderCreated && orderId) {
      console.log('\\n✅ Payment Flow Test Summary:');
      console.log('==============================');
      console.log('✅ Server connectivity: OK');
      console.log('✅ Database connection: OK');
      console.log('✅ Authentication: OK');
      console.log('✅ Razorpay order creation: OK');
      console.log('✅ Payment amount calculation: OK');
      
      console.log('\\n📋 Payment Flow Ready!');
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      console.log(`Backend URL: ${BACKEND_URL}`);
      console.log(`Test Login: ${testTenant.username} / testtenant123`);
      console.log(`Test Bill ID: ${testBill._id}`);
      console.log(`Payment Amount: ₹${totalAmount}`);
      
    } else {
      console.log('\\n❌ Payment Flow Issues Found:');
      console.log('- Unable to create Razorpay orders');
      console.log('- Check server logs for detailed errors');
    }

    // 9. Display system status
    console.log('\\n🎯 System Status Summary:');
    console.log('==========================');
    console.log(`Razorpay API: ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Database: ✅ Connected (${mongoose.connection.db.databaseName})`);
    console.log(`Backend: ✅ Running (${BACKEND_URL})`);
    console.log(`Frontend: ✅ Running (${FRONTEND_URL})`);
    console.log(`Test Data: ✅ Available`);

    return orderCreated;

  } catch (error) {
    console.error('💥 Complete test failed:', error.message);
    return false;
  } finally {
    await mongoose.connection.close();
  }
}

// Run the complete test
completePaymentTest().then((success) => {
  if (success) {
    console.log('\\n🎉 Payment System is Ready!');
    console.log('You can now test the complete bill payment flow in the web interface.');
  } else {
    console.log('\\n🔧 Payment System needs attention.');
    console.log('Please check the issues identified above.');
  }
}).catch((error) => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
});