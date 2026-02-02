const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

// PUBLIC ROUTES
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// --- PROTECTED ROUTES ---
router.get('/instructor/my-courses', authMiddleware, courseController.getInstructorCourses);
router.post('/', authMiddleware, courseController.createCourse);

module.exports = router;