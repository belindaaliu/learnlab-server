const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createReview,
  updateReview,
  deleteReview,
  getCourseReviews,
  getUserCourseReview
} = require('../controllers/reviewController');

// Public routes
router.get('/courses/:courseId/reviews', getCourseReviews);

// Protected routes
router.post('/courses/:courseId/reviews', authMiddleware, createReview);
router.get('/courses/:courseId/reviews/me', authMiddleware, getUserCourseReview);
router.put('/reviews/:reviewId', authMiddleware, updateReview);
router.delete('/reviews/:reviewId', authMiddleware, deleteReview);

module.exports = router;