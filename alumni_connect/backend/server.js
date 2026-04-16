const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// IMPORT ROUTES
const authRoutes       = require('./src/routes/authRoutes');
const alumniAuthRoutes = require('./src/routes/alumniAuthRoutes');
const requestRoutes    = require('./src/routes/requestRoutes');
const chatRoutes       = require('./src/routes/chatRoutes');
const adminAuthRoutes  = require('./src/routes/adminAuthRoutes');
const eventRoutes      = require('./src/routes/eventRoutes');
const jobRoutes        = require('./src/routes/jobRoutes');
const forumRoutes      = require('./src/routes/forumRoutes');
const statsRoutes      = require('./src/routes/statsRoutes');
const updatesRoutes    = require('./src/routes/updatesRoutes');

// IMPORT SOCKET
const { initChatSocket } = require('./src/socket/chatSocket');

// INIT APP
const app    = express();
const server = http.createServer(app);

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
initChatSocket(io);

const PORT = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// STATIC FRONTEND
const frontendPath = path.resolve(__dirname, '..', 'frontend');
console.log('Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));

// ROOT REDIRECT
app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

// MOUNT ROUTES
app.use('/api', authRoutes);
app.use('/api/alumni', alumniAuthRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/stats', statsRoutes);        // ← NEW
app.use('/api/updates', updatesRoutes);    // ← NEW

// TEST ROUTE
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// START SERVER
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Student routes  at /api`);
    console.log(`Alumni routes   at /api/alumni`);
    console.log(`Request routes  at /api/requests`);
    console.log(`Chat routes     at /api/chat`);
    console.log(`Stats routes    at /api/stats`);
    console.log(`Updates routes  at /api/updates`);
    console.log(`Socket.IO       ready for real-time chat`);
    console.log(`Frontend available at http://localhost:${PORT}/html/index.html`);
});