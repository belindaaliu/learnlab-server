const express = require('express');
const router = express.Router();

const courseUpload = require('../middleware/courseUploadMiddleware');

const uploadController = require('../controllers/upload.controller');

const { authMiddleware } = require('../middleware/authMiddleware');


router.post('/', authMiddleware, courseUpload.single('file'), uploadController.uploadFile);

module.exports = router;