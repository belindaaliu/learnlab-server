const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('admin'));


 // --- DASHBOARD & ANALYTICS ---

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/advanced', adminController.getAnalytics);
// router.get('/analytics/enrollments', adminController.getEnrollmentAnalytics);
// router.get('/analytics/advanced', adminController.getPureInsights);


 // --- INSTRUCTOR MANAGEMENT ---
 
router.get('/instructors', adminController.getInstructors);
router.get('/instructors/detail/:instructorId', adminController.getInstructorDetail);
router.post('/instructors/:instructorId/review', adminController.reviewInstructor);


 // --- COURSE MANAGEMENT & REVIEW ---
 
// List all courses (pending review, active, or flagged)
router.get('/courses', adminController.getCourses);

router.get('/courses/:courseId/review-data', adminController.getCourseReviewData);

// Update course status (e.g., publish, reject, or draft)
router.patch('/courses/:courseId/status', adminController.updateCourseStatus);


 // --- USER MANAGEMENT (General) ---

// router.get('/users', adminController.getAllUsers);
// router.patch('/users/:userId/role', adminController.updateUserRole);

module.exports = router;