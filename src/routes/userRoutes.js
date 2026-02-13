const express = require("express");
const { authMiddleware, optionalAuth } = require("../middleware/authMiddleware");
const { 
  getProfile, 
  updateProfile, 
  uploadPhoto,
  uploadResume,
  downloadResume,
  deleteResume,
  getResumeInfo,
  searchUsers,
  getInstructorCourses,
  getPublicProfile,
  applyAsInstructor, 
} = require("../controllers/userController");
const multer = require("multer");
const uploadResumeMiddleware = require("../middleware/uploadResume");

const router = express.Router();
const upload = multer(); // For photo

// GET and UPDATE profile using the token (no ID needed)
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

// ---------------- APPLY AS INSTRUCTOR ----------------
router.post("/instructor-applications/apply", authMiddleware, applyAsInstructor, );

// Photo upload
router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadPhoto);

// RESUME ROUTES
router.post("/upload-resume", authMiddleware, uploadResumeMiddleware.single("resume"), uploadResume);
router.get("/download-resume", authMiddleware, downloadResume);
router.delete("/delete-resume", authMiddleware, deleteResume);
router.get("/resume-info", authMiddleware, getResumeInfo);


// SEARCH USERS - Public search (optional auth)
router.get("/search", optionalAuth, searchUsers);

router.get('/instructor/:id/courses', getInstructorCourses);
router.get('/public-profile/:id', getPublicProfile);

module.exports = router;