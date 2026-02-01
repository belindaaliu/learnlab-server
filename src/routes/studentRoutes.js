const express = require("express");
const certController = require('../controllers/certificateController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses
} = require("../controllers/Student/studentController");

const router = express.Router();

// Current user
router.get("/me/:id", getCurrentUser);

// Purchased courses
router.get("/:id/courses", getPurchasedCourses);

// Wishlist courses
router.get("/:id/wishlist", getWishlistCourses);

// Certificates
router.get('/certificates', authMiddleware, certController.getStudentCertificates);
router.get('/certificates/:courseId/download', authMiddleware, certController.downloadCertificate);

module.exports = router;
