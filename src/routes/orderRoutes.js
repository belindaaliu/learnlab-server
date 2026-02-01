const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

router.post('/webhook', stripeWebhook);

module.exports = router;