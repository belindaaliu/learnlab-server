const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const subscriptionController = require("../controllers/subscriptionController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// --- DASHBOARD & ANALYTICS ---

router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/analytics", adminController.getAnalytics);
router.get("/analytics/advanced", adminController.getAnalytics);
// router.get('/analytics/enrollments', adminController.getEnrollmentAnalytics);
// router.get('/analytics/advanced', adminController.getPureInsights);

// --- SUBSCRIPTION PLAN MANAGEMENT (ADMIN ONLY) ---
router.get("/subscriptions/plans", subscriptionController.getPlans);
router.post("/subscriptions/plans", subscriptionController.createPlan);
router.put("/subscriptions/plans/:id", subscriptionController.updatePlan);
router.delete("/subscriptions/plans/:id", subscriptionController.deletePlan);

// --- INSTRUCTOR MANAGEMENT ---
router.get("/instructors", adminController.getInstructors);
router.get(
  "/instructors/detail/:instructorId",
  adminController.getInstructorDetail,
);
router.post(
  "/instructors/:instructorId/review",
  adminController.reviewInstructor,
);

// --- COURSE MANAGEMENT & REVIEW ---

router.get("/courses", adminController.getCourses);
router.get(
  "/courses/:courseId/review-data",
  adminController.getCourseReviewData,
);
router.patch("/courses/:courseId/status", adminController.updateCourseStatus);

// --- USER MANAGEMENT (General) ---
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

module.exports = router;
