const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');
const stripeWebhookController = require('../controllers/stripeWebHookController');

// POST per creare la sessione di pagamento
router.post('/create-checkout-session', stripeController.createCheckoutSession);

module.exports = router;
