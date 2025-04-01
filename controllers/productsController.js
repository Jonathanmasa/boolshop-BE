const connection = require('../data/db');// Importa la connessione al database



// definiamo le logiche

// index (mostra tutti i prodotti dalla tabella products)
function index(req, res) {

    // Query per ottenere tutti i prodotti con eventuale sconto
    const sql = `
    SELECT p.*, d.amount
    FROM products p
    LEFT JOIN discount d ON p.id = d.product_id
  `;


    // lancia query al db per ottenere dati products
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Database query failed:', err);// Log dell'errore
            return res.status(500).json({ error: 'Database query failed' });// Risposta di errore
        }

        // mappa i risultati e aggiungi il percorso dell'immagine
        const products = result.map(product => ({
            ...product,
            discounted_price: product.amount
                ? product.price - (product.price * product.amount / 100)
                : null,
            image_url: req.imagePath + product.image_url
        }));

        // restituisci il product in formato json
        res.json(products);
    });
}



// show by category (mostra i prodotti per categoria dalla tabella products)
function getByCategory(req, res) {
    const { category } = req.params;

    // ✅ Verifica che la categoria sia una di quelle ammesse
    const validCategories = ['card', 'manga', 'figure'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Categoria non valida' });
    }

    // Query per ottenere i prodotti della categoria specifica con eventuale sconto
    const sql = `
    SELECT p.*, d.amount
    FROM products p
    LEFT JOIN discount d ON p.id = d.product_id
    WHERE p.category = ?
  `;

    connection.query(sql, [category], (err, result) => {
        if (err) {
            console.error('Errore nella query:', err);
            return res.status(500).json({ error: 'Errore nella query' });
        }

        const products = result.map(product => ({
            ...product,
            discounted_price: product.amount
                ? product.price - (product.price * product.amount / 100)
                : null,
            image_url: req.imagePath + product.image_url
        }));


        res.json(products);
    });
}




// show active on sale products (mostra i prodotti in saldo dalla tabella products facendo join di products e discount e usando il valore di amount)
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



// show new arrivals products (mostra i nuovi arrivi dalla tabella products usando il valore di release_date)
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



// search products (mostra i prodotti dalla tabella products in base alla query di ricerca per nome, categoria, brand)
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
        'price_asc': 'p.price ASC',
        'price_desc': 'p.price DESC',
        'name_asc': 'p.name ASC',
        'name_desc': 'p.name DESC',
        'date_asc': 'p.release_date ASC',
        'date_desc': 'p.release_date DESC'
    };

    // Ottieni l'ordinamento corretto
    const orderBy = sortMap[sortOption] || 'p.name ASC';  // Se 'sort' non è valido, usa 'name_asc'

    // Log della query con l'ordinamento applicato
    console.log(`Esecuzione query con ordinamento: ${orderBy}`);  // Questo mostrerà l'ordinamento che verrà applicato

    // Query SQL completa
    const sql = `
    SELECT p.*, d.amount
    FROM products p
    LEFT JOIN discount d ON p.id = d.product_id
    WHERE p.name LIKE ? OR p.category LIKE ? OR p.brand LIKE ?
    ORDER BY ${orderBy}
`;

    connection.query(sql, [likeTerm, likeTerm, likeTerm], (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            return res.status(500).json({ error: 'Errore nella ricerca' });
        }

        const products = results.map(product => ({
            ...product,
            discounted_price: product.amount
                ? product.price - (product.price * product.amount / 100)
                : null,
            image_url: req.imagePath + product.image_url // Aggiunge il percorso immagine
        }));

        res.json(products);
    });
}

// ✅ Funzione corretta con logica AND combinata tra "query" e "type"
function searchFiltred(req, res) {
    console.log('Parametri della richiesta:', req.query);

    const searchTerm = req.query.query || '';
    const searchType = req.query.type || '';
    const sortOption = req.query.sort || 'name_asc';

    const sortMap = {
        'price_asc': 'p.price ASC',
        'price_desc': 'p.price DESC',
        'name_asc': 'p.name ASC',
        'name_desc': 'p.name DESC',
        'date_asc': 'p.release_date ASC',
        'date_desc': 'p.release_date DESC'
    };

    const orderBy = sortMap[sortOption] || 'name ASC';

    let sql = `SELECT p.*, d.amount
        FROM products p
        LEFT JOIN discount d ON p.id = d.product_id
        WHERE 1=1`;

    const sqlParams = [];

    if (searchType) {
        sql += ` AND p.category = ?`;
        sqlParams.push(searchType);
    }

    if (searchTerm) {
        const likeTerm = `%${searchTerm}%`;
        sql += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)`;
        sqlParams.push(likeTerm, likeTerm, likeTerm);
    }

    sql += ` ORDER BY ${orderBy}`;

    console.log('Query finale:', sql);
    console.log('Parametri:', sqlParams);

    connection.query(sql, sqlParams, (err, results) => {
        if (err) {
            console.error('Errore durante la ricerca:', err);
            return res.status(500).json({ error: 'Errore nella ricerca' });
        }

        const products = results.map(product => ({
            ...product,
            discounted_price: product.amount
                ? product.price - (product.price * product.amount / 100)
                : null,
            image_url: req.imagePath + product.image_url
        }));

        res.json(products);
    });
}




// show by category AND id di un singolo prodotto (mostra i prodotti per categoria e id unendo i dati della tabella products e products_details)
function show(req, res) {
    const { id, category } = req.params;// Estrae id e categoria dai parametri della richiesta

    // Query per ottenere il prodotto specifico con eventuale sconto
    const productQuery = `
    SELECT p.*, d.amount
    FROM products p
    LEFT JOIN discount d ON p.id = d.product_id
    WHERE p.id = ?
  `;

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
            case 'figure':
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
module.exports = { index, show, search, searchFiltred, getByCategory, getOnSaleProducts, getNewArrivals };



