

const express = require('express');
const router  = express.Router();
const { adminLogin, getAdminDashboard } = require('../controllers/adminAuthController');

// POST /api/admin/login
router.post('/login', adminLogin);

// GET /api/admin/dashboard  ← ADD THIS
router.get('/dashboard', getAdminDashboard);

module.exports = router;