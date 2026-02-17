const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const videoNoteController = require("../controllers/videoNoteController");

// Generate notes for a video
router.post("/generate", authMiddleware, videoNoteController.generateNotes);

// Get notes for a specific video
router.get("/video/:contentId", authMiddleware, videoNoteController.getNotes);

// Get all notes for current user
router.get("/my-notes", authMiddleware, videoNoteController.getUserNotes);

// Update notes
router.put("/:noteId", authMiddleware, videoNoteController.updateNotes);

// Delete notes
router.delete("/:noteId", authMiddleware, videoNoteController.deleteNotes);

// Add/update transcript
router.post("/transcript/:contentId", authMiddleware, videoNoteController.addTranscript);

// Get transcript
router.get("/transcript/:contentId", authMiddleware, videoNoteController.getTranscript);

// Auto-transcribe and generate notes (ONE CLICK)
router.post("/auto-generate", authMiddleware, videoNoteController.autoTranscribeAndGenerate);

// Check transcription status
router.get("/status/:contentId", authMiddleware, videoNoteController.checkStatus);


module.exports = router;