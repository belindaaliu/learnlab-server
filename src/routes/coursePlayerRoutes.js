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



// GET full course info for player page
router.get("/:courseId", getCoursePlayerData);

// GET all lessons for a course
router.get("/:courseId/lessons", getCourseLessons);

// GET a single lesson (video URL, title, duration)
router.get("/:courseId/lessons/:lessonId", getLessonById);

// Mark lesson complete
router.post("/:courseId/lessons/:lessonId/complete", markLessonComplete);

// Submit rating + review
router.post("/:courseId/review", submitCourseReview);

router.get("/:courseId/next", getNextLesson);


module.exports = router;
