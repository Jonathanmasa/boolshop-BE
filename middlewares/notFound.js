// Middleware per gestire le richieste verso rotte non esistenti
function notFound(req, res, next) {
    // Imposta lo status HTTP a 404 (Not Found)
    res.status(404)
    // Restituisce la risposta in formato JSON con un messaggio personalizzato
    res.json({
        error: "Not Found",  // Tipo di errore
        message: "Pagina non Trovata"    // Messaggio più descrittivo
    });
};
// Esporta il middleware per poterlo utilizzare nell'app principale
module.exports = notFound;