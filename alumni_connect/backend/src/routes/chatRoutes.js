// backend/src/routes/chatRoutes.js

const express = require('express');
const router  = express.Router();
const {
  getMyRooms,
  getRoomMessages,
  markAsRead,
  getUnreadCount,
} = require('../controllers/chatController');

// GET  /api/chat/my-rooms?user_id=&user_type=      → sidebar list
router.get('/my-rooms', getMyRooms);

// GET  /api/chat/unread-count?user_id=&user_type=  → nav badge number
router.get('/unread-count', getUnreadCount);

// GET  /api/chat/:room_id/messages?user_id=&user_type=  → full chat history
router.get('/:room_id/messages', getRoomMessages);

// POST /api/chat/:room_id/read   body: { user_type }   → mark as read
router.post('/:room_id/read', markAsRead);

module.exports = router;