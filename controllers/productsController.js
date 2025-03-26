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



// funzione per ottenere i prodotti per categoria
function getByCategory(req, res) {
    const { category } = req.params;

    const sql = 'SELECT * FROM products WHERE category = ?';

    connection.query(sql, [category], (err, result) => {
        if (err) {
            console.error('Errore nella query:', err);
            return res.status(500).json({ error: 'Errore nella query' });
        }

        const products = result.map(product => ({
            ...product,
            image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
        }));

        res.json(products);
    });
}




// funzione per ottenere i prodotti in sconto
function getOnSaleProducts(req, res) {
    const sql = `
      SELECT products.*, discount.amount
      FROM products
      JOIN discount ON products.id = discount.product_id
      WHERE discount.date_start <= CURDATE()
      AND discount.date_end >= CURDATE()
    `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Errore query sconti:', err);
            return res.status(500).json({ error: 'Errore database' });
        }

        const products = result.map(product => ({
            ...product,
            discounted_price: product.price - (product.price * product.amount / 100),
            image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
        }));

        res.json(products);
    });
}



// funzione per ottenere i nuovi arrivi
function getNewArrivals(req, res) {
    const sql = `
    SELECT * 
    FROM products 
    WHERE release_date >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
  `;

    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Errore query nuovi prodotti:', err);
            return res.status(500).json({ error: 'Errore database' });
        }

        const products = result.map(product => ({
            ...product,
            image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
        }));

        res.json(products);
    });
}



// funzione per la ricerca avanzata
function search(req, res) {
    // Log dei parametri della richiesta
    console.log('Parametri della richiesta:', req.query);  // Questo mostrerà tutti i parametri ricevuti

    const searchTerm = req.query.query || '';  // Ottieni il termine di ricerca
    const sortOption = req.query.sort || 'name_asc';  // Imposta l'ordinamento di default

    const likeTerm = `%${searchTerm}%`;

    // Log per verificare il parametro di ordinamento
    console.log('Parametro di ordinamento:', sortOption);  // Questo ti dirà quale valore è stato passato per il parametro "sort"

    // Mappa le opzioni di ordinamento
    const sortMap = {
        'price_asc': 'price ASC',
        'price_desc': 'price DESC',
        'name_asc': 'name ASC',
        'name_desc': 'name DESC',
        'date_asc': 'release_date ASC',
        'date_desc': 'release_date DESC'
    };

    // Ottieni l'ordinamento corretto
    const orderBy = sortMap[sortOption] || 'name ASC';  // Se 'sort' non è valido, usa 'name_asc'

    // Log della query con l'ordinamento applicato
    console.log(`Esecuzione query con ordinamento: ${orderBy}`);  // Questo mostrerà l'ordinamento che verrà applicato

    // Query SQL completa
    const sql = `
        SELECT * FROM products
        WHERE name LIKE ? OR category LIKE ? OR brand LIKE ?
        ORDER BY ${orderBy}
    `;

    connection.query(sql, [likeTerm, likeTerm, likeTerm], (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            return res.status(500).json({ error: 'Errore nella ricerca' });
        }

        const products = results.map(product => ({
            ...product,
            image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
        }));

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
            product.image_url = req.imagePath + product.image_url; // Aggiunge il percorso immagine
            // Restituisce il prodotto con i dettagli
            res.json(product);
        });
    });
}


// esporta le funzioni 
module.exports = { index, show, search, getByCategory, getOnSaleProducts, getNewArrivals };



