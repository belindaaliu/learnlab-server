const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller'); 
const { authMiddleware } = require('../middleware/authMiddleware');
const studentController = require('../controllers/Student/studentController');
const requireApprovedInstructor = require("../middleware/requireApprovedInstructor");


// ==========================================
// 1. PUBLIC ROUTES & SEARCH (Must be first)
// ==========================================
router.get('/search', studentController.searchCourses);

// ==========================================
// 2. INSTRUCTOR DASHBOARD & STATS
// ==========================================
router.get('/instructor/stats', authMiddleware, requireApprovedInstructor, courseController.getInstructorStats);
router.get('/instructor/my-courses', authMiddleware, requireApprovedInstructor, courseController.getInstructorCourses);
router.get('/instructor/archived', authMiddleware, requireApprovedInstructor, courseController.getArchivedCourses);

// ==========================================
// 3. GENERAL COURSE OPERATIONS
// ==========================================
router.get('/', courseController.getAllCourses);
router.post('/', authMiddleware, requireApprovedInstructor, courseController.createCourse);

// ==========================================
// 4. SPECIFIC COURSE OPERATIONS (Dynamic :id)
// ==========================================
router.get('/:id', courseController.getCourseById);
router.put('/:id', authMiddleware, requireApprovedInstructor, courseController.updateCourse);

// Soft Delete (Archive)
router.delete('/:id', authMiddleware, requireApprovedInstructor, courseController.deleteCourse);

// Restore form Archive
router.put('/:id/restore', authMiddleware, requireApprovedInstructor, courseController.restoreCourse);

// Hard Delete (Permanent)
router.delete('/:id/permanent', authMiddleware, requireApprovedInstructor, courseController.permanentDeleteCourse);

// ==========================================
// 5. CONTENT MANAGEMENT (Sections)
// ==========================================
router.post('/:id/sections', authMiddleware, requireApprovedInstructor, courseController.createSection);
router.put('/:id/sections/:sectionId', authMiddleware, requireApprovedInstructor, courseController.updateSection);
router.delete('/:id/sections/:sectionId', authMiddleware, requireApprovedInstructor, courseController.deleteSection);

// ==========================================
// 6. LESSON MANAGEMENT
// ==========================================
router.post('/:id/sections/:sectionId/lessons', authMiddleware, requireApprovedInstructor, courseController.createLesson);
router.put('/:id/lessons/:lessonId', authMiddleware, requireApprovedInstructor, courseController.updateLesson);
router.delete('/:id/lessons/:lessonId', authMiddleware, requireApprovedInstructor, courseController.deleteLesson);

// ==========================================
// 7. QUIZ MANAGEMENT
// ==========================================
router.get('/:id/lessons/:lessonId/quiz', authMiddleware, requireApprovedInstructor, courseController.getLessonQuiz);
router.get('/:lessonId/quiz', authMiddleware, requireApprovedInstructor, courseController.getLessonQuiz);
router.put('/:id/lessons/:lessonId/quiz', authMiddleware, requireApprovedInstructor, courseController.updateLessonQuiz);

// ==========================================
// 8. REORDERING & MAINTENANCE
// ==========================================

// Reorder lessons (Alternative route - check if needed)
router.post("/:id/reorder-lessons", authMiddleware, requireApprovedInstructor, courseController.reorderLessons);

// Reorder lessons content
router.put('/:id/sections/:sectionId/reorder', authMiddleware, requireApprovedInstructor, courseController.reorderLessons);

// Fix order index
router.post("/:id/fix-order", authMiddleware, requireApprovedInstructor, courseController.fixCourseOrderIndex);

// Increment course views
router.put('/:id/views', courseController.incrementCourseViews);

// Increment/decrement enrollment count
// router.put('/:id/enrollments/increment', courseController.incrementEnrollmentCount);
// router.put('/:id/enrollments/decrement', courseController.decrementEnrollmentCount);

module.exports = router;