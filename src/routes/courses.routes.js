const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const studentController = require('../controllers/Student/studentController');

// PUBLIC ROUTES
router.get('/search', studentController.searchCourses);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// --- PROTECTED ROUTES ---
router.get('/instructor/my-courses', authMiddleware, courseController.getInstructorCourses);
router.post('/', authMiddleware, courseController.createCourse);

router.delete('/:id', authMiddleware, courseController.deleteCourse);

router.put('/:id', authMiddleware, courseController.updateCourse);

router.post('/:id/sections', authMiddleware, courseController.createSection);

// ✅ New routes for editing and deleting sections
router.put('/:id/sections/:sectionId', authMiddleware, courseController.updateSection);
router.delete('/:id/sections/:sectionId', authMiddleware, courseController.deleteSection);

module.exports = router;