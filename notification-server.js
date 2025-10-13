import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const server = http.createServer(app);

// WebSocket server for real-time notifications
const wss = new WebSocketServer({ server });

// Store connected clients
const connectedClients = new Set();

// WebSocket connection handling
wss.on('connection', (ws, request) => {
  console.log('🔗 New WebSocket client connected from:', request.socket.remoteAddress);
  connectedClients.add(ws);
  
  // Send current notifications to new client
  fs.readFile(NOTIFICATIONS_FILE, 'utf8')
    .then(data => {
      const notifications = JSON.parse(data);
      ws.send(JSON.stringify({
        type: 'INITIAL_NOTIFICATIONS',
        notifications: notifications
      }));
    })
    .catch(error => {
      console.error('❌ Error sending initial notifications:', error);
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

// Function to broadcast to all connected clients
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

// Middleware
app.use(cors());
app.use(express.json());

// Path to notifications file
const NOTIFICATIONS_FILE = path.join(__dirname, 'notifications-data.json');

// Initialize notifications file if it doesn't exist
async function initializeNotificationsFile() {
  try {
    await fs.access(NOTIFICATIONS_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify([]));
    console.log('✅ Created notifications-data.json file');
  }
}

// Get all notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    const notifications = JSON.parse(data);
    console.log(`📖 GET /api/notifications - Returning ${notifications.length} notifications`);
    res.json({ notifications });
  } catch (error) {
    console.error('❌ Error reading notifications:', error);
    res.status(500).json({ error: 'Failed to read notifications' });
  }
});

// Add new notification
app.post('/api/notifications', async (req, res) => {
  try {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...req.body,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      read: false,
      author: req.body.author || 'Building Management'
    };

    // Read current notifications with error handling
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    let notifications;
    try {
      notifications = JSON.parse(data);
    } catch (parseError) {
      console.error('❌ JSON parse error, reinitializing file:', parseError);
      notifications = [];
      await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
    }

    // Add new notification to the beginning
    notifications.unshift(newNotification);

    // Keep only last 100 notifications to prevent file from growing too large
    if (notifications.length > 100) {
      notifications.splice(100);
    }

    // Write back to file
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));

    console.log(`📝 POST /api/notifications - Added notification: ${newNotification.title}`);
    console.log(`Total notifications: ${notifications.length}`);

    // Broadcast new notification to all connected WebSocket clients
    const clientCount = broadcastToClients({
      type: 'NEW_NOTIFICATION',
      notification: newNotification,
      allNotifications: notifications
    });

    res.json({ 
      success: true, 
      notification: newNotification, 
      total: notifications.length,
      broadcastedTo: clientCount
    });
  } catch (error) {
    console.error('❌ Error adding notification:', error);
    res.status(500).json({ error: 'Failed to add notification' });
  }
});

// Update notification (mark as read, etc.)
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updates = req.body;

    // Read current notifications
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    let notifications = JSON.parse(data);

    // Find and update notification
    const notificationIndex = notifications.findIndex(n => n.id == notificationId);
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notifications[notificationIndex] = { ...notifications[notificationIndex], ...updates };

    // Write back to file
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));

    console.log(`✏️ PUT /api/notifications/${notificationId} - Updated notification`);

    res.json({ success: true, notification: notifications[notificationIndex] });
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Read current notifications
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    let notifications = JSON.parse(data);

    // Find the notification being deleted for logging
    const deletedNotification = notifications.find(n => n.id == notificationId);
    
    // Filter out the notification to delete
    const initialLength = notifications.length;
    notifications = notifications.filter(n => n.id != notificationId);

    if (notifications.length === initialLength) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Write back to file
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));

    console.log(`🗑️ DELETE /api/notifications/${notificationId} - Deleted notification: "${deletedNotification?.title || 'Unknown'}"`);  
    console.log(`Total notifications remaining: ${notifications.length}`);

    // Broadcast deletion to all connected WebSocket clients
    const clientCount = broadcastToClients({
      type: 'NOTIFICATION_DELETED',
      deletedId: notificationId,
      deletedNotification: deletedNotification,
      allNotifications: notifications,
      total: notifications.length
    });

    res.json({ 
      success: true, 
      total: notifications.length,
      deletedNotification: deletedNotification,
      broadcastedTo: clientCount
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initializeNotificationsFile();
  
  server.listen(PORT, () => {
    console.log('🚀 Notification Server Started!');
    console.log(`📡 HTTP Server: http://localhost:${PORT}`);
    console.log(`🔗 WebSocket Server: ws://localhost:${PORT}`);
    console.log(`📄 Notifications file: ${NOTIFICATIONS_FILE}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET    /api/notifications     - Get all notifications');
    console.log('  POST   /api/notifications     - Add new notification');
    console.log('  PUT    /api/notifications/:id - Update notification');
    console.log('  DELETE /api/notifications/:id - Delete notification');
    console.log('  GET    /health               - Health check');
    console.log('');
    console.log('✅ Ready for real-time cross-browser notifications!');
    console.log(`📡 WebSocket clients: ${connectedClients.size}`);
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});