import express from "express";
import { getPurchasedCourses, getWishlistCourses,getWishlistCourses } from "../controllers/studentController.js";

const router = express.Router();

router.get("/me/:id", getCurrentUser);

// Purchased courses
router.get("/:id/courses", getPurchasedCourses);

// Wishlist courses
router.get("/:id/wishlist", getWishlistCourses);

export default router;

