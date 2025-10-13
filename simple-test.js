// Simple test to understand current database state and login
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  console.log('🔍 Testing current database state and login...\n');
  
  const uri = 'mongodb://localhost:27017/rental_management_system';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('rental_management_system');
    
    // Check an existing tenant
    console.log('1️⃣ Checking existing tenant details...');
    const tenant = await db.collection('tenants').findOne({ username: 'john.doe' });
    
    if (tenant) {
      console.log('✅ Found tenant:', {
        id: tenant._id,
        username: tenant.username,
        name: tenant.name,
        hasPassword: !!tenant.password,
        passwordType: typeof tenant.password
      });
      
      if (tenant.password) {
        console.log('🔐 Password starts with:', tenant.password.substring(0, 10));
        
        // Try to verify with common passwords
        const commonPasswords = ['password123', 'tenant123', 'john.doe', '123456', 'password'];
        
        for (const pwd of commonPasswords) {
          try {
            const isValid = await bcrypt.compare(pwd, tenant.password);
            if (isValid) {
              console.log(`✅ Found working password: ${pwd}`);
              
              // Test login API
              console.log('\n2️⃣ Testing login API with found password...');
              const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  username: 'john.doe',
                  password: pwd,
                  role: 'tenant'
                })
              });
              
              const result = await response.json();
              console.log('Login response status:', response.status);
              console.log('Login response:', result);
              
              if (result.success) {
                console.log('🎉 Login successful!');
                return { username: 'john.doe', password: pwd, token: result.token };
              }
              
              break;
            }
          } catch (e) {
            console.log(`❌ Password ${pwd} failed:`, e.message);
          }
        }
      } else {
        console.log('❌ No password found for tenant');
      }
    } else {
      console.log('❌ Tenant john.doe not found');
    }
    
    // Check owner as well
    console.log('\n3️⃣ Testing owner login...');
    const ownerResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'owner',
        password: 'owner123',
        role: 'owner'
      })
    });
    
    const ownerResult = await ownerResponse.json();
    console.log('Owner login response status:', ownerResponse.status);
    console.log('Owner login response:', ownerResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
};

testLogin().catch(console.error);