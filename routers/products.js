const express = require('express');
const router = express.Router(); // Inizializza un nuovo router Express

//  importiamo il middleware di gestione img
const upload = require('../middlewares/multer');

// Importa il controller dei prodotti che contiene la logica delle rotte
const productsController = require('../controllers/productsController');


// index (mostra tutti i prodotti dalla tabella products)
router.get('/', productsController.index);


// show by category (mostra i prodotti per categoria dalla tabella products)
router.get('/category/:category', productsController.getByCategory);


// show by category AND id di un singolo prodotto (mostra i prodotti per categoria e id unendo i dati della tabella products e products_details)
router.get('/:category/:id', productsController.show);





// show active on sale products (mostra i prodotti in saldo dalla tabella products facendo join di products e discount e usando il valore di amount)
router.get('/on-sale', productsController.getOnSaleProducts);


// show new arrivals products (mostra i nuovi arrivi dalla tabella products usando il valore di release_date)
router.get('/new-arrivals', productsController.getNewArrivals);



// search products (mostra i prodotti dalla tabella products in base alla query di ricerca per nome, categoria, brand)
router.get('/search', productsController.search);

router.get('/search_filtred', productsController.searchFiltred);


// esportiamo il modulo del router
module.exports = router;