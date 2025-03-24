const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

router.post('/create-checkout-session', stripeController.createCheckoutSession);

// POST per ricevere il webhook (raw body!)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhookController.handleStripeWebhook);



module.exports = router;
