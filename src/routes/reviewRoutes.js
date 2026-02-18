const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware'); // Add optionalAuth
const {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  getUserCourseReview
} = require('../controllers/reviewController');

// Public/Protected routes - use optionalAuth to get user if logged in
router.get('/courses/:courseId/reviews', optionalAuth, getCourseReviews); // <-- Added optionalAuth

// Protected routes
router.post('/courses/:courseId/reviews', authMiddleware, createReview);
router.get('/courses/:courseId/reviews/me', authMiddleware, getUserCourseReview);
router.put('/reviews/:reviewId', authMiddleware, updateReview);
router.delete('/reviews/:reviewId', authMiddleware, deleteReview);

module.exports = router;