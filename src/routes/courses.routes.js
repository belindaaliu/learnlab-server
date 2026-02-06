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

// New routes for editing and deleting sections
router.put('/:id/sections/:sectionId', authMiddleware, courseController.updateSection);
router.delete('/:id/sections/:sectionId', authMiddleware, courseController.deleteSection);

// Lesson routes
router.post('/:id/sections/:sectionId/lessons', authMiddleware, courseController.createLesson);
router.put('/:id/lessons/:lessonId', authMiddleware, courseController.updateLesson);
router.delete('/:id/lessons/:lessonId', authMiddleware, courseController.deleteLesson);
    //Quiz
router.get('/:id/lessons/:lessonId/quiz', authMiddleware, courseController.getLessonQuiz);
router.put('/:id/lessons/:lessonId/quiz', authMiddleware, courseController.updateLessonQuiz);

module.exports = router;