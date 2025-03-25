const connection = require('../data/db');// Importa la connessione al database

// definiamo le logiche

// index
function index(req, res) {

    const sql = 'SELECT * FROM products';// Query per ottenere tutti i prodotti


    // lancia query al db per ottenere dati products
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Database query failed:', err);// Log dell'errore
            return res.status(500).json({ error: 'Database query failed' });// Risposta di errore
        }

        // mappa i risultati e aggiungi il percorso dell'immagine
        const products = result.map(product => {
            return {
                ...product,
                image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
            }
        })

        // restituisci il product in formato json
        res.json(products);
    });
}


// funzione per ottenere un singolo prodotto con dettagli specifici
function show(req, res) {
    const { id, category } = req.params;// Estrae id e categoria dai parametri della richiesta

    const productQuery = 'SELECT * FROM products WHERE id = ?';// Query per ottenere il prodotto

    // lancia query al db per ottenere dati products
    connection.query(productQuery, [id], (err, productResult) => {
        if (err) return res.status(500).json({ error: 'Database query failed (product)' });
        if (productResult.length === 0) return res.status(404).json({ error: 'Product not found' });// Prodotto non trovato

        const product = productResult[0];

        // Verifica che la categoria richiesta corrisponda a quella del prodotto
        if (product.category !== category) {
            return res.status(400).json({ error: 'Category does not match product' });// Categoria non corrispondente
        }

        // Determina quale tabella interrogare in base alla categoria
        let detailQuery = '';
        switch (category) {
            case 'card':
                detailQuery = 'SELECT * FROM card_details WHERE product_id = ?';
                break;
            case 'figures':
                detailQuery = 'SELECT * FROM figure_details WHERE product_id = ?';
                break;
            case 'manga':
                detailQuery = 'SELECT * FROM manga_details WHERE product_id = ?';
                break;
            default:
                return res.status(400).json({ error: 'Invalid category' }); // Categoria non valida
        }


        // Seconda query per i dettagli specifici
        connection.query(detailQuery, [id], (err, detailResult) => {
            if (err) return res.status(500).json({ error: 'Database query failed (details)' }); // Errore nei dettagli

            // Aggiungi i dettagli come oggetto "details"
            product.details = detailResult[0] || {};
            // Restituisce il prodotto con i dettagli
            res.json(product);
        });
    });
}

// funzione per la ricerca da searchbar
function search(req, res) {
    const searchTerm = req.query.query;

    if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({ error: 'Nessun termine di ricerca fornito' });
    }

    // Query: cerca per nome o descrizione
    const sql = `
        SELECT * FROM products
        WHERE name LIKE ?
    `;

    const likeTerm = `%${searchTerm}%`;

    connection.query(sql, [likeTerm], (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            return res.status(500).json({ error: 'Errore nella ricerca' });
        }

        // Aggiungi il percorso immagine se serve
        const products = results.map(product => ({
            ...product,
            image: req.imagePath + product.image
        }));

        res.json(products);
    });
}


// esporta le funzioni 
module.exports = { index, show, search };



