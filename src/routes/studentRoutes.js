const express = require("express");
const certController = require('../controllers/certificateController');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses,
  updateCurrentUser
} = require("../controllers/Student/studentController");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { uploadPhoto } = require("../controllers/Student/studentController");

// Current user
router.get("/me/:id", getCurrentUser);

// Purchased courses
router.get("/:id/courses", getPurchasedCourses);

// Wishlist courses
router.get("/:id/wishlist", getWishlistCourses);

router.put("/me/:id", updateCurrentUser);


router.post("/upload-photo/:id", upload.single("photo"), uploadPhoto);



// Certificates
router.get('/certificates', authMiddleware, certController.getStudentCertificates);
router.get('/certificates/:courseId/download', authMiddleware, certController.downloadCertificate);

module.exports = router;
