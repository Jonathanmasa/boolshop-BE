const express = require('express');
const app = express();
const port = process.env.PORT;

// importa cors
const cors = require('cors');

// importa router products
const productsRouter = require('./routers/products');
const ordersRouter = require('./routers/orders');
const stripeRouter = require('./routers/stripe');

// importa middlewares
const notFound = require('./middlewares/errorHandler');
const handleErrors = require('./middlewares/errorHandler');
const imagePath = require('./middlewares/imagePath');



app.use(cors({ origin: process.env.FE_APP }));
app.use(imagePath);
app.use(express.static('public'));

// Stripe
app.use('/api/stripe', stripeRouter);

// Parser normale
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Altre rotte
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.get('/api', (req, res) => {
    res.send("Ciao sono la rotta Home");
});


// rotta test stripe
app.get('/success', (req, res) => {
    res.send('<h1>Pagamento completato con successo!</h1>');
});

app.use(handleErrors);
app.use(notFound);

app.listen(port, () => {
    console.log(`Server attivo sulla porta ${port}`);
});
