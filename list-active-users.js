// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const { Owner, Tenant, Room } = require('./models');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Function to list all active users
const listActiveUsers = async () => {
  try {
    console.log('\n🔍 Fetching active users from database...\n');
    
    // Get all owners
    const owners = await Owner.find({}).select('-password');
    console.log('👑 OWNERS/ADMINS:');
    console.log('================');
    
    if (owners.length === 0) {
      console.log('No owners found in database');
    } else {
      owners.forEach((owner, index) => {
        console.log(`${index + 1}. Username: ${owner.username}`);
        console.log(`   Name: ${owner.name}`);
        console.log(`   Email: ${owner.email}`);
        console.log(`   Phone: ${owner.phone || 'Not provided'}`);
        console.log(`   Created: ${owner.createdAt.toLocaleDateString()}`);
        console.log(`   Profile Photo: ${owner.profilePhoto ? 'Yes' : 'No'}`);
        console.log('   ---');
      });
    }
    
    // Get all tenants with room information
    const tenants = await Tenant.find({}).populate('room').select('-password');
    console.log('\n👤 TENANTS:');
    console.log('===========');
    
    if (tenants.length === 0) {
      console.log('No tenants found in database');
    } else {
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. Username: ${tenant.username}`);
        console.log(`   Name: ${tenant.name}`);
        console.log(`   Email: ${tenant.email}`);
        console.log(`   Phone: ${tenant.phone || 'Not provided'}`);
        console.log(`   Room: ${tenant.room ? tenant.room.roomNumber : 'Not assigned'}`);
        console.log(`   Rent: ₹${tenant.room ? tenant.room.rent : 'N/A'}`);
        console.log(`   Status: ${tenant.status || 'Active'}`);
        console.log(`   Created: ${tenant.createdAt.toLocaleDateString()}`);
        console.log(`   Profile Photo: ${tenant.profilePhoto ? 'Yes' : 'No'}`);
        console.log('   ---');
      });
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`Total Owners: ${owners.length}`);
    console.log(`Total Tenants: ${tenants.length}`);
    console.log(`Total Active Users: ${owners.length + tenants.length}`);
    
    // Get room occupancy info
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
    const vacantRooms = await Room.countDocuments({ status: 'vacant' });
    
    console.log(`\n🏠 ROOM OCCUPANCY:`);
    console.log(`Total Rooms: ${totalRooms}`);
    console.log(`Occupied: ${occupiedRooms}`);
    console.log(`Vacant: ${vacantRooms}`);
    console.log(`Occupancy Rate: ${totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0}%`);
    
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Rental Management System - User List');
  console.log('========================================');
  
  const connected = await connectDB();
  
  if (connected) {
    await listActiveUsers();
  } else {
    console.log('❌ Cannot list users - database connection failed');
    console.log('\n💡 Make sure:');
    console.log('1. MongoDB is running');
    console.log('2. .env file has correct MONGODB_URI');
    console.log('3. Network connection is available');
  }
  
  // Close connection
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
};

// Run the script
main().catch(error => {
  console.error('❌ Script execution error:', error);
  process.exit(1);
});
