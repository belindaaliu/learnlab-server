const express = require("express");
const router = express.Router();
const {
  getCoursePlayerData,
  getCourseLessons,
  getLessonById,
  markLessonComplete,
  submitCourseReview,
  getNextLesson,
  markLessonIncomplete,
  getCompletedLessonIds,
  initializeCourseProgress,
  getFirstIncompleteLesson,
  getAssessmentData,
  submitQuizAttempt,
  getQuizResults,
  getQuizInfo,
  getCourseProgress
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

// GET completed lesson IDs
router.get("/:courseId/completed", authMiddleware, getCompletedLessonIds);

// Mark lesson incomplete
router.delete("/:courseId/lessons/:lessonId/complete", authMiddleware, markLessonIncomplete);

// Initialize course progress
router.post("/:courseId/initialize-progress", authMiddleware, initializeCourseProgress);

// Get first incomplete lesson
router.get("/:courseId/first-incomplete", authMiddleware, getFirstIncompleteLesson);

// Add these routes:

// Get assessment data
router.get("/:courseId/assessments/:lessonId", authMiddleware, getAssessmentData);

// Submit quiz attempt
router.post("/:courseId/assessments/:lessonId/submit", authMiddleware, submitQuizAttempt);

// Get quiz results
router.get("/quiz-results/:attemptId", authMiddleware, getQuizResults);

// Get quiz info
router.get("/quiz-info/:attemptId", authMiddleware, getQuizInfo);

router.get('/:courseId/progress', authMiddleware, getCourseProgress);

module.exports = router;
