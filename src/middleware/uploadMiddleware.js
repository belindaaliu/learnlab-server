// middleware/upload.js
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Increased to 100MB for audio
  fileFilter: (req, file, cb) => {
    // Allow both images and audio
    const allowedImages = ["image/jpeg", "image/jpg", "image/png"];
    const allowedAudio = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4"];
    
    if (allowedImages.includes(file.mimetype) || allowedAudio.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpg, jpeg, png) and audio files (mp3, wav) are allowed"));
    }
  },
});

module.exports = upload;