const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyCertificate } = require('../controllers/publicController');

router.get('/verify-certificate/:certId', verifyCertificate);
module.exports = router;
  