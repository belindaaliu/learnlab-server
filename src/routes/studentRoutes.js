import express from "express";
import { getCurrentUser } from "../controllers/studentController.js";

const router = express.Router();

router.get("/me/:id", getCurrentUser);

export default router;
