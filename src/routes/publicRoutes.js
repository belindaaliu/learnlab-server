const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

const { 
  verifyCertificate, 
  certificateImage, 
  getHomeStats 
} = require('../controllers/publicController');

const certificateController = require("../controllers/certificateController");

router.get('/stats', getHomeStats); 

router.get('/verify-certificate/:certId', verifyCertificate);
router.get('/certificate-image/:certId.png', certificateImage);
router.get('/certificates/:certId/download', certificateController.downloadPublicCertificate);

module.exports = router;