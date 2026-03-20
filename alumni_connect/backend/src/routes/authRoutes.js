const express = require('express');  // ← add this line
const router = express.Router();

const authController = require('../controllers/authController');  // ← line 1
console.log('Auth controller exports:', Object.keys(authController));  // ← line 2

const {
    studentRegistration,
    login,
    changePassword,
    getStudentProfile,
    updateStudentProfile
} = require('../controllers/authController');

// Auth routes
router.post('/auth/student-request', studentRegistration);
router.post('/auth/login', login);
router.post('/auth/change-password', changePassword);

// Profile routes
router.get('/auth/student/profile/:userId', getStudentProfile);
router.put('/auth/student/profile/:userId', updateStudentProfile);



// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working!' });
});

module.exports = router;