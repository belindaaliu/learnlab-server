const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');

// GET /api/courses
router.get('/', courseController.getAllCourses);

router.get('/:id', courseController.getCourseById);

module.exports = router;