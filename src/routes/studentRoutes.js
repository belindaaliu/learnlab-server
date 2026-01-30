import express from "express";
import { 
  getCurrentUser,
  getPurchasedCourses, 
  getWishlistCourses 
} from "../controllers/Student/studentController.js";

const router = express.Router();

// Current user
router.get("/me/:id", getCurrentUser);

// Purchased courses
router.get("/:id/courses", getPurchasedCourses);

// Wishlist courses
router.get("/:id/wishlist", getWishlistCourses);

export default router;
