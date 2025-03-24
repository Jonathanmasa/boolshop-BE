require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT;

const cors = require('cors');
const stripeRouter = require('./routers/stripe');
const productsRouter = require('./routers/products');
const notFound = require('./middlewares/errorHandler');
const handleErrors = require('./middlewares/errorHandler');
const imagePath = require('./middlewares/imagePath');

// ⚠️ AGGIUNGI QUESTO:
const { handleStripeWebhook } = require('./controllers/stripeWebHookController');

app.use(cors({ origin: process.env.FE_APP }));
app.use(imagePath);
app.use(express.static('public'));

// ✅ CORRETTO: webhook con raw + handler diretto
app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
);

// Parser normale
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Altre rotte
app.use('/api/products', productsRouter);
app.use('/api/stripe', stripeRouter);

app.get('/api', (req, res) => {
    res.send("Ciao sono la rotta Home");
});

app.use(handleErrors);
app.use(notFound);

app.listen(port, () => {
    console.log(`Server attivo sulla porta ${port}`);
});
