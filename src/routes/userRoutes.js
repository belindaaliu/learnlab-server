const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getProfile, updateProfile,uploadPhoto } = require("../controllers/userController");
const multer = require("multer");


const router = express.Router();
const upload = multer();

// GET and UPDATE profile using the token (no ID needed)
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);
router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadPhoto);

module.exports = router;
