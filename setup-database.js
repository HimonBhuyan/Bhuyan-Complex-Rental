// Database setup script that will be executed in mongo shell
// This creates the initial database structure and sample data

print("🔧 Setting up MongoDB Database for Rental Management System");
print("==========================================================");

// Switch to the rental management database
db = db.getSiblingDB('rental_management_system');

print("📊 Database: rental_management_system");

// Create owner collection with default admin user
print("👤 Creating owners collection...");
var ownerExists = db.owners.findOne({username: "owner"});
if (!ownerExists) {
    db.owners.insertOne({
        username: "owner",
        email: "owner@building.com",
        password: "$2a$12$LQv3c1yqBw2uDL86jrjNO.u9/Z9z4Q7CjrTz1/Vw8BQN9eX5Y2C7G", // "owner123" hashed
        name: "Building Owner",
        phone: "+1234567890",
        address: "Building Address",
        createdAt: new Date()
    });
    print("✅ Created default owner (username: owner, password: owner123)");
} else {
    print("ℹ️  Default owner already exists");
}

// Create rooms collection with sample data
print("🏠 Creating rooms collection...");
var roomCount = db.rooms.count();
if (roomCount === 0) {
    db.rooms.insertMany([
        {
            roomNumber: "101",
            floor: 1,
            type: "1BHK",
            size: "400 sqft",
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
            status: "vacant",
            amenities: ["AC", "Furnished", "Balcony"],
            description: "Modern 1BHK apartment with all amenities",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            roomNumber: "102",
            floor: 1,
            type: "2BHK",
            size: "650 sqft",
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
            status: "vacant",
            amenities: ["AC", "Semi-Furnished", "Balcony", "Parking"],
            description: "Spacious 2BHK apartment with parking",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            roomNumber: "201",
            floor: 2,
            type: "1BHK",
            size: "400 sqft",
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
            status: "vacant",
            amenities: ["AC", "Furnished", "Balcony"],
            description: "Premium 1BHK on second floor",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
    print("✅ Created 3 sample rooms (101, 102, 201)");
} else {
    print("ℹ️  Rooms already exist");
}

// Create empty collections for other entities
print("📄 Creating other collections...");
db.createCollection("tenants");
db.createCollection("bills");  
db.createCollection("payments");
db.createCollection("notifications");

// Create indexes for better performance
print("🔍 Creating indexes...");
db.owners.createIndex({username: 1}, {unique: true});
db.owners.createIndex({email: 1}, {unique: true});
db.rooms.createIndex({roomNumber: 1}, {unique: true});
db.rooms.createIndex({status: 1});
db.tenants.createIndex({username: 1}, {unique: true});
db.tenants.createIndex({email: 1}, {unique: true});
db.bills.createIndex({tenant: 1});
db.bills.createIndex({status: 1});
db.payments.createIndex({tenant: 1});
db.payments.createIndex({bill: 1});

print("");
print("✅ Database setup completed successfully!");
print("");
print("📋 Summary:");
print("   Database: rental_management_system");
print("   Collections: owners, rooms, tenants, bills, payments, notifications");
print("   Default login: username=owner, password=owner123");
print("   Sample rooms: 3 rooms created");
print("");
print("🚀 Database is ready for the application!");

// Show collection stats
print("\n📊 Collection Statistics:");
print("   Owners: " + db.owners.count());
print("   Rooms: " + db.rooms.count());
print("   Tenants: " + db.tenants.count());
print("   Bills: " + db.bills.count());
print("   Payments: " + db.payments.count());
print("   Notifications: " + db.notifications.count());
