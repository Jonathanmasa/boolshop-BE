const express = require('express');
const router = express.Router(); // Inizializza un nuovo router Express

//  importiamo il middleware di gestione img
const upload = require('../middlewares/multer');

// Importa il controller dei prodotti che contiene la logica delle rotte
const productsController = require('../controllers/productsController');


// index
router.get('/', productsController.index);


// show by category
router.get('/category/:category', productsController.getByCategory);


// show
router.get('/:category/:id', productsController.show);





// show active discounted
router.get('/on-sale', productsController.getOnSaleProducts);


// show new arrivals
router.get('/new-arrivals', productsController.getNewArrivals);




// search
router.get('/search', productsController.search);


// esportiamo il modulo del router
module.exports = router;