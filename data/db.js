// Importa il modulo mysql2 per connettersi al database MySQL
const mysql = require('mysql2');

// Crea la connessione al database usando le variabili d'ambiente
const connection = mysql.createConnection({
    host: process.env.DB_HOST,  // Indirizzo del database (es: localhost)
    user: process.env.DB_USER, // Nome utente del database
    password: process.env.DB_PASSWORD, // Password dell'utente
    database: process.env.DB_NAME // Nome del database
});

// Effettua la connessione al database
connection.connect((err) => {
    // Se la connessione fallisce, lancia un errore
    if (err) throw err;
    // Se la connessione ha successo, mostra un messaggio di conferma
    console.log('Connected to MySQL!');
});
// Esporta la connessione per poterla usare in altri file
module.exports = connection;