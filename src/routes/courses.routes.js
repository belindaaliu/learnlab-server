const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');

// GET /api/courses
router.get('/', courseController.getAllCourses);

module.exports = router;