const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook } = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Route to initialize the payment
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

// Stripe Webhook (Use this for production to confirm payments even if user closes the tab)
// Note: Webhook needs the raw body to verify signature
router.post('/webhook', stripeWebhook);

module.exports = router;