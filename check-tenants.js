const { MongoClient } = require('mongodb');

async function checkTenants() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_management_system';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('rental_management_system');
    
    // Check owners first
    const owners = await db.collection('owners').find({}).limit(3).toArray();
    console.log('👨‍💼 Owners in database:');
    if (owners.length === 0) {
      console.log('  No owners found');
    } else {
      owners.forEach(owner => {
        console.log(`  Username: ${owner.username}`);
        console.log(`  Name: ${owner.name}`);
        console.log(`  Email: ${owner.email}`);
        console.log(`  ID: ${owner._id}`);
        console.log(`  ---`);
      });
    }
    
    // Check tenants
    const tenants = await db.collection('tenants').find({}).limit(3).toArray();
    console.log('\n👥 Tenants in database:');
    if (tenants.length === 0) {
      console.log('  No tenants found');
    } else {
      tenants.forEach(tenant => {
        console.log(`  Username: ${tenant.username}`);
        console.log(`  Name: ${tenant.name}`);
        console.log(`  ID: ${tenant._id}`);
        console.log(`  ---`);
      });
    }
    
    // Check rooms
    const rooms = await db.collection('rooms').find({}).limit(3).toArray();
    console.log('\n🏠 Rooms in database:');
    if (rooms.length === 0) {
      console.log('  No rooms found');
    } else {
      rooms.forEach(room => {
        console.log(`  Room: ${room.roomNumber}`);
        console.log(`  Status: ${room.status}`);
        console.log(`  Rent: $${room.rent}`);
        console.log(`  ID: ${room._id}`);
        console.log(`  ---`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkTenants();