// const multer = require("multer");
// const multerS3 = require("multer-s3");
// const s3 = require("../lib/s3");
// const crypto = require("crypto");

// const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

// const upload = multer({
//   storage: multerS3({
//     s3,
//     bucket: process.env.AWS_BUCKET_NAME,
//     acl: "public-read",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: function (req, file, cb) {
//       const ext = file.originalname.split(".").pop();
//       const randomName = crypto.randomBytes(16).toString("hex");
//       cb(null, `profile_photos/${randomName}.${ext}`);
//     },
//   }),
//   limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(new Error("Only .jpg, .jpeg, .png allowed"));
//     }
//     cb(null, true);
//   },
// });

// module.exports = upload;


const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only .jpg, .jpeg, .png allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;
