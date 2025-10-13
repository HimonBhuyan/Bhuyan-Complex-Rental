// Test Razorpay API Connection
require('dotenv').config();
const Razorpay = require('razorpay');

console.log('🔧 Testing Razorpay API Connection...\n');

// Check if environment variables are loaded
console.log('📋 Environment Variables Check:');
console.log(`RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`RAZORPAY_KEY_SECRET: ${process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing'}`);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.log('\n❌ Razorpay credentials are missing in .env file');
  process.exit(1);
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('\n🔐 Razorpay Instance Created Successfully');
console.log(`Key ID: ${process.env.RAZORPAY_KEY_ID}`);

async function testConnection() {
  try {
    console.log('\n📡 Testing API Connection...');
    
    // Test 1: Create a test order
    const testOrder = {
      amount: 100 * 100, // 100 INR in paisa
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: {
        purpose: 'Connection Test',
        timestamp: new Date().toISOString()
      }
    };

    console.log('🧪 Creating test order...');
    const order = await razorpay.orders.create(testOrder);
    
    if (order && order.id) {
      console.log('✅ Test Order Created Successfully!');
      console.log(`Order ID: ${order.id}`);
      console.log(`Amount: ₹${order.amount / 100}`);
      console.log(`Status: ${order.status}`);
      console.log(`Created At: ${new Date(order.created_at * 1000).toLocaleString()}`);
      
      // Test 2: Fetch the created order
      console.log('\n📋 Fetching order details...');
      const fetchedOrder = await razorpay.orders.fetch(order.id);
      
      if (fetchedOrder && fetchedOrder.id === order.id) {
        console.log('✅ Order Fetch Successful!');
        console.log(`Fetched Order ID: ${fetchedOrder.id}`);
        console.log(`Status: ${fetchedOrder.status}`);
      } else {
        console.log('❌ Order Fetch Failed');
      }
      
    } else {
      console.log('❌ Test Order Creation Failed');
      return false;
    }
    
    // Test 3: List recent orders
    console.log('\n📊 Fetching recent orders...');
    const orders = await razorpay.orders.all({
      count: 5
    });
    
    if (orders && orders.items) {
      console.log(`✅ Found ${orders.items.length} recent orders`);
      orders.items.forEach((order, index) => {
        console.log(`  ${index + 1}. ${order.id} - ₹${order.amount / 100} - ${order.status}`);
      });
    }
    
    console.log('\n🎉 All Razorpay API Tests Passed!');
    console.log('✅ Your Razorpay integration is working correctly');
    
    return true;
    
  } catch (error) {
    console.log('\n❌ Razorpay API Test Failed:');
    
    if (error.statusCode) {
      console.log(`HTTP Status: ${error.statusCode}`);
    }
    
    if (error.error) {
      console.log(`Error Code: ${error.error.code}`);
      console.log(`Description: ${error.error.description}`);
      
      // Common error solutions
      switch(error.error.code) {
        case 'BAD_REQUEST_ERROR':
          console.log('\n💡 Possible Solutions:');
          console.log('- Check if your API keys are correct');
          console.log('- Ensure you are using the correct environment (test/live)');
          break;
        case 'UNAUTHORIZED':
          console.log('\n💡 Possible Solutions:');
          console.log('- Verify your API key and secret are correct');
          console.log('- Make sure the key is not disabled in Razorpay dashboard');
          break;
        default:
          console.log('\n💡 Check your internet connection and try again');
      }
    } else {
      console.log(`Error: ${error.message}`);
    }
    
    return false;
  }
}

// Run the test
testConnection().then((success) => {
  if (success) {
    console.log('\n🚀 Ready to process payments!');
  } else {
    console.log('\n🔧 Please fix the issues above before proceeding');
    process.exit(1);
  }
}).catch((error) => {
  console.log('\n💥 Unexpected error:', error.message);
  process.exit(1);
});