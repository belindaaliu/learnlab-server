const multer = require("multer");
const path = require("path");

// Use memory storage (same as your photo upload)
const storage = multer.memoryStorage();

const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOC, DOCX files are allowed"), false);
    }
    cb(null, true);
  },
});

module.exports = uploadResume;