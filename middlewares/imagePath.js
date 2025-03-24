// Middleware per impostare il percorso assoluto delle immagini dei prodotti
function setImagePath(req, res, next) {
    // creaimo il path assoluto della img
    req.imagePath = `${req.protocol}://${req.get('host')}/img/products/`;
    // Passa il controllo al middleware successivo
    next()
}

// Esporta il middleware per poterlo usare nell'app principale
module.exports = setImagePath;