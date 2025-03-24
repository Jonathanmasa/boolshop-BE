// Middleware per la gestione degli errori
function errorsHandler(err, req, res, next) {
    // Imposta lo status HTTP a 500 (Internal Server Error)
    res.status(500)
    // Restituisce la risposta in formato JSON con il messaggio di errore
    res.json({
        error: err.message, // Messaggio dell'errore catturato
    });
};

// Esporta il middleware per poterlo utilizzare nell'app principale
module.exports = errorsHandler;