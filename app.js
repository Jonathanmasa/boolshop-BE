// importa il modulo express
const express = require('express')
// crea l'istanza dell'applicazione express
const app = express()
// definisci la porta da utilizzare
const port = process.env.PORT

// importa cors
const cors = require('cors');

// importiamo il router
const productsRouter = require('./routers/products');

//importa middleware notFound
const notFound = require('./middlewares/errorHandler')
//importa middleware handleErrors
const handleErrors = require('./middlewares/errorHandler')
// importiamo il middleware di gestione path imgs
const imagePath = require('./middlewares/imagePath');

//usa cors
app.use(cors({ origin: process.env.FE_APP }));


// registro il middleware di path imgs
app.use(imagePath);


// definisci l'uso di una cartella per i file statici
app.use(express.static('public'));

// definisci l'uso del body-parser express per "application/JSON"
app.use(express.json());


// definiamo la rotta home
app.get('/api', (req, res) => {
    res.send("Ciao sono la rotta Home");
})


// utilizziamo la rotta dei products andando a definire la parte iniziale delle rotte
app.use("/api/products", productsRouter)


// utilizza middleware handleErrors
app.use(handleErrors);
// utilizza middlewares notFOund
app.use(notFound);


// avvia il server e mettilo in ascolto sulla porta selezionata
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})