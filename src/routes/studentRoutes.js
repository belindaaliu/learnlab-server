const express = require("express");
const {
  getCurrentUser,
  getPurchasedCourses,
  getWishlistCourses
} = require("../controllers/Student/studentController");

const router = express.Router();

// Current user
router.get("/me/:id", getCurrentUser);

// Purchased courses
router.get("/:id/courses", getPurchasedCourses);

// Wishlist courses
router.get("/:id/wishlist", getWishlistCourses);

module.exports = router;
