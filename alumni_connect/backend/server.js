const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');           // ← NEW: needed for Socket.IO
const { Server } = require('socket.io'); // ← NEW: Socket.IO server
require('dotenv').config();



// IMPORT ROUTES
const authRoutes       = require('./src/routes/authRoutes');
const alumniAuthRoutes = require('./src/routes/alumniAuthRoutes');
const requestRoutes    = require('./src/routes/requestRoutes');
const chatRoutes       = require('./src/routes/chatRoutes');  
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
 const eventRoutes     = require('./src/routes/eventRoutes');

// ← NEW: Socket.IO chat handler
const { initChatSocket } = require('./src/socket/chatSocket');

const app    = express();
const server = http.createServer(app);  // ← NEW: wrap express in http.Server

// ← NEW: Attach Socket.IO to the http server
const io = new Server(server, {
  cors: {
    origin: '*',   // In production, replace * with your frontend URL
    methods: ['GET', 'POST'],
  },
});
initChatSocket(io);  // ← NEW: wire up all chat socket events

const PORT = process.env.PORT || 5000;

const jobRoutes = require('./src/routes/jobRoutes');  
const forumRoutes = require('./src/routes/forumRoutes');


// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static frontend files
const frontendPath = path.resolve(__dirname, '..', 'frontend');
console.log('Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));

// Redirect root to index page
app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

// MOUNT ROUTES
app.use('/api', authRoutes);                  // student routes → /api/auth/...
app.use('/api/alumni', alumniAuthRoutes);      // alumni routes  → /api/alumni/...
app.use('/api/requests', requestRoutes);       // request routes → /api/requests/...
app.use('/api/chat', chatRoutes);             // ← NEW: chat routes → /api/chat/...
app.use('/api/admin', adminAuthRoutes);   // admin login → /api/admin/login
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/forum', forumRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// ← CHANGED: server.listen instead of app.listen (required for Socket.IO)
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Student routes  at /api`);
    console.log(`Alumni routes   at /api/alumni`);
    console.log(`Request routes  at /api/requests`);
    console.log(`Chat routes     at /api/chat`);       // ← NEW
    console.log(`Socket.IO       ready for real-time chat`); // ← NEW
    console.log(`Frontend available at http://localhost:${PORT}/html/index.html`);
});



