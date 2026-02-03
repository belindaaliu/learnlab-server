const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyCertificate, certificateImage } = require('../controllers/publicController');

router.get('/verify-certificate/:certId', verifyCertificate);
router.get('/certificate-image/:certId.png', certificateImage);


module.exports = router;
  