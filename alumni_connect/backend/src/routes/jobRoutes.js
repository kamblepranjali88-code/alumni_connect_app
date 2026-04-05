const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Job routes
router.post('/post', jobController.postJob);
router.get('/my-jobs', jobController.getMyJobs);
router.delete('/:jobId', jobController.deleteJob);
router.get('/', jobController.getJobs);
router.get('/:jobId', jobController.getJobById);

module.exports = router;