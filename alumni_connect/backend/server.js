const express = require('express');
const cors = require('cors');
require('dotenv').config();

// IMPORT ROUTES
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static('../frontend'));

// Redirect root to role-select page
app.get('/', (req, res) => {
    res.redirect('/html/role-select.html');
});

// ✅ IMPORTANT: MOUNT ROUTES
app.use('/api', authRoutes);

// Test route (direct on server)
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Routes mounted at /api`);
    console.log(`Frontend available at http://localhost:${PORT}/html/role-select.html`);
});