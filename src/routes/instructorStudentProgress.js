const express = require("express");
const router = express.Router();
const { authMiddleware  } = require("../middleware/authMiddleware");
const {
  getStudentProgressSummary,
  getDetailedLessonProgress,
  getStudentQuizHistory,
  getStudentActivity, 
  getCourseStudents,
  getInstructorQuizReview
} = require("../controllers/instructorStudentProgress");


// Get student progress summary
router.get("/instructor/courses/:courseId/students/:studentId/progress",authMiddleware, getStudentProgressSummary);

// Get detailed lesson-by-lesson progress
router.get("/instructor/courses/:courseId/students/:studentId/progress/lessons",authMiddleware, getDetailedLessonProgress);

// Get student's quiz attempt history
router.get("/instructor/courses/:courseId/students/:studentId/progress/quizzes",authMiddleware, getStudentQuizHistory);

// Get student's recent activity
router.get("/instructor/courses/:courseId/students/:studentId/progress/activity",authMiddleware, getStudentActivity);

// All instructor student routes
router.get("/instructor/courses/:courseId/students",authMiddleware, getCourseStudents);

// Get quiz attempt details for instructor review
router.get("/instructor/quiz-review/:attemptId",authMiddleware,getInstructorQuizReview);

module.exports = router;