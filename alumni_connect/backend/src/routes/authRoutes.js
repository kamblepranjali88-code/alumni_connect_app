const express = require('express');
const router = express.Router();
const {
    studentRegistration,
    login,
    changePassword,
    getStudentProfile,
    updateStudentProfile  // ← Make sure this is imported
} = require('../controllers/authController');

// Auth routes
router.post('/auth/student-request', studentRegistration);
router.post('/auth/login', login);
router.post('/auth/change-password', changePassword);

// Profile routes
router.get('/auth/student/profile/:userId', getStudentProfile);
router.put('/auth/student/profile/:userId', updateStudentProfile);  // ← ADD THIS LINE

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working!' });
});

module.exports = router;