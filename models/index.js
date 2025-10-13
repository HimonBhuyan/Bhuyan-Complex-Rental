const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Owner Schema
const ownerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  profilePhoto: String,
  profileData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
ownerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Room Schema
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true
  },
  floor: Number,
  type: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', 'Studio', 'Single', 'Shared'],
    required: true
  },
  size: String, // e.g., "400 sqft"
  rent: {
    type: Number,
    required: true
  },
  securityDeposit: {
    type: Number,
    required: true
  },
  utilities: {
    electricity: {
      included: { type: Boolean, default: false },
      rate: { type: Number, default: 0 }
    },
    water: {
      included: { type: Boolean, default: true },
      rate: { type: Number, default: 0 }
    },
    gas: {
      included: { type: Boolean, default: false },
      rate: { type: Number, default: 0 }
    },
    internet: {
      included: { type: Boolean, default: false },
      rate: { type: Number, default: 0 }
    },
    parking: {
      included: { type: Boolean, default: false },
      rate: { type: Number, default: 0 }
    },
    maintenance: {
      included: { type: Boolean, default: true },
      rate: { type: Number, default: 0 }
    }
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    default: null
  },
  status: {
    type: String,
    enum: ['occupied', 'vacant', 'maintenance'],
    default: 'vacant'
  },
  amenities: [String],
  description: String,
  photos: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Tenant Schema
const tenantSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  address: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  documents: {
    idProof: {
      type: String, // File path
      verified: { type: Boolean, default: false }
    },
    agreement: {
      type: String, // File path
      signed: { type: Boolean, default: false }
    },
    photos: [String]
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  securityDepositPaid: {
    type: Number,
    default: 0
  },
  securityDepositRefundable: {
    type: Number,
    default: 0
  },
  moveInDate: Date,
  moveOutDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'moved_out'],
    default: 'pending'
  },
  profilePhoto: String,
  profileData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
tenantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Bill Schema
const billSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: {
    rent: {
      amount: { type: Number, required: true },
      description: { type: String, default: 'Monthly Rent' }
    },
    electricity: {
      meterStartReading: { type: Number, default: 0 },
      meterEndReading: { type: Number, default: 0 },
      unitsConsumed: { type: Number, default: 0 },
      chargesPerUnit: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    waterBill: {
      amount: { type: Number, default: 0 },
      description: { type: String, default: 'Water Bill' }
    },
    commonAreaCharges: {
      amount: { type: Number, default: 0 },
      description: { type: String, default: 'Common Area Maintenance' }
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }]
  },
  totalAmount: {
    type: Number,
    required: true
  },
  penalty: {
    amount: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    rate: { type: Number, default: 50 }, // ₹50 per day default
    appliedDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'payment_pending_verification', 'paid', 'overdue', 'cancelled', 'partially_paid'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  paidDate: Date,
  paymentMethod: String,
  transactionId: String,
  paymentScreenshot: {
    filename: String,
    originalName: String,
    uploadDate: Date,
    verified: { type: Boolean, default: false },
    verifiedBy: String,
    verifiedDate: Date
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate bill number
billSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNumber) {
    try {
      // Get the count directly from the collection to avoid circular reference
      const count = await this.constructor.countDocuments();
      this.billNumber = `BILL${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Fallback: use timestamp if count fails
      const timestamp = Date.now().toString().slice(-6);
      this.billNumber = `BILL${timestamp}`;
    }
  }
  next();
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi', 'card', 'bank_transfer', 'razorpay'],
    required: true
  },
  transactionId: String,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String,
  status: {
    type: String,
    enum: ['pending', 'pending_verification', 'completed', 'failed', 'refunded', 'rejected', 'verified'],
    default: 'pending'
  },
  paymentScreenshot: {
    filename: String,
    originalName: String,
    uploadDate: Date,
    verified: { type: Boolean, default: false },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner'
    },
    verifiedDate: Date,
    notes: String
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  notes: String,
  receipt: String, // File path for receipt
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['common', 'personal'],
    required: true
  },
  category: {
    type: String,
    enum: ['info', 'warning', 'urgent', 'success'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  recipients: [{
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  author: {
    type: String,
    default: 'Building Management'
  },
  expiryDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Models
const Owner = mongoose.model('Owner', ownerSchema);
const Room = mongoose.model('Room', roomSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);
const Bill = mongoose.model('Bill', billSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Owner,
  Room,
  Tenant,
  Bill,
  Payment,
  Notification
};