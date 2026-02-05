const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get all conversations
router.get("/conversations", messageController.getConversations);

// Get messages with a specific user
router.get("/:otherUserId", messageController.getMessages);

// Send a message
router.post("/send", messageController.sendMessage);

// Search for users
router.get("/search/users", messageController.searchUsers);

// Get unread count
router.get("/unread/count", messageController.getUnreadCount);

module.exports = router;