const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { 
  getProfile, 
  updateProfile, 
  uploadPhoto,
  uploadResume,
  downloadResume,
  deleteResume,
  getResumeInfo 
} = require("../controllers/userController");
const multer = require("multer");
const uploadResumeMiddleware = require("../middleware/uploadResume");

const router = express.Router();
const upload = multer(); // For photo

// GET and UPDATE profile using the token (no ID needed)
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

// Photo upload
router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadPhoto);

// RESUME ROUTES
router.post("/upload-resume", authMiddleware, uploadResumeMiddleware.single("resume"), uploadResume);
router.get("/download-resume", authMiddleware, downloadResume);
router.delete("/delete-resume", authMiddleware, deleteResume);
router.get("/resume-info", authMiddleware, getResumeInfo);

module.exports = router;