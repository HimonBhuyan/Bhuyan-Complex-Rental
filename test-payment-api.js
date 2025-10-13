// API Test Script for Payment Routes
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDkyZDQwOWE3MjU3NDQ4MmI0YTk0ZSIsInVzZXJuYW1lIjoiam9obi5kb2UiLCJyb2xlIjoidGVuYW50IiwibmFtZSI6IkdZQU5ERUVQX1NoYXJtYSIsImlhdCI6MTc1OTg0MTE2MSwiZXhwIjoxNzU5ODQ0NzYxfQ.J2uEQciUyGXesom15uuDkg7mflk8u3zKUt7uG5mqu4E';
const BILL_ID = '68d92d409a72574482b4a953';
const AMOUNT = 1800;

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testCreateOrder() {
  try {
    console.log('🧪 Testing Create Order API...');
    const response = await axios.post(`${BASE_URL}/api/payments/create-order`, {
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
    const response = await axios.get(`${BASE_URL}/api/payments/history`, { headers });
    
    console.log('✅ Payment History Success:');
    console.log(`Found ${response.data.payments.length} payments`);
    return true;
  } catch (error) {
    console.error('❌ Payment History Failed:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Payment API Tests...\n');
  
  const orderId = await testCreateOrder();
  if (orderId) {
    console.log(`\n📋 Order created successfully: ${orderId}`);
  }
  
  await testPaymentHistory();
  
  console.log('\n✅ API Tests Completed!');
}

runTests().catch(error => {
  console.error('💥 Test failed:', error.message);
});