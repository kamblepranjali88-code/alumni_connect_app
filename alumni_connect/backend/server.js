const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// IMPORT ROUTES
const authRoutes = require('./src/routes/authRoutes');
const alumniAuthRoutes = require('./src/routes/alumniAuthRoutes'); // ← ADD

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));           // ← increased limit for photo upload
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // ← increased limit

// Serve static frontend files
const frontendPath = path.resolve(__dirname, '..', 'frontend');
console.log('Serving frontend from:', frontendPath);
app.use(express.static(frontendPath));





// Redirect root to index page
app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

// Mount API routes
app.use('/api', authRoutes);
app.use('/api/alumni', alumniAuthRoutes); 

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`students routes mounted at /api`);
    console.log(`Alumni routes at /api/alumni`);
    console.log(`Frontend available at http://localhost:${PORT}/html/index.html`);
});

