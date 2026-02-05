const express = require("express");
const router = express.Router();
const {
  getCoursePlayerData,
  getCourseLessons,
  getLessonById,
  markLessonComplete,
  submitCourseReview,
  getNextLesson
} = require("../controllers/coursePlayerController");

const { authMiddleware } = require("../middleware/authMiddleware");


// GET full course info for player page
router.get("/:courseId", authMiddleware, getCoursePlayerData);

// GET all lessons for a course
router.get("/:courseId/lessons", authMiddleware, getCourseLessons);

// GET a single lesson (video URL, title, duration)
router.get("/:courseId/lessons/:lessonId", authMiddleware, getLessonById);

// Mark lesson complete
router.post("/:courseId/lessons/:lessonId/complete", authMiddleware, markLessonComplete);

// Submit rating + review
router.post("/:courseId/review", authMiddleware, submitCourseReview);

// GET next uncompleted lesson
router.get("/:courseId/next", authMiddleware, getNextLesson);

module.exports = router;
