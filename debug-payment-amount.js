// Debug Payment Amount Issues
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/database');
const { Bill, Tenant } = require('./models');

const JWT_SECRET = process.env.JWT_KEY_SECRET || 'your-super-secret-jwt-key';
const BASE_URL = 'http://localhost:3001';

async function debugPaymentAmount() {
  try {
    console.log('🔧 Debugging Payment Amount Issues...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Get test tenant and bill
    const testTenant = await Tenant.findOne().populate('room');
    const testBill = await Bill.findOne({ 
      tenant: testTenant._id, 
      status: { $ne: 'paid' } 
    });

    if (!testBill) {
      throw new Error('No unpaid bill found');
    }

    console.log('📄 Original Bill Details:');
    console.log(`Bill ID: ${testBill._id}`);
    console.log(`Bill Number: ${testBill.billNumber}`);
    console.log(`Month/Year: ${testBill.month}/${testBill.year}`);
    console.log(`Total Amount: ₹${testBill.totalAmount}`);
    console.log(`Due Date: ${testBill.dueDate}`);
    console.log(`Current Date: ${new Date()}`);
    console.log(`Days Overdue: ${testBill.dueDate < new Date() ? Math.ceil((new Date() - testBill.dueDate) / (1000 * 60 * 60 * 24)) : 0}`);

    // Calculate penalty (same logic as in payment routes)
    const currentDate = new Date();
    let penaltyAmount = 0;
    
    if (testBill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - testBill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = testBill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, testBill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }

    const totalAmount = testBill.totalAmount + penaltyAmount;

    console.log('\n💰 Amount Calculation:');
    console.log(`Base Amount: ₹${testBill.totalAmount}`);
    console.log(`Penalty Amount: ₹${penaltyAmount}`);
    console.log(`Total Amount: ₹${totalAmount}`);

    // Create JWT token
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

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test with correct amount
    console.log('\n🧪 Testing Create Order with Calculated Amount...');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/payments/create-order`, {
        billId: testBill._id,
        amount: totalAmount
      }, { headers });
      
      console.log('✅ Create Order Success!');
      console.log(`Order ID: ${response.data.order.id}`);
      console.log(`Order Amount: ₹${response.data.order.amount / 100}`);
      console.log(`Bill Total: ₹${response.data.bill.totalAmount}`);
      console.log(`Penalty: ₹${response.data.bill.penaltyAmount}`);
      
      return response.data.order.id;
      
    } catch (error) {
      console.error('❌ Create Order Failed:', error.response?.data || error.message);
      
      // Try with different amounts to find the issue
      console.log('\n🔍 Trying different amounts...');
      
      const testAmounts = [
        testBill.totalAmount,
        testBill.totalAmount + 1,
        testBill.totalAmount - 1,
        totalAmount + 1,
        totalAmount - 1
      ];
      
      for (const amount of testAmounts) {
        try {
          console.log(`Testing with amount: ₹${amount}`);
          const testResponse = await axios.post(`${BASE_URL}/api/payments/create-order`, {
            billId: testBill._id,
            amount: amount
          }, { headers });
          
          console.log(`✅ Success with amount: ₹${amount}`);
          break;
          
        } catch (testError) {
          console.log(`❌ Failed with amount: ₹${amount} - ${testError.response?.data?.message || testError.message}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

debugPaymentAmount();