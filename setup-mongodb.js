// MongoDB Setup and Database Initialization Script
// This script will create the database and initial collections

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017';
const DATABASE_NAME = 'rental_management_system';

async function setupDatabase() {
  console.log('🔧 Setting up MongoDB Database...');
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);

    // Create collections with initial documents to ensure they exist
    console.log('📄 Creating collections...');

    // Owners collection
    const ownersCollection = db.collection('owners');
    const existingOwner = await ownersCollection.findOne({ username: 'owner' });
    if (!existingOwner) {
      await ownersCollection.insertOne({
        username: 'owner',
        email: 'owner@building.com',
        password: '$2a$12$LQv3c1yqBw2uDL86jrjNO.u9/Z9z4Q7CjrTz1/Vw8BQN9eX5Y2C7G', // 'owner123' hashed
        name: 'Building Owner',
        phone: '+1234567890',
        address: 'Building Address',
        createdAt: new Date()
      });
      console.log('✅ Created default owner account (username: owner, password: owner123)');
    }

    // Rooms collection with sample data
    const roomsCollection = db.collection('rooms');
    const roomCount = await roomsCollection.countDocuments();
    if (roomCount === 0) {
      const sampleRooms = [
        {
          roomNumber: '101',
          floor: 1,
          type: '1BHK',
          size: '400 sqft',
          rent: 15000,
          securityDeposit: 30000,
          utilities: {
            electricity: { included: false, rate: 8 },
            water: { included: true, rate: 0 },
            gas: { included: false, rate: 500 },
            internet: { included: false, rate: 1000 },
            parking: { included: false, rate: 1500 },
            maintenance: { included: true, rate: 0 }
          },
          status: 'vacant',
          amenities: ['AC', 'Furnished', 'Balcony'],
          description: 'Modern 1BHK apartment with all amenities',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          roomNumber: '102',
          floor: 1,
          type: '2BHK',
          size: '650 sqft',
          rent: 25000,
          securityDeposit: 50000,
          utilities: {
            electricity: { included: false, rate: 8 },
            water: { included: true, rate: 0 },
            gas: { included: false, rate: 500 },
            internet: { included: false, rate: 1000 },
            parking: { included: true, rate: 0 },
            maintenance: { included: true, rate: 0 }
          },
          status: 'vacant',
          amenities: ['AC', 'Semi-Furnished', 'Balcony', 'Parking'],
          description: 'Spacious 2BHK apartment with parking',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          roomNumber: '201',
          floor: 2,
          type: '1BHK',
          size: '400 sqft',
          rent: 16000,
          securityDeposit: 32000,
          utilities: {
            electricity: { included: false, rate: 8 },
            water: { included: true, rate: 0 },
            gas: { included: false, rate: 500 },
            internet: { included: false, rate: 1000 },
            parking: { included: false, rate: 1500 },
            maintenance: { included: true, rate: 0 }
          },
          status: 'vacant',
          amenities: ['AC', 'Furnished', 'Balcony'],
          description: 'Premium 1BHK on second floor',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await roomsCollection.insertMany(sampleRooms);
      console.log('✅ Created sample rooms (101, 102, 201)');
    }

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    
    await ownersCollection.createIndex({ username: 1 }, { unique: true });
    await ownersCollection.createIndex({ email: 1 }, { unique: true });
    
    await roomsCollection.createIndex({ roomNumber: 1 }, { unique: true });
    await roomsCollection.createIndex({ status: 1 });
    
    // Create other collections
    await db.createCollection('tenants');
    await db.createCollection('bills');
    await db.createCollection('payments');
    await db.createCollection('notifications');

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('📋 Database Summary:');
    console.log(`   Database Name: ${DATABASE_NAME}`);
    console.log(`   Collections Created: owners, rooms, tenants, bills, payments, notifications`);
    console.log(`   Default Owner: username='owner', password='owner123'`);
    console.log(`   Sample Rooms: 3 rooms created (101, 102, 201)`);
    console.log('');
    console.log('🚀 You can now start the application server!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Check if MongoDB is running
async function checkMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    await client.close();
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔧 MongoDB Database Setup for Rental Management System');
  console.log('=====================================================');
  console.log('');

  // Check if MongoDB is running
  console.log('🔍 Checking MongoDB connection...');
  const mongoRunning = await checkMongoDB();
  
  if (!mongoRunning) {
    console.error('❌ MongoDB is not running or not accessible');
    console.error('   Please ensure MongoDB is installed and running on localhost:27017');
    console.error('   You can start MongoDB service using:');
    console.error('   - Windows: net start MongoDB');
    console.error('   - Or run: mongod --dbpath /path/to/data/directory');
    process.exit(1);
  }

  console.log('✅ MongoDB is running');
  console.log('');

  await setupDatabase();
}

// Run the setup
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupDatabase, checkMongoDB };