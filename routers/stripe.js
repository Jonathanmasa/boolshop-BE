// Importa il modulo express
const express = require('express');
// Crea un router utilizzando express
const router = express.Router();
// Importa il controller di Stripe
const stripeController = require('../controllers/stripeController');



// 1. Crea una sessione di checkout per iniziare il processo di pagamento con Stripe.
// Invia i dati dell'utente e del carrello a Stripe, e riceve un link per il pagamento
router.post('/create-checkout-session', stripeController.createCheckoutSession);



// 2. Gestisce gli eventi inviati da Stripe al tuo server tramite webhook
// Riceve conferma da Stripe quando un pagamento è completato, e salva l’ordine nel DB
router.post('/webhook', express.raw({ type: 'application/json' }), stripeController.handleStripeWebhook);



module.exports = router;