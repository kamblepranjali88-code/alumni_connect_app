const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// Forum routes
router.get('/posts', forumController.getAllPosts);
router.get('/posts/:postId', forumController.getPostById);
router.post('/posts', forumController.createPost);
router.post('/comments', forumController.addComment);
router.delete('/posts/:postId', forumController.deletePost);      
router.delete('/comments/:commentId', forumController.deleteComment);

module.exports = router;



