// backend/src/routes/eventRoutes.js
const express = require('express');
const router  = express.Router();
const {
    createEvent,
    getEvents,
    getAdminEvents,
    registerForEvent,
    deleteEvent,
    getEventRegistrations
} = require('../controllers/eventController');

// Public / user routes
router.get('/',                             getEvents);             // GET  /api/events?user_id=&user_type=
router.post('/register',                    registerForEvent);      // POST /api/events/register

// Admin routes
router.get('/admin/all',                    getAdminEvents);        // GET  /api/events/admin/all
router.post('/admin/create',                createEvent);           // POST /api/events/admin/create
router.delete('/admin/:event_id',           deleteEvent);           // DELETE /api/events/admin/:id
router.get('/admin/:event_id/registrations', getEventRegistrations); // GET  /api/events/admin/:id/registrations

module.exports = router;