const express = require("express");
const certController = require('../controllers/certificateController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses,
  updateCurrentUser,
  searchCourses,
  addCourseToWishlist,
  removeFromWishlist,
  enrollCourse,
  getEnrolledCoursesWithNextContent
} = require("../controllers/Student/studentController");
const { getRecommendations } = require("../controllers/Student/recommendationController");
const { getFeaturedCourses } = require("../controllers/Student/featuredController");

const router = express.Router();
const upload = require("../middleware/uploadMiddleware");


// WISHLIST ROUTES
router.post("/:id/wishlist", addCourseToWishlist);
router.get("/:id/wishlist", getWishlistCourses);
router.delete("/:id/wishlist/:courseId", removeFromWishlist);


// ENROLLMENT ROUTES
router.post("/:id/enrollments", enrollCourse);
router.get("/:id/courses", getPurchasedCourses);

// USER PROFILE ROUTES
router.get("/me/:id", getCurrentUser);
router.put("/me/:id", updateCurrentUser);


// SEARCH & RECOMMENDATIONS
router.get("/search", searchCourses);
router.get("/:id/recommendations", getRecommendations);


// CERTIFICATES
router.get('/certificates', authMiddleware, certController.getStudentCertificates);
router.get('/certificates/:courseId/download', authMiddleware, certController.downloadCertificate);

// Add this route
router.get('/:id/enrolled-courses-next', getEnrolledCoursesWithNextContent);

router.get("/:id/featured-courses", getFeaturedCourses);

module.exports = router;