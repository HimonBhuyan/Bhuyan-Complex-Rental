


// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const connectDB = require('./config/database');
const { Owner, Room, Tenant, Bill, Payment, Notification } = require('./models');
const emailService = require('./backend/services/emailService');
const XLSX = require('xlsx');     

// Import route modules
const tenantRoutes = require('./backend/routes/tenant');
const paymentRoutes = require('./backend/routes/payments');
const { router: penaltyRoutes, setPenaltyServiceBroadcast } = require('./backend/routes/penalties');
const PenaltyService = require('./backend/services/penaltyService');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
// Connect to MongoDB
connectDB();

// Middleware - Configure CORS for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // List of allowed origins for production
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'http://localhost:5174', // Add port 5174 for Vite dev server
      'https://localhost:5173',
      'https://localhost:5174',
      'https://localhost:3000',
       'https://localhost',
        'capacitor://localhost', // ✅ Allow Capacitor (Android/iOS) app
      process.env.FRONTEND_URL, // For production deployment
      process.env.RENDER_EXTERNAL_URL, // For Render deployment
    ].filter(Boolean); // Remove undefined values
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`✅ Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Increase body size limits to allow base64 profile photos and documents
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Use route modules
app.use('/api/tenant', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/penalties', penaltyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Bhuyan Complex Rental Management System is running',
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients
const connectedClients = new Set();

// Initialize penalty service with broadcast function
const penaltyService = new PenaltyService(broadcastToClients);
setPenaltyServiceBroadcast(broadcastToClients);

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('🔗 New WebSocket client connected');
  connectedClients.add(ws);
  
  // Send initial notifications immediately when client connects
  setTimeout(async () => {
    try {
      const notifications = await Notification.find()
        .populate('recipients.tenant', 'name username')
        .sort({ createdAt: -1 })
        .limit(50);
      
      console.log(`📡 Sending ${notifications.length} initial notifications to new client`);
      
      ws.send(JSON.stringify({
        type: 'INITIAL_NOTIFICATIONS',
        notifications: notifications
      }));
    } catch (error) {
      console.error('❌ Error sending initial notifications:', error);
    }
  }, 100); // Small delay to ensure connection is ready
  
  // Handle incoming messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📱 WebSocket received message:', data.type);
      
      if (data.type === 'GET_NOTIFICATIONS') {
        const notifications = await Notification.find()
          .populate('recipients.tenant', 'name username')
          .sort({ createdAt: -1 })
          .limit(50);
        
        console.log(`📡 Sending ${notifications.length} notifications to requesting client`);
        
        ws.send(JSON.stringify({
          type: 'INITIAL_NOTIFICATIONS',
          notifications: notifications
        }));
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    connectedClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

// Broadcast to all WebSocket clients
function broadcastToClients(message) {
  const messageString = JSON.stringify(message);
  let activeClients = 0;
  
  connectedClients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(messageString);
        activeClients++;
      } catch (error) {
        console.error('❌ Error sending to client:', error);
        connectedClients.delete(client);
      }
    } else {
      connectedClients.delete(client);
    }
  });
  
  console.log(`📡 Broadcasted to ${activeClients} active clients`);
  return activeClients;
}

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============= AUTH ROUTES =============

// Login route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    let user;
    if (role === 'owner') {
      user = await Owner.findOne({ username });
    } else {
      user = await Tenant.findOne({ username }).populate('room');
    }

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username, 
        role: role,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: role,
        ...(role === 'tenant' && { 
          room: user.room,
          securityDepositPaid: user.securityDepositPaid 
        })
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot password - Step 1: Send verification code
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Find user by email and role
    let user;
    if (role === 'owner') {
      user = await Owner.findOne({ email });
    } else {
      user = await Tenant.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Send verification code
    const result = await emailService.sendVerificationCode(email, role);
    
    console.log(`🔐 Password reset requested for ${email} (${role})`);
    
    res.json({
      success: true,
      message: result.message,
      resetToken: result.resetToken,
      devMode: result.devMode,
      code: result.code // Only included in development mode
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    
    // Provide specific error message to user
    let userErrorMessage = 'Failed to send verification code';
    
    if (error.message.includes('authentication failed')) {
      userErrorMessage = 'Email service not configured properly. Please contact administrator.';
    } else if (error.message.includes('connect')) {
      userErrorMessage = 'Cannot connect to email server. Please try again later.';
    }
    
    res.status(500).json({ 
      error: userErrorMessage,
      details: error.message // For debugging
    });
  }
});

// Forgot password - Step 2: Verify code
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code, resetToken } = req.body;

    if (!email || !code || !resetToken) {
      return res.status(400).json({ error: 'Email, code, and reset token are required' });
    }

    const result = emailService.verifyCode(email, code, resetToken);
    
    if (result.success) {
      console.log(`✅ Reset code verified for ${email}`);
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Code verification error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Forgot password - Step 3: Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword, resetToken } = req.body;

    if (!email || !code || !newPassword || !resetToken) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if code is still verified and valid
    if (!emailService.isCodeVerified(email, resetToken)) {
      return res.status(400).json({ error: 'Verification code expired or invalid. Please start over.' });
    }

    // Find user by email (check both Owner and Tenant collections)
    let user = await Owner.findOne({ email });
    let userType = 'owner';
    
    if (!user) {
      user = await Tenant.findOne({ email });
      userType = 'tenant';
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password (the pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    console.log(`🔑 Password reset successfully for ${email} (${userType})`);

    // Send confirmation notification if it's a tenant
    if (userType === 'tenant') {
      try {
        const notification = new Notification({
          title: 'Password Reset Successful',
          message: 'Your password has been reset successfully. If you did not make this change, please contact building management immediately.',
          type: 'personal',
          category: 'info',
          priority: 'medium',
          recipients: [{
            tenant: user._id
          }]
        });
        await notification.save();
        
        // Broadcast notification
        broadcastToClients({
          type: 'NEW_NOTIFICATION',
          notification: await Notification.findById(notification._id)
            .populate('recipients.tenant', 'name username')
        });
      } catch (notifError) {
        console.error('❌ Failed to send password reset notification:', notifError);
        // Don't fail the password reset if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
      userType
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============= OWNER/ADMIN ROUTES =============

// Get all tenants
app.get('/api/admin/tenants', authenticateToken, async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('room', 'roomNumber type rent')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, tenants });
  } catch (error) {
    console.error('❌ Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Get specific tenant profile (including documents) for admin
app.get('/api/admin/tenants/:tenantId/profile', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await Tenant.findById(tenantId)
      .populate('room', 'roomNumber type rent securityDeposit')
      .select('name username email phone profilePhoto status securityDepositPaid moveInDate profileData');
    
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    
    console.log(`📂 [Admin] Fetching profile for tenant: ${tenant.name}`);
    
    res.json({
      success: true,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        username: tenant.username,
        email: tenant.email,
        phone: tenant.phone,
        profilePhoto: tenant.profilePhoto,
        status: tenant.status,
        securityDepositPaid: tenant.securityDepositPaid,
        moveInDate: tenant.moveInDate,
        room: tenant.room,
        profileData: tenant.profileData
      }
    });
  } catch (error) {
    console.error('❌ Error fetching tenant profile:', error);
    res.status(500).json({ error: 'Failed to fetch tenant profile' });
  }
});

// Update tenant (basic fields and optional room reassignment)
app.put('/api/admin/tenants/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, email, phone, roomId, moveInDate, securityDepositPaid } = req.body || {};

    const tenant = await Tenant.findById(tenantId).populate('room');
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });

    // Update basic fields
    if (name) tenant.name = name;
    if (email) tenant.email = email;
    if (phone) tenant.phone = phone;
    if (typeof securityDepositPaid !== 'undefined') tenant.securityDepositPaid = securityDepositPaid;
    if (moveInDate) tenant.moveInDate = new Date(moveInDate);

    // Handle room reassignment
    if (roomId && (!tenant.room || tenant.room._id.toString() !== roomId)) {
      // Vacate old room
      if (tenant.room) {
        await Room.findByIdAndUpdate(tenant.room._id, { currentTenant: null, status: 'vacant' });
      }
      // Assign new room (must be vacant)
      const newRoom = await Room.findById(roomId);
      if (!newRoom) return res.status(404).json({ success: false, error: 'New room not found' });
      if (newRoom.currentTenant) return res.status(400).json({ success: false, error: 'New room is occupied' });
      tenant.room = newRoom._id;
      await Room.findByIdAndUpdate(newRoom._id, { currentTenant: tenant._id, status: 'occupied' });
    }

    await tenant.save();
    const updated = await Tenant.findById(tenant._id).populate('room');

    // Broadcast tenant profile update
    broadcastToClients({
      type: 'TENANT_PROFILE_UPDATED',
      tenantId: updated._id,
      profileData: {
        userId: updated._id,
        id: updated._id,
        name: updated.name,
        fullName: updated.name,
        email: updated.email,
        phone: updated.phone,
        securityDepositPaid: updated.securityDepositPaid,
        moveInDate: updated.moveInDate,
        profilePhoto: updated.profilePhoto,
        room: updated.room,
        roomNumber: updated.room?.roomNumber,
        profileData: updated.profileData || {}
      }
    });

    res.json({ success: true, tenant: updated });
  } catch (error) {
    console.error('❌ Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Delete tenant (vacate room)
app.delete('/api/admin/tenants/:tenantId', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });

    const roomId = tenant.room;
    await Tenant.findByIdAndDelete(tenantId);

    if (roomId) {
      await Room.findByIdAndUpdate(roomId, { currentTenant: null, status: 'vacant' });
    }

    broadcastToClients({ type: 'TENANT_REMOVED', tenantId });
    broadcastToClients({ type: 'ROOMS_UPDATED' });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting tenant:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

// Get all rooms
app.get('/api/admin/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('currentTenant', 'name username phone email moveInDate securityDepositPaid')
      .sort({ roomNumber: 1 });
    
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Update room details
app.put('/api/admin/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body || {};

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Don't allow changing unique roomNumber to an existing one
    if (updates.roomNumber && updates.roomNumber !== room.roomNumber) {
      const clash = await Room.findOne({ roomNumber: updates.roomNumber });
      if (clash) {
        return res.status(400).json({ success: false, error: 'Room number already exists' });
      }
      room.roomNumber = updates.roomNumber;
    }

    // Apply mutable fields
    if (typeof updates.floor !== 'undefined') room.floor = updates.floor;
    if (updates.type) room.type = updates.type;
    if (typeof updates.rent !== 'undefined') room.rent = updates.rent;
    if (typeof updates.securityDeposit !== 'undefined') room.securityDeposit = updates.securityDeposit;
    if (typeof updates.size !== 'undefined') room.size = updates.size;
    if (typeof updates.description !== 'undefined') room.description = updates.description;
    if (Array.isArray(updates.amenities)) room.amenities = updates.amenities;
    if (Array.isArray(updates.photos)) room.photos = updates.photos;

    // Utilities
    if (updates.utilities) {
      room.utilities = {
        ...room.utilities,
        electricity: { ...room.utilities.electricity, ...(updates.utilities.electricity || {}) },
        water: { ...room.utilities.water, ...(updates.utilities.water || {}) },
        gas: { ...room.utilities.gas, ...(updates.utilities.gas || {}) },
        internet: { ...room.utilities.internet, ...(updates.utilities.internet || {}) },
        parking: { ...room.utilities.parking, ...(updates.utilities.parking || {}) },
        maintenance: { ...room.utilities.maintenance, ...(updates.utilities.maintenance || {}) }
      }
    }

    if (updates.status) room.status = updates.status;

    room.updatedAt = new Date();
    await room.save();

    // If room has a current tenant, broadcast their updated profile so their dashboard syncs
    if (room.currentTenant) {
      const tenant = await Tenant.findById(room.currentTenant).populate('room');
      if (tenant) {
        const activeClients = broadcastToClients({
          type: 'TENANT_PROFILE_UPDATED',
          tenantId: tenant._id,
          profileData: {
            userId: tenant._id,
            id: tenant._id,
            name: tenant.name,
            fullName: tenant.name,
            email: tenant.email,
            phone: tenant.phone,
            profilePhoto: tenant.profilePhoto,
            room: tenant.room,
            roomNumber: tenant.room?.roomNumber,
            profileData: tenant.profileData || {}
          }
        });
        console.log(`📡 [Server] Room update broadcast to ${activeClients} clients for tenant ${tenant.username}`);
      }
    }

    // Optional: broadcast room list update for owner dashboards
    broadcastToClients({ type: 'ROOMS_UPDATED' });

    res.json({ success: true, room });
  } catch (error) {
    console.error('❌ Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room (only if vacant)
app.delete('/api/admin/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId).populate('currentTenant');
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });

    if (room.currentTenant) {
      return res.status(400).json({ success: false, error: 'Cannot delete an occupied room. Please vacate the room first.' });
    }

    await Room.findByIdAndDelete(roomId);

    // Broadcast to clients that rooms changed
    broadcastToClients({ type: 'ROOMS_UPDATED' });

    res.json({ success: true, deleted: roomId });
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Add new room
app.post('/api/admin/rooms', authenticateToken, async (req, res) => {
  try {
    const { roomNumber } = req.body;

    // Enforce unique roomNumber
    const existing = await Room.findOne({ roomNumber });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Room number already exists' });
    }

    // Apply safe defaults for utilities if not provided
    const payload = {
      ...req.body,
      utilities: {
        electricity: { included: false, rate: 0, ...(req.body.utilities?.electricity || {}) },
        water: { included: true, rate: 0, ...(req.body.utilities?.water || {}) },
        gas: { included: false, rate: 0, ...(req.body.utilities?.gas || {}) },
        internet: { included: false, rate: 0, ...(req.body.utilities?.internet || {}) },
        parking: { included: false, rate: 0, ...(req.body.utilities?.parking || {}) },
        maintenance: { included: true, rate: 0, ...(req.body.utilities?.maintenance || {}) }
      },
      status: req.body.status || 'vacant'
    };

    const room = new Room(payload);
    await room.save();

    // Optional: broadcast rooms update for admin dashboards (owners)
    broadcastToClients({ type: 'ROOMS_UPDATED' });
    
    res.json({ success: true, room });
  } catch (error) {
    console.error('❌ Error adding room:', error);
    res.status(500).json({ error: 'Failed to add room' });
  }
});

// Add tenant to room
app.post('/api/admin/rooms/:roomId/assign-tenant', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { 
      name, 
      email, 
      phone, 
      emergencyContact, 
      moveInDate, 
      securityDepositPaid 
    } = req.body;

    // Generate username and password
    const username = `tenant_${Date.now()}`;
    const password = Math.random().toString(36).slice(-8);

    // Create tenant
    const tenant = new Tenant({
      username,
      password,
      name,
      email,
      phone,
      emergencyContact,
      room: roomId,
      moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
      securityDepositPaid: securityDepositPaid || 0,
      status: 'active'
    });

    await tenant.save();

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(roomId, {
      currentTenant: tenant._id,
      status: 'occupied'
    }, { new: true });

    // Send credentials notification
    const notification = new Notification({
      title: 'Welcome to Bhuyan Complex',
      message: `Welcome ${name}! Your login credentials: Username: ${username}, Password: ${password}. Please change your password after first login.`,
      type: 'personal',
      category: 'info',
      priority: 'high',
      recipients: [{
        tenant: tenant._id
      }]
    });

    await notification.save();

    // Broadcast notification
    broadcastToClients({
      type: 'NEW_NOTIFICATION',
      notification
    });

    // Broadcast tenant profile update so client dashboards sync instantly
    const populatedTenant = await Tenant.findById(tenant._id).populate('room');
    const activeClients = broadcastToClients({
      type: 'TENANT_PROFILE_UPDATED',
      tenantId: populatedTenant._id,
      profileData: {
        userId: populatedTenant._id,
        id: populatedTenant._id,
        name: populatedTenant.name,
        fullName: populatedTenant.name,
        email: populatedTenant.email,
        phone: populatedTenant.phone,
        profilePhoto: populatedTenant.profilePhoto,
        room: populatedTenant.room,
        roomNumber: populatedTenant.room?.roomNumber,
        profileData: populatedTenant.profileData || {}
      }
    });

    console.log(`📡 [Server] Tenant assignment broadcast to ${activeClients} WebSocket clients`);

    res.json({ 
      success: true, 
      tenant: {
        ...tenant.toObject(),
        generatedUsername: username,
        generatedPassword: password
      },
      room: updatedRoom
    });
  } catch (error) {
    console.error('❌ Error assigning tenant:', error);
    res.status(500).json({ error: 'Failed to assign tenant' });
  }
});

// Get enhanced payment summary for monitoring dashboard
app.get('/api/admin/payments/summary', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentDate = new Date();

    // Total payments received this month
    const totalPayments = await Payment.aggregate([
      {
        $lookup: {
          from: 'bills',
          localField: 'bill',
          foreignField: '_id',
          as: 'billDetails'
        }
      },
      {
        $unwind: '$billDetails'
      },
      {
        $match: {
          'billDetails.month': currentMonth,
          'billDetails.year': currentYear,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Pending dues
    const pendingBills = await Bill.find({
      month: currentMonth,
      year: currentYear,
      status: { $in: ['pending', 'overdue'] }
    }).populate('tenant', 'name username').populate('room', 'roomNumber');

    // Overdue payments (past due date)
    const overdueBills = await Bill.find({
      month: currentMonth,
      year: currentYear,
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: currentDate }
    }).populate('tenant', 'name username').populate('room', 'roomNumber');

    const totalPending = pendingBills.reduce((sum, bill) => {
      // bill.totalAmount already includes penalty, so use it directly
      return sum + bill.totalAmount;
    }, 0);

    const totalOverdue = overdueBills.reduce((sum, bill) => {
      // bill.totalAmount already includes penalty, so use it directly
      return sum + bill.totalAmount;
    }, 0);

    res.json({
      success: true,
      summary: {
        totalReceived: totalPayments[0]?.total || 0,
        paymentsCount: totalPayments[0]?.count || 0,
        totalPending: Math.round(totalPending),
        pendingBills: pendingBills.length,
        totalOverdue: Math.round(totalOverdue),
        overdueBills: overdueBills.length,
        pendingBillsDetails: pendingBills,
        overdueBillsDetails: overdueBills
      }
    });
  } catch (error) {
    console.error('❌ Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

// Test endpoint without authentication
app.get('/api/admin/payments/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Payment API test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Get recent payment transactions for monitoring dashboard
app.get('/api/admin/payments/recent', authenticateToken, async (req, res) => {
  try {
    const { month, year, limit = 20 } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get recent payments for the selected month
    const recentPayments = await Payment.find({
      status: 'completed'
    })
    .populate({
      path: 'bill',
      match: {
        month: currentMonth,
        year: currentYear
      },
      populate: {
        path: 'room',
        select: 'roomNumber'
      }
    })
    .populate('tenant', 'name username')
    .sort({ paidAt: -1 })
    .limit(parseInt(limit));

    // Filter out payments where bill is null (not matching the month/year)
    const filteredPayments = recentPayments.filter(payment => payment.bill);

    res.json({
      success: true,
      transactions: filteredPayments.map(payment => ({
        id: payment._id,
        tenantName: payment.tenant.name,
        tenantUsername: payment.tenant.username,
        roomNumber: payment.bill.room.roomNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
        billNumber: payment.bill.billNumber,
        month: payment.bill.month,
        year: payment.bill.year
      }))
    });
  } catch (error) {
    console.error('❌ Error fetching recent transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});

// Export detailed payment report to Excel
app.get('/api/admin/payments/export', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    console.log(`📊 Generating Excel report for ${monthNames[currentMonth - 1]} ${currentYear}`);
    
    // Get all bills for the selected month
    const bills = await Bill.find({
      month: currentMonth,
      year: currentYear
    })
    .populate('tenant', 'name phone email username')
    .populate('room', 'roomNumber type')
    .sort({ 'tenant.name': 1 });
    
    console.log(`📄 Found ${bills.length} bills for ${monthNames[currentMonth - 1]} ${currentYear}`);
    
    // If no bills found, create sample data for demo
    if (bills.length === 0) {
      console.log('📝 No bills found, generating sample Excel data');
      const sampleData = [
        {
          'Tenant Name': 'No Data Available',
          'Room Number': 'N/A',
          'Room Type': 'N/A',
          'Phone': 'N/A',
          'Email': 'N/A',
          'Bill Number': 'N/A',
          'Month': monthNames[currentMonth - 1],
          'Year': currentYear,
          'Due Date': 'N/A',
          'Rent Amount': 0,
          'Electricity': 0,
          'Water': 0,
          'Gas': 0,
          'Internet': 0,
          'Parking': 0,
          'Maintenance': 0,
          'Bill Total': 0,
          'Late Fees': 0,
          'Total Amount (with Late Fees)': 0,
          'Paid Amount': 0,
          'Remaining Amount': 0,
          'Payment Status': 'No Data',
          'Payment Method': 'N/A',
          'Payment Date': 'N/A',
          'Days Overdue': 0
        }
      ];
      
      // Create workbook and worksheet with sample data
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, `${monthNames[currentMonth - 1]} ${currentYear}`);
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for file download
      res.setHeader('Content-Disposition', 
        `attachment; filename="Payment_Report_${monthNames[currentMonth - 1]}_${currentYear}.xlsx"`);
      res.setHeader('Content-Type', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      console.log('✅ Sample Excel report generated successfully');
      return res.send(buffer);
    }
    
    // Get all payments for these bills
    const billIds = bills.map(bill => bill._id);
    const payments = await Payment.find({
      bill: { $in: billIds },
      status: 'completed'
    }).populate('bill');
    
    console.log(`💳 Found ${payments.length} payments for these bills`);


    // Create payment lookup
    const paymentLookup = {};
    payments.forEach(payment => {
      if (!paymentLookup[payment.bill._id]) {
        paymentLookup[payment.bill._id] = [];
      }
      paymentLookup[payment.bill._id].push(payment);
    });

    // Prepare Excel data
    const excelData = [];
    
    bills.forEach((bill, index) => {
      try {
        const billPayments = paymentLookup[bill._id] || [];
        const totalPaid = billPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Use actual penalty amount from database
        let lateFees = bill.penalty.amount || 0;

        // Extract utility details with safe navigation
        const rentAmount = bill.items?.rent?.amount || 0;
        const electricityAmount = bill.items?.utilities?.electricity?.amount || 0;
        const waterAmount = bill.items?.utilities?.water?.amount || 0;
        const gasAmount = bill.items?.utilities?.gas?.amount || 0;
        const internetAmount = bill.items?.utilities?.internet?.amount || 0;
        const parkingAmount = bill.items?.utilities?.parking?.amount || 0;
        const maintenanceAmount = bill.items?.utilities?.maintenance?.amount || 0;
        
        // Calculate base total from items (without penalty)
        const baseTotal = rentAmount + electricityAmount + waterAmount + gasAmount + 
                          internetAmount + parkingAmount + maintenanceAmount;

        const latestPayment = billPayments.length > 0 ? billPayments[billPayments.length - 1] : null;

        excelData.push({
          'Tenant Name': bill.tenant?.name || 'N/A',
          'Room Number': bill.room?.roomNumber || 'N/A',
          'Room Type': bill.room?.type || 'N/A',
          'Phone': bill.tenant?.phone || 'N/A',
          'Email': bill.tenant?.email || 'N/A',
          'Bill Number': bill.billNumber || 'N/A',
          'Month': monthNames[bill.month - 1] || 'N/A',
          'Year': bill.year || currentYear,
          'Due Date': bill.dueDate ? bill.dueDate.toLocaleDateString() : 'N/A',
          'Rent Amount': rentAmount,
          'Electricity': electricityAmount,
          'Water': waterAmount,
          'Gas': gasAmount,
          'Internet': internetAmount,
          'Parking': parkingAmount,
          'Maintenance': maintenanceAmount,
          'Bill Total': baseTotal,
          'Late Fees': Math.round(lateFees),
          'Total Amount (with Late Fees)': bill.totalAmount || 0,
          'Paid Amount': totalPaid,
          'Remaining Amount': Math.max(0, (bill.totalAmount || 0) - totalPaid),
          'Payment Status': bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'Unknown',
          'Payment Method': latestPayment?.paymentMethod || 'N/A',
          'Payment Date': latestPayment?.paidAt ? latestPayment.paidAt.toLocaleDateString() : 'N/A',
          'Days Overdue': bill.dueDate && bill.dueDate < currentDate && bill.status !== 'paid' ? 
            Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24)) : 0
        });
      } catch (billError) {
        console.error(`❌ Error processing bill ${index}:`, billError);
        // Add a placeholder row for failed bills
        excelData.push({
          'Tenant Name': 'Error Processing Bill',
          'Room Number': 'N/A',
          'Room Type': 'N/A',
          'Phone': 'N/A',
          'Email': 'N/A',
          'Bill Number': 'ERROR',
          'Month': monthNames[currentMonth - 1],
          'Year': currentYear,
          'Due Date': 'N/A',
          'Rent Amount': 0,
          'Electricity': 0,
          'Water': 0,
          'Gas': 0,
          'Internet': 0,
          'Parking': 0,
          'Maintenance': 0,
          'Bill Total': 0,
          'Late Fees': 0,
          'Total Amount (with Late Fees)': 0,
          'Paid Amount': 0,
          'Remaining Amount': 0,
          'Payment Status': 'Error',
          'Payment Method': 'N/A',
          'Payment Date': 'N/A',
          'Days Overdue': 0
        });
      }
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Add attractive styling to the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style header row (row 0)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          fill: { fgColor: { rgb: '2E8B57' } }, // Sea Green header
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
    
    // Style data rows with alternating colors
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          const isEvenRow = (row - 1) % 2 === 0;
          const isAmountColumn = col >= 9 && col <= 19; // Amount columns
          const isStatusColumn = col === 21; // Payment Status column
          
          let fillColor = isEvenRow ? 'F8F8FF' : 'FFFFFF'; // Light gray and white alternating
          let fontColor = '000000';
          
          // Special coloring for status column
          if (isStatusColumn) {
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'Paid') {
              fillColor = 'E6FFE6'; // Light green for paid
              fontColor = '006400'; // Dark green text
            } else if (cellValue === 'Overdue') {
              fillColor = 'FFE6E6'; // Light red for overdue
              fontColor = '8B0000'; // Dark red text
            } else if (cellValue === 'Pending') {
              fillColor = 'FFF8DC'; // Light yellow for pending
              fontColor = 'DAA520'; // Golden text
            }
          }
          
          // Special formatting for amount columns
          if (isAmountColumn && typeof worksheet[cellRef].v === 'number') {
            worksheet[cellRef].z = '₹#,##0'; // Indian Rupee format
          }
          
          worksheet[cellRef].s = {
            fill: { fgColor: { rgb: fillColor } },
            font: { 
              color: { rgb: fontColor }, 
              sz: 10,
              bold: isAmountColumn || isStatusColumn
            },
            alignment: { 
              horizontal: isAmountColumn ? 'right' : 'left', 
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: 'thin', color: { rgb: 'CCCCCC' } },
              bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } }
            }
          };
        }
      }
    }

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Tenant Name
      { wch: 12 }, // Room Number
      { wch: 12 }, // Room Type
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 15 }, // Bill Number
      { wch: 12 }, // Month
      { wch: 8 },  // Year
      { wch: 12 }, // Due Date
      { wch: 12 }, // Rent Amount
      { wch: 10 }, // Electricity
      { wch: 10 }, // Water
      { wch: 10 }, // Gas
      { wch: 10 }, // Internet
      { wch: 10 }, // Parking
      { wch: 12 }, // Maintenance
      { wch: 12 }, // Bill Total
      { wch: 12 }, // Late Fees
      { wch: 18 }, // Total Amount
      { wch: 12 }, // Paid Amount
      { wch: 15 }, // Remaining Amount
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Payment Date
      { wch: 12 }  // Days Overdue
    ];
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${monthNames[currentMonth - 1]} ${currentYear}`);

    console.log(`📋 Processed ${excelData.length} rows of data for Excel export`);
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    console.log(`📦 Excel buffer generated, size: ${buffer.length} bytes`);

    // Set headers for file download
    res.setHeader('Content-Disposition', 
      `attachment; filename="Payment_Report_${monthNames[currentMonth - 1]}_${currentYear}.xlsx"`);
    res.setHeader('Content-Type', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    console.log(`✅ Excel report generated successfully for ${monthNames[currentMonth - 1]} ${currentYear}`);
    res.send(buffer);
  } catch (error) {
    console.error('❌ Error generating Excel report:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Export individual tenant payment report
app.get('/api/admin/tenants/:tenantId/payment-report', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    console.log(`📊 Generating individual payment report for tenant: ${tenantId}`);
    
    // Get tenant information
    const tenant = await Tenant.findById(tenantId)
      .populate('room', 'roomNumber type')
      .select('name phone email username');
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Get all bills for this tenant
    const bills = await Bill.find({
      tenant: tenantId
    })
    .populate('room', 'roomNumber type')
    .sort({ year: -1, month: -1 }); // Most recent first
    
    console.log(`📄 Found ${bills.length} bills for tenant ${tenant.name}`);
    
    // Get all payments for these bills
    const billIds = bills.map(bill => bill._id);
    const payments = await Payment.find({
      bill: { $in: billIds },
      status: 'completed'
    }).populate('bill');
    
    console.log(`💳 Found ${payments.length} payments for tenant ${tenant.name}`);
    
    // Create payment lookup
    const paymentLookup = {};
    payments.forEach(payment => {
      if (!paymentLookup[payment.bill._id]) {
        paymentLookup[payment.bill._id] = [];
      }
      paymentLookup[payment.bill._id].push(payment);
    });
    
    // Prepare Excel data with tenant-specific formatting
    const excelData = [];
    
    // Add tenant header information
    excelData.push({
      'Detail': 'Tenant Name',
      'Value': tenant.name,
      'Month': '',
      'Year': '',
      'Amount': '',
      'Status': '',
      'Date': '',
      'Method': ''
    });
    
    excelData.push({
      'Detail': 'Room Number',
      'Value': tenant.room?.roomNumber || 'N/A',
      'Month': '',
      'Year': '',
      'Amount': '',
      'Status': '',
      'Date': '',
      'Method': ''
    });
    
    excelData.push({
      'Detail': 'Phone',
      'Value': tenant.phone || 'N/A',
      'Month': '',
      'Year': '',
      'Amount': '',
      'Status': '',
      'Date': '',
      'Method': ''
    });
    
    excelData.push({
      'Detail': 'Email',
      'Value': tenant.email || 'N/A',
      'Month': '',
      'Year': '',
      'Amount': '',
      'Status': '',
      'Date': '',
      'Method': ''
    });
    
    // Add empty row
    excelData.push({
      'Detail': '',
      'Value': '',
      'Month': '',
      'Year': '',
      'Amount': '',
      'Status': '',
      'Date': '',
      'Method': ''
    });
    
    // Add headers for payment data
    excelData.push({
      'Detail': 'Bill Number',
      'Value': 'Description',
      'Month': 'Month',
      'Year': 'Year',
      'Amount': 'Amount',
      'Status': 'Status',
      'Date': 'Payment Date',
      'Method': 'Payment Method'
    });
    
    bills.forEach((bill, index) => {
      try {
        const billPayments = paymentLookup[bill._id] || [];
        const totalPaid = billPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Use actual penalty amount from database
        let lateFees = bill.penalty.amount || 0;
        
        const latestPayment = billPayments.length > 0 ? billPayments[billPayments.length - 1] : null;
        
        excelData.push({
          'Detail': bill.billNumber || `BILL-${bill.year}-${String(bill.month).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
          'Value': `Monthly rent and utilities for ${monthNames[bill.month - 1]} ${bill.year}`,
          'Month': monthNames[bill.month - 1],
          'Year': bill.year,
          'Amount': bill.totalAmount || 0,
          'Status': bill.status ? bill.status.charAt(0).toUpperCase() + bill.status.slice(1) : 'Unknown',
          'Date': latestPayment?.paidAt ? latestPayment.paidAt.toLocaleDateString() : 'Not Paid',
          'Method': latestPayment?.paymentMethod || 'N/A'
        });
      } catch (billError) {
        console.error(`❌ Error processing bill for tenant ${tenant.name}:`, billError);
      }
    });
    
    // If no bills found, add sample data for demo
    if (bills.length === 0) {
      console.log('📝 No bills found, generating sample data for tenant');
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      excelData.push({
        'Detail': 'DEMO-2024-001',
        'Value': `Monthly rent and utilities for ${monthNames[currentMonth]} ${currentYear}`,
        'Month': monthNames[currentMonth],
        'Year': currentYear,
        'Amount': 12000,
        'Status': 'Paid',
        'Date': new Date().toLocaleDateString(),
        'Method': 'Demo Data'
      });
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Add attractive styling
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Style tenant info section (first 4 rows)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            fill: { fgColor: { rgb: col === 0 ? '4A90E2' : 'E6F3FF' } },
            font: { 
              bold: col === 0,
              color: { rgb: col === 0 ? 'FFFFFF' : '333333' },
              sz: 11
            },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      }
    }
    
    // Style header row (row 5)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = XLSX.utils.encode_cell({ r: 5, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          fill: { fgColor: { rgb: '2E8B57' } },
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    }
    
    // Style data rows (from row 6 onwards)
    for (let row = 6; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellRef]) {
          const isEvenRow = (row - 6) % 2 === 0;
          const isAmountColumn = col === 4; // Amount column
          const isStatusColumn = col === 5; // Status column
          
          let fillColor = isEvenRow ? 'F8F8FF' : 'FFFFFF';
          let fontColor = '000000';
          
          // Special coloring for status column
          if (isStatusColumn) {
            const cellValue = worksheet[cellRef].v;
            if (cellValue === 'Paid') {
              fillColor = 'E6FFE6';
              fontColor = '006400';
            } else if (cellValue === 'Overdue') {
              fillColor = 'FFE6E6';
              fontColor = '8B0000';
            } else if (cellValue === 'Pending') {
              fillColor = 'FFF8DC';
              fontColor = 'DAA520';
            }
          }
          
          // Format amount column
          if (isAmountColumn && typeof worksheet[cellRef].v === 'number') {
            worksheet[cellRef].z = '₹#,##0';
          }
          
          worksheet[cellRef].s = {
            fill: { fgColor: { rgb: fillColor } },
            font: { 
              color: { rgb: fontColor }, 
              sz: 10,
              bold: isAmountColumn || isStatusColumn
            },
            alignment: { 
              horizontal: isAmountColumn ? 'right' : 'left', 
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: 'thin', color: { rgb: 'CCCCCC' } },
              bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } }
            }
          };
        }
      }
    }
    
    // Set column widths
    const colWidths = [
      { wch: 18 }, // Detail/Bill Number
      { wch: 35 }, // Value/Description
      { wch: 12 }, // Month
      { wch: 8 },  // Year
      { wch: 12 }, // Amount
      { wch: 12 }, // Status
      { wch: 15 }, // Date
      { wch: 15 }  // Method
    ];
    worksheet['!cols'] = colWidths;
    
    // Add worksheet to workbook
    const sheetName = `${tenant.name.substring(0, 25)} Payment Report`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    const filename = `Payment_Report_${tenant.name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    console.log(`✅ Individual payment report generated for ${tenant.name}`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Error generating individual tenant report:', error);
    res.status(500).json({ error: 'Failed to generate tenant payment report' });
  }
});

// Generate bills for all tenants
app.post('/api/admin/bills/generate', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.body;
    const dueDate = new Date(year, month, 10); // 10th of next month

    // Get all active tenants with rooms
    const tenants = await Tenant.find({ 
      status: 'active', 
      room: { $ne: null } 
    }).populate('room');

    const bills = [];

    for (const tenant of tenants) {
      // Check if bill already exists
      const existingBill = await Bill.findOne({
        tenant: tenant._id,
        month: parseInt(month),
        year: parseInt(year)
      });

      if (!existingBill) {
        const room = tenant.room;
        
        // Calculate total amount
        let totalAmount = room.rent;
        
        // Add utilities that are not included
        Object.keys(room.utilities).forEach(utility => {
          if (!room.utilities[utility].included) {
            totalAmount += room.utilities[utility].rate;
          }
        });

        const bill = new Bill({
          tenant: tenant._id,
          room: room._id,
          month: parseInt(month),
          year: parseInt(year),
          dueDate,
          items: {
            rent: {
              amount: room.rent,
              description: `Monthly rent for room ${room.roomNumber}`
            },
            utilities: {
              electricity: { 
                amount: !room.utilities.electricity.included ? room.utilities.electricity.rate : 0 
              },
              water: { 
                amount: !room.utilities.water.included ? room.utilities.water.rate : 0 
              },
              gas: { 
                amount: !room.utilities.gas.included ? room.utilities.gas.rate : 0 
              },
              internet: { 
                amount: !room.utilities.internet.included ? room.utilities.internet.rate : 0 
              },
              parking: { 
                amount: !room.utilities.parking.included ? room.utilities.parking.rate : 0 
              },
              maintenance: { 
                amount: !room.utilities.maintenance.included ? room.utilities.maintenance.rate : 0 
              }
            }
          },
          totalAmount
        });

        await bill.save();
        bills.push(bill);

        // Send bill notification
        const notification = new Notification({
          title: 'New Bill Generated',
          message: `Your bill for ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has been generated. Amount: ₹${totalAmount}. Due date: ${dueDate.toLocaleDateString()}.`,
          type: 'personal',
          category: 'info',
          priority: 'medium',
          recipients: [{
            tenant: tenant._id
          }]
        });

        await notification.save();
      }
    }

    // Broadcast notification about new bills
    if (bills.length > 0) {
      broadcastToClients({
        type: 'BILLS_GENERATED',
        count: bills.length
      });
    }

    res.json({
      success: true,
      message: `Generated ${bills.length} bills`,
      bills: bills.length
    });
  } catch (error) {
    console.error('❌ Error generating bills:', error);
    res.status(500).json({ error: 'Failed to generate bills' });
  }
});

// Get all tenants for bill generation (Admin)
app.get('/api/admin/tenants-for-billing', authenticateToken, async (req, res) => {
  try {
    const tenants = await Tenant.find({ status: 'active', room: { $ne: null } })
      .populate('room', 'roomNumber type rent securityDeposit utilities')
      .select('name phone email room username')
      .sort({ name: 1 });
    
    res.json({ success: true, tenants });
  } catch (error) {
    console.error('❌ Error fetching tenants for billing:', error);
    res.status(500).json({ error: 'Failed to fetch tenants for billing' });
  }
});

// Generate individual bill for specific tenant (Admin)
app.post('/api/admin/bills/generate-individual', authenticateToken, async (req, res) => {
  try {
    const {
      tenantId,
      month,
      year,
      rent,
      electricity: {
        meterStartReading = 0,
        meterEndReading = 0,
        chargesPerUnit = 0
      } = {},
      waterBill = 0,
      commonAreaCharges = 0
    } = req.body;


    // Check if bill already exists
    const existingBill = await Bill.findOne({
      tenant: tenantId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (existingBill) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bill already exists for this tenant and month' 
      });
    }

    // Get tenant and room details
    const tenant = await Tenant.findById(tenantId).populate('room');
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    // Calculate electricity bill
    const unitsConsumed = Math.max(0, meterEndReading - meterStartReading);
    const electricityAmount = unitsConsumed * chargesPerUnit;

    // Calculate total amount
    const totalAmount = rent + electricityAmount + waterBill + commonAreaCharges;

    // Set due date to 10th of the month
    const dueDate = new Date(year, month - 1, 10);
    if (dueDate < new Date()) {
      // If due date is in the past, set it to 10th of next month
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    // Generate bill number manually as backup
    const billCount = await Bill.countDocuments();
    const billNumber = `BILL${String(billCount + 1).padStart(6, '0')}`;

    const bill = new Bill({
      tenant: tenantId,
      room: tenant.room._id,
      billNumber,
      month: parseInt(month),
      year: parseInt(year),
      dueDate,
      items: {
        rent: {
          amount: rent,
          description: `Monthly rent for room ${tenant.room.roomNumber}`
        },
        electricity: {
          meterStartReading,
          meterEndReading,
          unitsConsumed,
          chargesPerUnit,
          amount: electricityAmount
        },
        waterBill: {
          amount: waterBill,
          description: 'Water Bill'
        },
        commonAreaCharges: {
          amount: commonAreaCharges,
          description: 'Common Area Maintenance'
        }
      },
      totalAmount,
      remainingAmount: totalAmount
    });

    await bill.save();

    // Send bill notification
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const notification = new Notification({
      title: 'New Bill Generated',
      message: `Your bill for ${monthNames[month - 1]} ${year} has been generated. Amount: ₹${totalAmount}. Due date: ${dueDate.toLocaleDateString()}.`,
      type: 'personal',
      category: 'info',
      priority: 'medium',
      recipients: [{
        tenant: tenantId
      }]
    });

    await notification.save();

    // Broadcast notification
    broadcastToClients({
      type: 'NEW_NOTIFICATION',
      notification: await Notification.findById(notification._id)
        .populate('recipients.tenant', 'name username')
    });

    // Broadcast bill update
    broadcastToClients({
      type: 'BILL_GENERATED',
      tenantId,
      bill: await Bill.findById(bill._id).populate('tenant', 'name username').populate('room', 'roomNumber')
    });

    res.json({
      success: true,
      message: 'Bill generated successfully',
      bill: await Bill.findById(bill._id)
        .populate('tenant', 'name username phone')
        .populate('room', 'roomNumber')
    });
  } catch (error) {
    console.error('❌ Error generating individual bill:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to generate bill',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all bills (Admin) - for payment management
app.get('/api/admin/bills', authenticateToken, async (req, res) => {
  try {
    const { month, year, status } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('tenant', 'name phone email username')
      .populate('room', 'roomNumber')
      .sort({ generatedAt: -1, 'tenant.name': 1 });

    // Get payment details for each bill
    const billsWithPayments = await Promise.all(bills.map(async (bill) => {
      const payments = await Payment.find({ bill: bill._id })
        .sort({ paidAt: -1 });
      
      return {
        ...bill.toObject(),
        payments
      };
    }));

    res.json({ success: true, bills: billsWithPayments });
  } catch (error) {
    console.error('❌ Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Delete bill (Admin)
app.delete('/api/admin/bills/:billId', authenticateToken, async (req, res) => {
  try {
    const { billId } = req.params;
    
    // First, check if the bill exists
    const bill = await Bill.findById(billId).populate('tenant', 'name username').populate('room', 'roomNumber');
    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    // Check if the bill has any payments associated with it
    const payments = await Payment.find({ bill: billId });
    if (payments.length > 0) {
      // If there are payments, we need to delete them first or prevent deletion
      // For safety, let's prevent deletion of bills with payments
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete bill with associated payments. Please remove payments first.' 
      });
    }

    // Store bill info for logging and broadcasting
    const billInfo = {
      billNumber: bill.billNumber,
      tenantName: bill.tenant?.name,
      tenantId: bill.tenant?._id,
      month: bill.month,
      year: bill.year,
      amount: bill.totalAmount,
      roomNumber: bill.room?.roomNumber
    };

    // Delete the bill
    await Bill.findByIdAndDelete(billId);

    // Log the deletion
    console.log(`🗑️ Bill deleted: ${billInfo.billNumber} for ${billInfo.tenantName} (${billInfo.roomNumber}) - ₹${billInfo.amount}`);

    // Broadcast bill deletion to all clients
    broadcastToClients({
      type: 'BILL_DELETED',
      billId,
      billInfo
    });

    // Send notification to tenant about bill deletion
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
                      
    const notification = new Notification({
      title: 'Bill Deleted',
      message: `Your bill for ${monthNames[billInfo.month - 1]} ${billInfo.year} (₹${billInfo.amount}) has been deleted by the admin.`,
      type: 'personal',
      category: 'info',
      priority: 'medium',
      recipients: [{
        tenant: billInfo.tenantId
      }]
    });

    await notification.save();

    // Broadcast notification
    broadcastToClients({
      type: 'NEW_NOTIFICATION',
      notification: await Notification.findById(notification._id)
        .populate('recipients.tenant', 'name username')
    });

    res.json({
      success: true,
      message: 'Bill deleted successfully',
      deletedBill: billInfo
    });
  } catch (error) {
    console.error('❌ Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Verify payment screenshot (Admin)
app.put('/api/admin/payments/:paymentId/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verified, notes } = req.body;
    const ownerId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('bill');
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Update payment verification
    payment.paymentScreenshot.verified = verified;
    payment.paymentScreenshot.verifiedBy = ownerId;
    payment.paymentScreenshot.verifiedDate = new Date();
    payment.paymentScreenshot.notes = notes || '';
    payment.status = verified ? 'verified' : 'failed';

    await payment.save();

    // Update bill status if payment is verified
    if (verified) {
      const bill = await Bill.findById(payment.bill._id);
      bill.status = 'paid';
      bill.paidAmount = bill.totalAmount;
      bill.remainingAmount = 0;
      bill.paidDate = new Date();
      await bill.save();

      // Broadcast bill update and payment dashboard update
      broadcastToClients({
        type: 'BILL_PAYMENT_VERIFIED',
        billId: bill._id,
        paymentId: payment._id
      });
      
      // Broadcast payment dashboard update
      broadcastToClients({
        type: 'PAYMENT_DASHBOARD_UPDATE',
        month: bill.month,
        year: bill.year,
        paymentAmount: payment.amount,
        tenantName: payment.tenant?.name || 'Unknown'
      });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ============= TENANT ROUTES =============

// Get tenant dashboard data
app.get('/api/tenant/dashboard', authenticateToken, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.id).populate('room');
    
    // Get current and recent bills with late fee calculation
    let bills = await Bill.find({ tenant: req.user.id })
      .populate('room', 'roomNumber')
      .sort({ generatedAt: -1 })
      .limit(10);

    // ALWAYS recalculate penalties for overdue bills to ensure they're current
    const currentDate = new Date();
    console.log(`🔄 [Dashboard] Recalculating penalties for ${bills.length} bills at ${currentDate.toISOString()}`);
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      if (bill.status !== 'paid' && currentDate > bill.dueDate) {
        const daysOverdue = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
        
        // Always recalculate for overdue bills to ensure accuracy
        if (daysOverdue > 0) {
          const correctPenalty = daysOverdue * 50; // ₹50 per day
          const currentPenalty = bill.penalty?.amount || 0;
          
          console.log(`🔄 [Dashboard] Recalculating penalty for bill ${bill.billNumber}`);
          console.log(`   Current: ₹${currentPenalty} (${bill.penalty?.days || 0} days), Expected: ₹${correctPenalty} (${daysOverdue} days)`);
          
          const result = await penaltyService.applyPenaltyToBill(bill, currentDate);
          
          // Force reload bill to get updated values from database
          const updatedBill = await Bill.findById(bill._id).populate('room', 'roomNumber');
          
          // Verify the update was saved - if not, use direct MongoDB update
          if (Math.abs((updatedBill.penalty?.amount || 0) - correctPenalty) > 1) {
            console.error(`❌ [Dashboard] Penalty NOT updated for bill ${bill.billNumber}! DB has ₹${updatedBill.penalty?.amount}, expected ₹${correctPenalty}`);
            
            // Calculate base amount
            let baseAmount = 0;
            if (updatedBill.items) {
              baseAmount += updatedBill.items.rent?.amount || 0;
              baseAmount += updatedBill.items.electricity?.amount || 0;
              baseAmount += updatedBill.items.waterBill?.amount || 0;
              baseAmount += updatedBill.items.commonAreaCharges?.amount || 0;
              if (updatedBill.items.additionalCharges && Array.isArray(updatedBill.items.additionalCharges)) {
                baseAmount += updatedBill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
              }
            }
            if (baseAmount <= 0) {
              baseAmount = updatedBill.totalAmount - (updatedBill.penalty?.amount || 0);
            }
            
            // Use direct MongoDB update to bypass any Mongoose issues
            await Bill.updateOne(
              { _id: bill._id },
              {
                $set: {
                  'penalty.amount': correctPenalty,
                  'penalty.days': daysOverdue,
                  'penalty.rate': 50,
                  'penalty.appliedDate': currentDate,
                  totalAmount: baseAmount + correctPenalty,
                  remainingAmount: Math.max(0, (baseAmount + correctPenalty) - (updatedBill.paidAmount || 0)),
                  status: updatedBill.status === 'paid' ? 'paid' : 'overdue'
                }
              }
            );
            
            console.log(`🔧 [Dashboard] Direct MongoDB update: ${bill.billNumber} → penalty=₹${correctPenalty}`);
          }
          
          // Replace bill in array with updated version - ensure we use the fresh document
          bills[i] = await Bill.findById(bill._id).populate('room', 'roomNumber');
          
          console.log(`✅ [Dashboard] Updated bill ${bill.billNumber} - Penalty: ₹${bills[i].penalty?.amount} (${bills[i].penalty?.days} days), Total: ₹${bills[i].totalAmount}`);
        }
      }
    }

    // CRITICAL: Reload ALL bills from database to ensure we have latest data
    // Use lean() to get plain objects and avoid Mongoose caching issues
    const billIds = bills.map(b => b._id);
    console.log(`🔄 [Dashboard] Reloading ${billIds.length} bills from database to ensure fresh data...`);
    
    // FORCE a direct query with no cache - ensure we get latest data
    const freshBills = await Bill.find({ _id: { $in: billIds } })
      .populate('room', 'roomNumber')
      .lean({ defaults: true }) // Get plain JavaScript objects, not Mongoose documents
      .sort({ generatedAt: -1 });

    // Debug: Check what we got from database - verify against expected
    console.log(`✅ [Dashboard] Loaded ${freshBills.length} fresh bills from database`);
    
    // Fix any bills with wrong penalties - AWAIT all updates
    const billsToFix = [];
    for (const bill of freshBills) {
      if (bill.status !== 'paid' && currentDate > new Date(bill.dueDate)) {
        const daysOverdue = Math.floor((currentDate - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          const expectedPenalty = daysOverdue * 50;
          const currentPenalty = bill.penalty?.amount || 0;
          
          if (['BILL000006', 'BILL000005', 'BILL000004'].includes(bill.billNumber)) {
            console.log(`   📊 [Fresh Load] ${bill.billNumber}:`);
            console.log(`      penalty.amount=₹${currentPenalty}, penalty.days=${bill.penalty?.days}`);
            console.log(`      expected=₹${expectedPenalty} (${daysOverdue} days), total=₹${bill.totalAmount}`);
          }
          
          if (Math.abs(currentPenalty - expectedPenalty) > 1) {
            console.error(`   ❌ ERROR: ${bill.billNumber} has WRONG penalty in database!`);
            console.error(`      Fixing now with direct update...`);
            
            // Calculate base amount
            let baseAmount = 0;
            if (bill.items) {
              baseAmount += bill.items.rent?.amount || 0;
              baseAmount += bill.items.electricity?.amount || 0;
              baseAmount += bill.items.waterBill?.amount || 0;
              baseAmount += bill.items.commonAreaCharges?.amount || 0;
              if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
                baseAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
              }
            }
            if (baseAmount <= 0) {
              baseAmount = bill.totalAmount - currentPenalty;
            }
            
            // AWAIT the update - critical!
            await Bill.updateOne(
              { _id: bill._id },
              {
                $set: {
                  'penalty.amount': expectedPenalty,
                  'penalty.days': daysOverdue,
                  'penalty.rate': 50,
                  'penalty.appliedDate': currentDate,
                  totalAmount: baseAmount + expectedPenalty,
                  remainingAmount: Math.max(0, (baseAmount + expectedPenalty) - (bill.paidAmount || 0)),
                  status: bill.status === 'paid' ? 'paid' : 'overdue'
                }
              }
            );
            
            console.log(`   ✅ Fixed ${bill.billNumber} in database: penalty=₹${expectedPenalty}`);
            billsToFix.push(bill._id);
          } else if (['BILL000006', 'BILL000005', 'BILL000004'].includes(bill.billNumber)) {
            console.log(`   ✅ Penalty is CORRECT in database`);
          }
        }
      }
    }
    
    // If we fixed any bills, reload them to get updated values
    if (billsToFix.length > 0) {
      console.log(`🔄 [Dashboard] Reloading ${billsToFix.length} fixed bills from database...`);
      const fixedBills = await Bill.find({ _id: { $in: billsToFix } })
        .populate('room', 'roomNumber')
        .lean({ defaults: true });
      
      // Replace the fixed bills in freshBills array
      const fixedBillsMap = new Map(fixedBills.map(b => [b._id.toString(), b]));
      freshBills.forEach((bill, index) => {
        if (fixedBillsMap.has(bill._id.toString())) {
          freshBills[index] = fixedBillsMap.get(bill._id.toString());
        }
      });
    }

    // Use stored penalty amounts - bill.totalAmount already includes penalty if applied
    // freshBills are plain objects from lean(), so use them directly
    const billsWithLateFees = freshBills.map(bill => {
      // bill is already a plain object from lean(), so just use it
      const billObj = JSON.parse(JSON.stringify(bill)); // Deep clone to ensure clean object
      
      // CRITICAL: Calculate penalty on-the-fly based on due date as PRIMARY source of truth
      // This ensures correctness even if database value is somehow stale
      let penaltyAmount = 0;
      let daysLate = 0;
      
      // Check if bill is overdue (not paid AND current date is past due date)
      const billDueDate = new Date(bill.dueDate);
      const isPaid = bill.status && bill.status.toLowerCase() === 'paid';
      const isOverdue = !isPaid && currentDate > billDueDate;
      
      if (isOverdue) {
        daysLate = Math.floor((currentDate - billDueDate) / (1000 * 60 * 60 * 24));
        if (daysLate > 0) {
          penaltyAmount = daysLate * 50; // ₹50 per day - PRIMARY calculation
        }
      }
      
      // Use database value as fallback ONLY if on-the-fly calculation is 0 (not overdue)
      if (penaltyAmount === 0) {
        penaltyAmount = bill.penalty?.amount ?? 0;
        daysLate = bill.penalty?.days ?? 0;
      }
      
      // Calculate base amount (without penalty) - extract from totalAmount
      // If totalAmount already includes penalty, subtract it
      let baseAmount = 0;
      if (bill.items) {
        // Calculate from items first (most accurate)
        baseAmount += bill.items.rent?.amount || 0;
        baseAmount += bill.items.electricity?.amount || 0;
        baseAmount += bill.items.waterBill?.amount || 0;
        baseAmount += bill.items.commonAreaCharges?.amount || 0;
        if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
          baseAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
        }
      }
      
      // If baseAmount is still 0, calculate from totalAmount
      if (baseAmount <= 0) {
        const dbTotal = bill.totalAmount ?? 0;
        const dbPenalty = bill.penalty?.amount ?? 0;
        baseAmount = dbTotal - dbPenalty;
        // If that's still 0 or negative, use totalAmount directly
        if (baseAmount <= 0) {
          baseAmount = dbTotal;
        }
      }
      
      // Calculate total with penalty
      const totalWithLateFee = baseAmount + penaltyAmount;
      
      // OVERWRITE billObj fields with CORRECT values (calculated on-the-fly)
      billObj.lateFee = penaltyAmount;
      billObj.daysLate = daysLate;
      billObj.baseAmount = baseAmount;
      billObj.totalWithLateFee = totalWithLateFee;
      billObj.totalAmount = totalWithLateFee; // Ensure totalAmount includes penalty
      billObj.remainingAmount = Math.max(0, totalWithLateFee - (bill.paidAmount ?? billObj.paidAmount ?? 0));
      
      // COMPLETELY REPLACE penalty object with correct values (calculated on-the-fly)
      billObj.penalty = {
        amount: penaltyAmount,
        days: daysLate,
        rate: 50,
        appliedDate: bill.penalty?.appliedDate || currentDate
      };
      
      // Debug logging to verify values - ALWAYS log for all bills to catch issues
      if (bill.billNumber) {
        console.log(`   📋 [Mapping] ${bill.billNumber}:`);
        console.log(`      isOverdue=${isOverdue}, daysLate=${daysLate}, penaltyAmount=₹${penaltyAmount}`);
        console.log(`      DB penalty=₹${bill.penalty?.amount}, calculated=₹${penaltyAmount} (${daysLate} days)`);
        console.log(`      baseAmount=₹${baseAmount}, totalWithLateFee=₹${totalWithLateFee}`);
        console.log(`      billObj.lateFee=₹${billObj.lateFee}, billObj.totalWithLateFee=₹${billObj.totalWithLateFee}, billObj.penalty.amount=₹${billObj.penalty.amount}`);
      }
      
      // Update status if overdue but status hasn't been updated yet
      if (billObj.status === 'pending' && new Date() > new Date(billObj.dueDate) && penaltyAmount === 0) {
        billObj.status = 'overdue';
      } else if (penaltyAmount > 0 && billObj.status !== 'paid') {
        billObj.status = 'overdue';
      }
      
      return billObj;
    });

    // Get payment history
    const payments = await Payment.find({ tenant: req.user.id })
      .populate('bill')
      .sort({ paidAt: -1 })
      .limit(10);

    // Get current month statistics
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const currentMonthBill = await Bill.findOne({
      tenant: req.user.id,
      month: currentMonth,
      year: currentYear
    });

    // Final verification - billsWithLateFees already has all correct values calculated on-the-fly
    // Just ensure all fields are explicitly set for the response
    const finalBills = billsWithLateFees.map((bill) => {
      // CRITICAL: billsWithLateFees already calculated everything correctly on-the-fly
      // Use those values directly - they are the source of truth
      const lateFee = bill.lateFee ?? 0;
      const daysLate = bill.daysLate ?? 0;
      const totalWithLateFee = bill.totalWithLateFee ?? bill.totalAmount ?? 0;
      const baseAmount = bill.baseAmount ?? 0;
      const penaltyAmount = bill.penalty?.amount ?? lateFee ?? 0;
      
      // Create final bill object - spread bill to preserve all fields, then explicitly override critical ones
      const finalBill = {
        ...bill, // Spread all existing fields (including lateFee, daysLate, totalWithLateFee, etc.)
        // CRITICAL FIELDS - explicitly ensure these are set (override anything that might be wrong)
        lateFee: lateFee,
        daysLate: daysLate,
        totalWithLateFee: totalWithLateFee,
        baseAmount: baseAmount,
        totalAmount: totalWithLateFee, // Ensure totalAmount includes penalty
        remainingAmount: bill.remainingAmount ?? Math.max(0, totalWithLateFee - (bill.paidAmount || 0)),
        // CRITICAL: Penalty object - must match lateFee exactly
        penalty: {
          amount: lateFee, // Use lateFee (calculated on-the-fly) as the source of truth
          days: daysLate,
          rate: 50,
          appliedDate: bill.penalty?.appliedDate || currentDate
        }
      };
      
      // Debug for specific bills - verify the mapping preserved values
      if (bill.billNumber && ['BILL000006', 'BILL000005', 'BILL000004'].includes(bill.billNumber)) {
        console.log(`   🔍 [Final Mapping] ${bill.billNumber}:`);
        console.log(`      Input from billsWithLateFees: lateFee=₹${bill.lateFee}, daysLate=${bill.daysLate}, totalWithLateFee=₹${bill.totalWithLateFee}`);
        console.log(`      Output finalBill: lateFee=₹${finalBill.lateFee}, daysLate=${finalBill.daysLate}, totalWithLateFee=₹${finalBill.totalWithLateFee}, penalty.amount=₹${finalBill.penalty.amount}`);
      }
      
      return finalBill;
    });

    // Final debug: Verify what we're sending - check actual JSON structure
    console.log(`📤 [Dashboard] Sending ${finalBills.length} bills in response`);
    finalBills.slice(0, 5).forEach(bill => {
      console.log(`   📦 ${bill.billNumber}:`);
      console.log(`      lateFee=₹${bill.lateFee}, daysLate=${bill.daysLate}`);
      console.log(`      totalWithLateFee=₹${bill.totalWithLateFee}, totalAmount=₹${bill.totalAmount}`);
      console.log(`      penalty.amount=₹${bill.penalty?.amount}, penalty.days=${bill.penalty?.days}`);
      console.log(`      baseAmount=₹${bill.baseAmount}`);
    });

    // CRITICAL: Verify the response structure before sending
    const responseData = {
      success: true,
      tenant,
      bills: finalBills,
      payments,
      currentMonthBill
    };
    
    // Final verification: Check that all bills have lateFee and totalWithLateFee
    const billsWithMissingFields = finalBills.filter(bill => 
      bill.lateFee === undefined || 
      bill.totalWithLateFee === undefined || 
      bill.daysLate === undefined
    );
    
    if (billsWithMissingFields.length > 0) {
      console.error(`❌ [Dashboard] ERROR: ${billsWithMissingFields.length} bills missing critical fields!`);
      billsWithMissingFields.forEach(bill => {
        console.error(`   ❌ ${bill.billNumber}: lateFee=${bill.lateFee}, totalWithLateFee=${bill.totalWithLateFee}, daysLate=${bill.daysLate}`);
      });
    } else {
      console.log(`✅ [Dashboard] All ${finalBills.length} bills have required fields (lateFee, totalWithLateFee, daysLate)`);
    }

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching tenant dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get tenant bills (Pay Bills section)
app.get('/api/tenant/bills', authenticateToken, async (req, res) => {
  try {
    const { status, year, month } = req.query;
    
    let query = { tenant: req.user.id };
    if (status) query.status = status;
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const bills = await Bill.find(query)
      .populate('room', 'roomNumber')
      .sort({ generatedAt: -1 });

    // ALWAYS recalculate penalties for overdue bills to ensure they're current
    const currentDate = new Date();
    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      if (bill.status !== 'paid' && currentDate > bill.dueDate) {
        const daysOverdue = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
        
        // Always recalculate for overdue bills to ensure accuracy
        if (daysOverdue > 0) {
          const correctPenalty = daysOverdue * 50; // ₹50 per day
          const currentPenalty = bill.penalty?.amount || 0;
          
          console.log(`🔄 [Bills] Recalculating penalty for bill ${bill.billNumber}`);
          console.log(`   Current: ₹${currentPenalty} (${bill.penalty?.days || 0} days), Expected: ₹${correctPenalty} (${daysOverdue} days)`);
          
          await penaltyService.applyPenaltyToBill(bill, currentDate);
          
          // Reload bill to get updated values from database
          const updatedBill = await Bill.findById(bill._id).populate('room', 'roomNumber');
          // Replace bill in array with updated version
          bills[i] = updatedBill;
          
          console.log(`✅ [Bills] Updated bill ${bill.billNumber} - Penalty: ₹${updatedBill.penalty?.amount} (${updatedBill.penalty?.days} days), Total: ₹${updatedBill.totalAmount}`);
        }
      }
    }

    // Calculate penalties on-the-fly based on due date as PRIMARY source of truth
    const billsWithDetails = bills.map(bill => {
      const billObj = bill.toObject();
      
      // CRITICAL: Calculate penalty on-the-fly based on due date as PRIMARY source of truth
      let penaltyAmount = 0;
      let daysLate = 0;
      
      if (bill.status !== 'paid' && currentDate > bill.dueDate) {
        daysLate = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
        if (daysLate > 0) {
          penaltyAmount = daysLate * 50; // ₹50 per day - PRIMARY calculation
        }
      }
      
      // Use database value as fallback ONLY if on-the-fly calculation is 0 (not overdue)
      if (penaltyAmount === 0) {
        penaltyAmount = bill.penalty?.amount ?? 0;
        daysLate = bill.penalty?.days ?? 0;
      }
      
      // Calculate base amount (without penalty) - extract from totalAmount
      let baseAmount = 0;
      if (bill.items) {
        // Calculate from items first (most accurate)
        baseAmount += bill.items.rent?.amount || 0;
        baseAmount += bill.items.electricity?.amount || 0;
        baseAmount += bill.items.waterBill?.amount || 0;
        baseAmount += bill.items.commonAreaCharges?.amount || 0;
        if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
          baseAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
        }
      }
      
      // If baseAmount is still 0, calculate from totalAmount
      if (baseAmount <= 0) {
        const dbTotal = bill.totalAmount ?? 0;
        const dbPenalty = bill.penalty?.amount ?? 0;
        baseAmount = dbTotal - dbPenalty;
        // If that's still 0 or negative, use totalAmount directly
        if (baseAmount <= 0) {
          baseAmount = dbTotal;
        }
      }
      
      // Calculate total with penalty
      const totalWithLateFee = baseAmount + penaltyAmount;
      
      // OVERWRITE billObj fields with CORRECT values (calculated on-the-fly)
      billObj.lateFee = penaltyAmount;
      billObj.daysLate = daysLate;
      billObj.baseAmount = baseAmount;
      billObj.totalWithLateFee = totalWithLateFee;
      billObj.totalAmount = totalWithLateFee; // Ensure totalAmount includes penalty
      billObj.remainingAmount = Math.max(0, totalWithLateFee - (bill.paidAmount || 0));
      
      // COMPLETELY REPLACE penalty object with correct values
      billObj.penalty = {
        amount: penaltyAmount,
        days: daysLate,
        rate: 50,
        appliedDate: bill.penalty?.appliedDate || currentDate
      };
      
      // Update status if overdue
      if (penaltyAmount > 0 && bill.status !== 'paid') {
        billObj.status = 'overdue';
      }
      
      return billObj;
    });

    res.json({ success: true, bills: billsWithDetails });
  } catch (error) {
    console.error('❌ Error fetching tenant bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get previous bills for tenant
app.get('/api/tenant/previous-bills', authenticateToken, async (req, res) => {
  try {
    const bills = await Bill.find({ tenant: req.user.id })
      .populate('room', 'roomNumber')
      .sort({ year: -1, month: -1 });

    const billsWithDetails = bills.map(bill => {
      const billObj = bill.toObject();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      billObj.monthName = monthNames[bill.month - 1];
      
      // Use stored penalty amounts - bill.totalAmount already includes penalty
      const penaltyAmount = bill.penalty?.amount || 0;
      const daysLate = bill.penalty?.days || 0;
      
      // Calculate base amount (without penalty) for UI display
      const baseAmount = bill.totalAmount - penaltyAmount;
      
      billObj.lateFee = penaltyAmount;
      billObj.daysLate = daysLate;
      billObj.baseAmount = baseAmount; // Base amount without penalty
      // bill.totalAmount already includes penalty, so totalWithLateFee = totalAmount
      billObj.totalWithLateFee = bill.totalAmount;
      billObj.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
      
      return billObj;
    });

    res.json({ success: true, bills: billsWithDetails });
  } catch (error) {
    console.error('❌ Error fetching previous bills:', error);
    res.status(500).json({ error: 'Failed to fetch previous bills' });
  }
});

// Get individual bill details
app.get('/api/tenant/bills/:billId', authenticateToken, async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await Bill.findOne({ 
      _id: billId, 
      tenant: req.user.id 
    }).populate('room', 'roomNumber type');

    if (!bill) {
      return res.status(404).json({ success: false, error: 'Bill not found' });
    }

    // Auto-recalculate penalty if bill is overdue and penalty is incorrect
    const currentDate = new Date();
    if (bill.status !== 'paid' && currentDate > bill.dueDate) {
      const daysOverdue = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const correctPenalty = daysOverdue * 50; // ₹50 per day
      const currentPenalty = bill.penalty?.amount || 0;
      
      // If penalty doesn't match (allowing 1 rupee tolerance), recalculate
      if (Math.abs(currentPenalty - correctPenalty) > 1) {
        console.log(`🔄 [BillDetail] Auto-recalculating penalty for bill ${bill.billNumber}`);
        console.log(`   Current: ₹${currentPenalty} (${bill.penalty?.days || 0} days), Expected: ₹${correctPenalty} (${daysOverdue} days)`);
        
        await penaltyService.applyPenaltyToBill(bill, currentDate);
        
        // Reload bill to get updated values from database
        const updatedBill = await Bill.findById(bill._id).populate('room', 'roomNumber type');
        // Update bill object
        bill.penalty = updatedBill.penalty;
        bill.totalAmount = updatedBill.totalAmount;
        bill.remainingAmount = updatedBill.remainingAmount;
        bill.status = updatedBill.status;
        
        console.log(`✅ [BillDetail] Updated bill ${bill.billNumber} - Penalty: ₹${bill.penalty?.amount}, Total: ₹${bill.totalAmount}`);
      }
    }

    // Get payments for this bill
    const payments = await Payment.find({ bill: billId })
      .sort({ paidAt: -1 });

    // CRITICAL: Calculate penalty on-the-fly based on due date as PRIMARY source of truth
    let penaltyAmount = 0;
    let daysLate = 0;
    
    if (bill.status !== 'paid' && currentDate > bill.dueDate) {
      daysLate = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      if (daysLate > 0) {
        penaltyAmount = daysLate * 50; // ₹50 per day - PRIMARY calculation
      }
    }
    
    // Use database value as fallback ONLY if on-the-fly calculation is 0 (not overdue)
    if (penaltyAmount === 0) {
      penaltyAmount = bill.penalty?.amount ?? 0;
      daysLate = bill.penalty?.days ?? 0;
    }
    
    // Calculate base amount (without penalty) - extract from totalAmount
    let baseAmount = 0;
    if (bill.items) {
      // Calculate from items first (most accurate)
      baseAmount += bill.items.rent?.amount || 0;
      baseAmount += bill.items.electricity?.amount || 0;
      baseAmount += bill.items.waterBill?.amount || 0;
      baseAmount += bill.items.commonAreaCharges?.amount || 0;
      if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
        baseAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
      }
    }
    
    // If baseAmount is still 0, calculate from totalAmount
    if (baseAmount <= 0) {
      const dbTotal = bill.totalAmount ?? 0;
      const dbPenalty = bill.penalty?.amount ?? 0;
      baseAmount = dbTotal - dbPenalty;
      // If that's still 0 or negative, use totalAmount directly
      if (baseAmount <= 0) {
        baseAmount = dbTotal;
      }
    }
    
    // Calculate total with penalty
    const totalWithLateFee = baseAmount + penaltyAmount;

    const billWithDetails = {
      ...bill.toObject(),
      lateFee: penaltyAmount,
      daysLate: daysLate,
      baseAmount: baseAmount,
      totalWithLateFee: totalWithLateFee,
      totalAmount: totalWithLateFee, // Ensure totalAmount includes penalty
      remainingAmount: Math.max(0, totalWithLateFee - (bill.paidAmount || 0)),
      penalty: {
        amount: penaltyAmount,
        days: daysLate,
        rate: 50,
        appliedDate: bill.penalty?.appliedDate || currentDate
      },
      payments
    };

    res.json({ success: true, bill: billWithDetails });
  } catch (error) {
    console.error('❌ Error fetching bill details:', error);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
});

// ============= NOTIFICATION ROUTES =============

// Get notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('recipients.tenant', 'name username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Add notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { title, message, type, category, priority, tenantIds } = req.body;

    const notification = new Notification({
      title,
      message,
      type,
      category: category || 'info',
      priority: priority || 'medium'
    });

    // Add recipients based on type
    if (type === 'common') {
      // Send to all active tenants
      const tenants = await Tenant.find();
      notification.recipients = tenants.map(tenant => ({
        tenant: tenant._id
      }));
    } else if (type === 'personal' && tenantIds) {
      // Send to specific tenants
      notification.recipients = tenantIds.map(tenantId => ({
        tenant: tenantId
      }));
    }

    await notification.save();

    // Get all notifications for broadcasting
    const allNotifications = await Notification.find()
      .populate('recipients.tenant', 'name username')
      .sort({ createdAt: -1 })
      .limit(50);

    // Broadcast to WebSocket clients with all notifications
    const activeClients = broadcastToClients({
      type: 'NEW_NOTIFICATION',
      notification: await Notification.findById(notification._id)
        .populate('recipients.tenant', 'name username'),
      allNotifications
    });

    console.log(`📡 New notification broadcast to ${activeClients} WebSocket clients`);

    res.json({
      success: true,
      notification: await Notification.findById(notification._id)
        .populate('recipients.tenant', 'name username'),
      broadcastedTo: activeClients
    });
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log(`🗑️ [Server] Deleting notification ${notificationId}`);
    
    // Find the notification before deleting for broadcasting
    const deletedNotification = await Notification.findById(notificationId)
      .populate('recipients.tenant', 'name username');
    
    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    console.log(`🗑️ [Server] Found notification to delete: "${deletedNotification.title}"`);
    
    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);
    console.log(`✅ [Server] Notification deleted from database`);
    
    // Get updated notifications list
    const allNotifications = await Notification.find()
      .populate('recipients.tenant', 'name username')
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`📊 [Server] Remaining notifications: ${allNotifications.length}`);
    
    // Broadcast deletion to all WebSocket clients
    const activeClients = broadcastToClients({
      type: 'NOTIFICATION_DELETED',
      deletedId: notificationId,
      deletedNotification: deletedNotification,
      allNotifications
    });
    
    console.log(`📡 [Server] Deletion broadcast to ${activeClients} WebSocket clients`);
    
    res.json({ 
      success: true, 
      deletedId: notificationId,
      deletedNotification: deletedNotification,
      remainingCount: allNotifications.length,
      broadcastedTo: activeClients
    });
  } catch (error) {
    console.error('❌ [Server] Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { read } = req.body;
    
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Update read status for all recipients (simplified approach)
    notification.recipients.forEach(recipient => {
      if (read) {
        recipient.read = true;
        recipient.readAt = new Date();
      } else {
        recipient.read = false;
        recipient.readAt = null;
      }
    });
    
    await notification.save();
    
    res.json({ 
      success: true, 
      notification: await Notification.findById(notificationId)
        .populate('recipients.tenant', 'name username')
    });
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// ============= PROFILE UPDATE ROUTES =============

// Get owner profile
app.get('/api/owner/profile', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    console.log(`📂 [Server] Loading owner profile for ID: ${ownerId}`);
    
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    
    console.log(`✅ [Server] Owner profile loaded successfully`);
    
    res.json({ 
      success: true, 
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        profilePhoto: owner.profilePhoto,
        address: owner.address,
        profileData: owner.profileData
      }
    });
  } catch (error) {
    console.error('❌ [Server] Error loading owner profile:', error);
    res.status(500).json({ error: 'Failed to load owner profile' });
  }
});

// Update owner profile
app.put('/api/owner/profile', authenticateToken, async (req, res) => {
  try {
    const ownerId = req.user.id;
    const profileData = req.body;
    
    console.log(`🔄 [Server] Updating owner profile for ID: ${ownerId}`);
    console.log('📝 [Server] Profile data received:', Object.keys(profileData));
    
    // Find and update owner
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    
    // Update basic info
    if (profileData.basicInfo) {
      owner.name = profileData.basicInfo.fullName || owner.name;
      owner.email = profileData.basicInfo.email || owner.email;
      owner.phone = profileData.basicInfo.primaryPhone || owner.phone;
      owner.profilePhoto = profileData.basicInfo.profilePhoto || owner.profilePhoto;
      owner.address = profileData.basicInfo.residentialAddress || owner.address;
      
      // Store additional profile data as nested object
      owner.profileData = {
        ...owner.profileData,
        basicInfo: profileData.basicInfo,
        buildingDetails: profileData.buildingDetails,
        billingSettings: profileData.billingSettings,
        documents: profileData.documents
      };
    }
    
    await owner.save();
    
    console.log(`✅ [Server] Owner profile updated successfully`);
    
    // Broadcast profile update to all WebSocket clients
    const activeClients = broadcastToClients({
      type: 'OWNER_PROFILE_UPDATED',
      ownerId: ownerId,
      profileData: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        profilePhoto: owner.profilePhoto,
        profileData: owner.profileData
      }
    });
    
    console.log(`📡 [Server] Profile update broadcast to ${activeClients} WebSocket clients`);
    
    res.json({ 
      success: true, 
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        profilePhoto: owner.profilePhoto,
        profileData: owner.profileData
      },
      broadcastedTo: activeClients
    });
  } catch (error) {
    console.error('❌ [Server] Error updating owner profile:', error);
    res.status(500).json({ error: 'Failed to update owner profile' });
  }
});

// Get tenant profile
app.get('/api/tenant/profile', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.id;
    
    console.log(`📂 [Server] Loading tenant profile for ID: ${tenantId}`);
    
    const tenant = await Tenant.findById(tenantId).populate('room');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    console.log(`✅ [Server] Tenant profile loaded successfully`);
    
    res.json({ 
      success: true, 
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        profilePhoto: tenant.profilePhoto,
        room: tenant.room,
        securityDepositPaid: tenant.securityDepositPaid,
        profileData: tenant.profileData
      }
    });
  } catch (error) {
    console.error('❌ [Server] Error loading tenant profile:', error);
    res.status(500).json({ error: 'Failed to load tenant profile' });
  }
});

// Update tenant profile
app.put('/api/tenant/profile', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const profileData = req.body;
    
    console.log(`🔄 [Server] Updating tenant profile for ID: ${tenantId}`);
    console.log('📝 [Server] Profile data received:', Object.keys(profileData));
    
    // Find and update tenant
    const tenant = await Tenant.findById(tenantId).populate('room');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Update basic info
    if (profileData.basicInfo) {
      tenant.name = profileData.basicInfo.fullName || tenant.name;
      tenant.email = profileData.basicInfo.email || tenant.email;
      tenant.phone = profileData.basicInfo.primaryPhone || tenant.phone;
      tenant.profilePhoto = profileData.basicInfo.profilePhoto || tenant.profilePhoto;
    }
    
    // Store complete profile data including documents and rental details
    tenant.profileData = {
      ...tenant.profileData,
      basicInfo: profileData.basicInfo || tenant.profileData?.basicInfo,
      emergencyContact: profileData.emergencyContact || tenant.profileData?.emergencyContact,
      preferences: profileData.preferences || tenant.profileData?.preferences,
      rentalDetails: profileData.rentalDetails || tenant.profileData?.rentalDetails,
      documents: profileData.documents || tenant.profileData?.documents
    };
    
    await tenant.save();
    
    console.log(`✅ [Server] Tenant profile updated successfully`);
    
    // Broadcast profile update to all WebSocket clients
    const activeClients = broadcastToClients({
      type: 'TENANT_PROFILE_UPDATED',
      tenantId: tenantId,
      profileData: {
        userId: tenant._id,
        id: tenant._id,
        name: tenant.name,
        fullName: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        profilePhoto: tenant.profilePhoto,
        room: tenant.room,
        roomNumber: tenant.room?.roomNumber,
        emergencyContactName: tenant.profileData?.emergencyContact?.name,
        emergencyContactPhone: tenant.profileData?.emergencyContact?.phone,
        emergencyContactRelation: tenant.profileData?.emergencyContact?.relation,
        paymentDueDate: tenant.profileData?.preferences?.paymentDueDate,
        rentAmount: tenant.profileData?.rentalDetails?.rentAmount,
        securityDeposit: tenant.profileData?.rentalDetails?.securityDeposit,
        leaseStartDate: tenant.profileData?.rentalDetails?.leaseStartDate,
        leaseEndDate: tenant.profileData?.rentalDetails?.leaseEndDate,
        outstandingBill: tenant.profileData?.rentalDetails?.outstandingBill,
        documents: tenant.profileData?.documents,
        profileData: tenant.profileData
      }
    });
    
    console.log(`📡 [Server] Profile update broadcast to ${activeClients} WebSocket clients`);
    
    res.json({ 
      success: true, 
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        profilePhoto: tenant.profilePhoto,
        room: tenant.room,
        profileData: tenant.profileData
      },
      broadcastedTo: activeClients
    });
  } catch (error) {
    console.error('❌ [Server] Error updating tenant profile:', error);
    res.status(500).json({ error: 'Failed to update tenant profile' });
  }
});

// ============= SCHEDULED TASKS =============

// Auto-generate bills on 10th of every month at 9 AM
cron.schedule('0 9 10 * *', async () => {
  console.log('🕘 Running monthly bill generation...');
  
  // Also apply penalties to overdue bills
  try {
    console.log('⚡ Running penalty application alongside bill generation...');
    const penaltyResult = await penaltyService.applyMonthlyPenalties();
    console.log(`✅ Applied penalties to ${penaltyResult.penaltiesApplied} bills during monthly process`);
  } catch (penaltyError) {
    console.error('❌ Error applying penalties during monthly process:', penaltyError);
  }
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  try {
    // Auto-generate bills (same logic as manual generation)
    const tenants = await Tenant.find({ 
      status: 'active', 
      room: { $ne: null } 
    }).populate('room');

    let billsGenerated = 0;

    for (const tenant of tenants) {
      const existingBill = await Bill.findOne({
        tenant: tenant._id,
        month,
        year
      });

      if (!existingBill) {
        const room = tenant.room;
        let totalAmount = room.rent;
        
        Object.keys(room.utilities).forEach(utility => {
          if (!room.utilities[utility].included) {
            totalAmount += room.utilities[utility].rate;
          }
        });

        const bill = new Bill({
          tenant: tenant._id,
          room: room._id,
          month,
          year,
          dueDate: new Date(year, month, 10),
          items: {
            rent: {
              amount: room.rent,
              description: `Monthly rent for room ${room.roomNumber}`
            },
            utilities: {
              electricity: { amount: !room.utilities.electricity.included ? room.utilities.electricity.rate : 0 },
              water: { amount: !room.utilities.water.included ? room.utilities.water.rate : 0 },
              gas: { amount: !room.utilities.gas.included ? room.utilities.gas.rate : 0 },
              internet: { amount: !room.utilities.internet.included ? room.utilities.internet.rate : 0 },
              parking: { amount: !room.utilities.parking.included ? room.utilities.parking.rate : 0 },
              maintenance: { amount: !room.utilities.maintenance.included ? room.utilities.maintenance.rate : 0 }
            }
          },
          totalAmount
        });

        await bill.save();
        billsGenerated++;
      }
    }

    console.log(`✅ Auto-generated ${billsGenerated} bills for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
  } catch (error) {
    console.error('❌ Auto bill generation failed:', error);
  }
});

// Apply penalties monthly on the 10th at 10 AM (separate from bill generation)
cron.schedule('0 10 10 * *', async () => {
  console.log('⚡ Running monthly penalty application...');
  
  try {
    const result = await penaltyService.applyMonthlyPenalties();
    console.log(`✅ Monthly penalty application completed: ${result.penaltiesApplied} penalties applied, total amount: ₹${result.totalPenaltyAmount}`);
    
    // Broadcast penalty statistics update
    broadcastToClients({
      type: 'PENALTY_STATISTICS_UPDATE',
      date: new Date(),
      penaltiesApplied: result.penaltiesApplied,
      totalAmount: result.totalPenaltyAmount
    });
  } catch (error) {
    console.error('❌ Error in monthly penalty application cron job:', error);
  }
});

// Send payment reminders 3 days before due date (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Checking for upcoming bill due dates...');
  
  try {
    const currentDate = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(currentDate.getDate() + 3);
    
    // Find all pending bills due in 3 days
    const upcomingBills = await Bill.find({
      status: { $in: ['pending', 'partially_paid'] },
      dueDate: {
        $gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
        $lt: new Date(threeDaysFromNow.setHours(23, 59, 59, 999))
      }
    })
    .populate('tenant', 'name email username')
    .populate('room', 'roomNumber');
    
    console.log(`📅 Found ${upcomingBills.length} bills due in 3 days`);
    
    let remindersSent = 0;
    
    for (const bill of upcomingBills) {
      if (bill.tenant && bill.tenant.email) {
        // Send email reminder
        const emailResult = await emailService.sendPaymentReminder(
          bill.tenant.email,
          bill.tenant.name,
          {
            billNumber: bill.billNumber,
            month: bill.month,
            year: bill.year,
            dueDate: bill.dueDate,
            amount: bill.remainingAmount || bill.totalAmount
          },
          3 // days until due
        );
        
        if (emailResult.success) {
          remindersSent++;
          
          // Also send in-app notification
          const notification = new Notification({
            title: 'Payment Reminder',
            message: `Your bill for Room ${bill.room?.roomNumber || 'N/A'} is due in 3 days (₹${bill.remainingAmount || bill.totalAmount}). Please pay before ${bill.dueDate.toLocaleDateString()} to avoid late fees.`,
            type: 'personal',
            category: 'info',
            priority: 'medium',
            recipients: [{
              tenant: bill.tenant._id
            }]
          });
          
          await notification.save();
          
          // Broadcast notification
          broadcastToClients({
            type: 'NEW_NOTIFICATION',
            notification: await Notification.findById(notification._id)
              .populate('recipients.tenant', 'name username')
          });
          
          console.log(`✅ Reminder sent to ${bill.tenant.name} (${bill.tenant.email})`);
        } else if (!emailResult.devMode) {
          console.log(`⚠️ Failed to send reminder to ${bill.tenant.email}: ${emailResult.error}`);
        }
      } else {
        console.log(`⚠️ No email for tenant ${bill.tenant?.name || 'Unknown'}`);
      }
    }
    
    console.log(`✅ Sent ${remindersSent} payment reminders for bills due in 3 days`);
    
  } catch (error) {
    console.error('❌ Error sending payment reminders:', error);
  }
});

// Serve static files in production (for single-service deployment)
if (process.env.NODE_ENV === 'production') {
  console.log('🏭 Production mode: Serving static files from dist/');
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Catch-all handler for React Router (must be after API routes)
  app.get(/.*/, (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Start server
server.listen(PORT, async () => {
  // Get server host information for production deployment
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || `http://localhost:${PORT}`;
  const wsUrl = baseUrl.replace('http', 'ws').replace('https', 'wss');
  
  console.log('🚀 Rental Management Server Started!');
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 HTTP Server: ${baseUrl}`);
  console.log(`🔗 WebSocket Server: ${wsUrl}`);
  console.log(`🔌 Port: ${PORT}`);
  
  if (isProduction) {
    console.log('🏭 Production mode - CORS restrictions active');
    console.log(`💻 Frontend should connect to: ${wsUrl}`);
  } else {
    console.log('🔧 Development mode - CORS allows all origins');
  }
  
  console.log('');
  console.log('Available endpoints:');
  console.log('  Authentication:');
  console.log('    POST   /api/auth/login           - User authentication');
  console.log('    POST   /api/auth/forgot-password    - Request password reset code');
  console.log('    POST   /api/auth/verify-reset-code  - Verify reset code');
  console.log('    POST   /api/auth/reset-password     - Reset password');
  console.log('  Admin/Owner:');
  console.log('    GET    /api/admin/tenants           - Get all tenants');
  console.log('    PUT    /api/admin/tenants/:tenantId - Update tenant');
  console.log('    DELETE /api/admin/tenants/:tenantId - Remove tenant');
  console.log('    GET    /api/admin/rooms             - Get all rooms');
  console.log('    POST   /api/admin/rooms             - Add new room');
  console.log('    PUT    /api/admin/rooms/:roomId     - Update room');
  console.log('    POST   /api/admin/rooms/:roomId/assign-tenant - Assign tenant to room (auto-credentials)');
  console.log('    GET    /api/admin/payments/summary  - Payment summary');
  console.log('    POST   /api/admin/bills/generate    - Generate bills');
  console.log('  Tenant Dashboard:');
  console.log('    GET    /api/tenant/dashboard     - Complete dashboard data');
  console.log('    GET    /api/tenant/bills/:id    - Individual bill details');
  console.log('    GET    /api/tenant/bills/:id/pdf - Download PDF invoice');
  console.log('    PUT    /api/tenant/profile      - Update profile');
  console.log('    GET    /api/tenant/notifications - Get notifications');
  console.log('  Payment Processing:');
  console.log('    POST   /api/payments/create-order - Create Razorpay order');
  console.log('    POST   /api/payments/verify     - Verify payment');
  console.log('    POST   /api/payments/record     - Record manual payment');
  console.log('    GET    /api/payments/history    - Payment history');
  console.log('    GET    /api/payments/statistics - Payment analytics');
  console.log('  Penalty Management:');
  console.log('    POST   /api/penalties/apply-monthly     - Apply monthly penalties');
  console.log('    POST   /api/penalties/apply/:billId    - Apply penalty to specific bill');
  console.log('    GET    /api/penalties/calculate/:billId - Calculate penalty for bill');
  console.log('    GET    /api/penalties/history/:billId  - Get penalty history');
  console.log('    PUT    /api/penalties/adjust/:billId   - Adjust penalty amount');
  console.log('    DELETE /api/penalties/remove/:billId   - Remove penalty from bill');
  console.log('    GET    /api/penalties/statistics       - Get penalty statistics');
  console.log('    GET    /api/penalties/settings         - Get penalty settings');
  console.log('  Profile Management:');
  console.log('    GET    /api/owner/profile        - Get owner profile');
  console.log('    PUT    /api/owner/profile        - Update owner profile');
  console.log('    GET    /api/tenant/profile       - Get tenant profile');
  console.log('    PUT    /api/tenant/profile       - Update tenant profile');
  console.log('  System:');
  console.log('    GET    /api/notifications        - Get notifications');
  console.log('    POST   /api/notifications        - Create notification');
  console.log('    PUT    /api/notifications/:id    - Mark notification as read');
  console.log('    DELETE /api/notifications/:id    - Delete notification');
  console.log('    GET    /health                   - Health check');
  
  // Test email configuration
  try {
    const emailConfigured = await emailService.testEmailConfiguration();
    if (!emailConfigured) {
      console.log('📫 Email not configured - Password reset will not work');
      console.log('   Set EMAIL_USER and EMAIL_PASS environment variables');
      console.log('   For Gmail: Use App Password, not regular password');
    }
  } catch (error) {
    console.log('📫 Email configuration test failed - Password reset disabled');
  }
  
  // Create default owner if doesn't exist
  try {
    const existingOwner = await Owner.findOne({ username: 'owner' });
    if (!existingOwner) {
      const owner = new Owner({
        username: 'owner',
        email: 'owner@building.com',
        password: 'owner123',
        name: 'Building Owner'
      });
      await owner.save();
      console.log('Default owner account created');
    }
  } catch (error) {
    console.error('❌ Error creating default owner:', error);
  }
});