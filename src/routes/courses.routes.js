const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller'); 
const { authMiddleware } = require('../middleware/authMiddleware');
const studentController = require('../controllers/Student/studentController');

// ==========================================
// 1. PUBLIC ROUTES & SEARCH (Must be first)
// ==========================================
router.get('/search', studentController.searchCourses);

// ==========================================
// 2. INSTRUCTOR DASHBOARD & STATS
// ==========================================
router.get('/instructor/stats', authMiddleware, courseController.getInstructorStats);
router.get('/instructor/my-courses', authMiddleware, courseController.getInstructorCourses);
router.get('/instructor/archived', authMiddleware, courseController.getArchivedCourses);

// ==========================================
// 3. GENERAL COURSE OPERATIONS
// ==========================================
router.get('/', courseController.getAllCourses);
router.post('/', authMiddleware, courseController.createCourse);

// ==========================================
// 4. SPECIFIC COURSE OPERATIONS (Dynamic :id)
// ==========================================
router.get('/:id', courseController.getCourseById);
router.put('/:id', authMiddleware, courseController.updateCourse);

// Soft Delete (Archive)
router.delete('/:id', authMiddleware, courseController.deleteCourse);

// Restore form Archive
router.put('/:id/restore', authMiddleware, courseController.restoreCourse);

// Hard Delete (Permanent)
router.delete('/:id/permanent', authMiddleware, courseController.permanentDeleteCourse);

// ==========================================
// 5. CONTENT MANAGEMENT (Sections)
// ==========================================
router.post('/:id/sections', authMiddleware, courseController.createSection);
router.put('/:id/sections/:sectionId', authMiddleware, courseController.updateSection);
router.delete('/:id/sections/:sectionId', authMiddleware, courseController.deleteSection);

// ==========================================
// 6. LESSON MANAGEMENT
// ==========================================
router.post('/:id/sections/:sectionId/lessons', authMiddleware, courseController.createLesson);
router.put('/:id/lessons/:lessonId', authMiddleware, courseController.updateLesson);
router.delete('/:id/lessons/:lessonId', authMiddleware, courseController.deleteLesson);

// ==========================================
// 7. QUIZ MANAGEMENT
// ==========================================
router.get('/:id/lessons/:lessonId/quiz', authMiddleware, courseController.getLessonQuiz);
router.get('/:lessonId/quiz', authMiddleware, courseController.getLessonQuiz);
router.put('/:id/lessons/:lessonId/quiz', authMiddleware, courseController.updateLessonQuiz);

<<<<<<< Updated upstream
=======
// Reorder lessons (Alternative route - check if needed)
router.post("/:id/reorder-lessons", authMiddleware, courseController.reorderLessons);

// Reorder lessons content
router.put('/:courseId/sections/:sectionId/reorder', authMiddleware, courseController.reorderLessons);

// Fix order index
router.post("/:id/fix-order", authMiddleware, courseController.fixCourseOrderIndex);

>>>>>>> Stashed changes
module.exports = router;