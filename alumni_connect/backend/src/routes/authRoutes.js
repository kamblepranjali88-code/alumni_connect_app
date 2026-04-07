const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes (student)
router.post('/auth/student-request', authController.studentRegistration);
router.post('/auth/login', authController.login);
router.post('/auth/change-password', authController.changePassword);

// Profile routes
router.get('/auth/student/profile/:userId', authController.getStudentProfile);
router.put('/auth/student/profile/:userId', authController.updateStudentProfile);

// Forgot password routes - ADD THESE (without /auth prefix)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working!' });
});

module.exports = router;