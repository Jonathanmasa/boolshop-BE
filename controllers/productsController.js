const connection = require('../data/db');

// definiamo le logiche

// index
function index(req, res) {

    const sql = 'SELECT * FROM products';


    // lancia query al db per ottenere dati products
    connection.query(sql, (err, result) => {
        if (err) {
            console.error('Database query failed:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        // mappa i risultati e aggiungi il percorso dell'immagine
        // const movies = result.map(movie => {
        //     return {
        //         ...movie,
        //         image: req.imagePath + movie.image
        //     }
        // })

        // restituisci il movie in formato json
        res.json(result);
    });
}


// show
function show(req, res) {
    const { id, category } = req.params;

    const productQuery = 'SELECT * FROM products WHERE id = ?';

    // lancia query al db per ottenere dati products
    connection.query(productQuery, [id], (err, productResult) => {
        if (err) return res.status(500).json({ error: 'Database query failed (product)' });
        if (productResult.length === 0) return res.status(404).json({ error: 'Product not found' });

        const product = productResult[0];

        // Verifica che la categoria richiesta corrisponda a quella del prodotto
        if (product.category !== category) {
            return res.status(400).json({ error: 'Category does not match product' });
        }

        // Determina quale tabella interrogare in base alla categoria
        let detailQuery = '';
        switch (category) {
            case 'cards':
                detailQuery = 'SELECT * FROM card_details WHERE product_id = ?';
                break;
            case 'figures':
                detailQuery = 'SELECT * FROM figure_details WHERE product_id = ?';
                break;
            case 'manga':
                detailQuery = 'SELECT * FROM manga_details WHERE product_id = ?';
                break;
            default:
                return res.status(400).json({ error: 'Invalid category' });
        }


        // Seconda query per i dettagli specifici
        connection.query(detailQuery, [id], (err, detailResult) => {
            if (err) return res.status(500).json({ error: 'Database query failed (details)' });

            // Aggiungi i dettagli come oggetto "details"
            product.details = detailResult[0] || {};

            res.json(product);
        });
    });
}

// esporta le funzioni
module.exports = { index, show, };



