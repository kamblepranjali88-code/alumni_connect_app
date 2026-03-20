const express = require('express');
const router = express.Router();
const {
    alumniRegistration,
    alumniLogin,
    alumniChangePassword,
    getAlumniProfile,
    updateAlumniProfile,
    getAllAlumni
} = require('../controllers/alumniAuthController');

// Auth routes
router.post('/register', alumniRegistration);
router.post('/login', alumniLogin);
router.post('/change-password', alumniChangePassword);

// Profile routes
router.get('/profile/:userId', getAlumniProfile);
router.put('/profile/:userId', updateAlumniProfile);

// Search route (for students to search alumni)
router.get('/search', getAllAlumni);

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Alumni router is working!' });
});

module.exports = router;