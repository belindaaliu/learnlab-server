const express = require('express');
const router = express.Router();
const { createPaymentIntent, stripeWebhook } = require('../controllers/orderController');
const invoiceController = require('../controllers/invoiceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', authMiddleware, createPaymentIntent);
router.get('/invoice/:paymentId', authMiddleware, invoiceController.generateInvoice);

router.post('/webhook', stripeWebhook);

module.exports = router;