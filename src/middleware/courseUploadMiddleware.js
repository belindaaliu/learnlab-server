const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../lib/s3'); 
const path = require('path');

// Allowed formats
const allowedMimeTypes = [
  "image/jpeg", "image/jpg", "image/png", "image/gif",
  "video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed!'), false);
  }
};

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `courses/${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: fileFilter
});

module.exports = upload;