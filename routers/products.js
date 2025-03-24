const express = require('express');
const router = express.Router();

//  importiamo il middleware di gestione img
const upload = require('../middlewares/multer');

const productsController = require('../controllers/productsController');


// index
router.get('/', productsController.index);


// show
router.get('/:category/:id', productsController.show);




// esportiamo il modulo del router
module.exports = router;