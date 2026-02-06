const express = require("express");
const router = express.Router();
const subController = require("../controllers/subscriptionController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/overview", authMiddleware, subController.getOverview);
router.get("/plans", subController.getPlans);
router.get("/history", authMiddleware, subController.getHistory);
router.post("/subscribe", authMiddleware, subController.subscribe);
router.post('/cancel', authMiddleware, subController.cancelSubscription);

module.exports = router;