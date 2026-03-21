const express = require('express');
const router  = express.Router();
const {
    sendRequest,
    getStudentRequests,
    getAlumniRequests,
    acceptRequest,
    rejectRequest,
    getSlotInfo
} = require('../controllers/requestController');

// Send request
router.post('/send', sendRequest);

// Get requests
router.get('/student/:studentId', getStudentRequests);
router.get('/alumni/:alumniId', getAlumniRequests);
router.get('/slots/:studentId', getSlotInfo);

// Accept / Reject
router.put('/:requestId/accept', acceptRequest);
router.put('/:requestId/reject', rejectRequest);

module.exports = router;