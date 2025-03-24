const connection = require('../data/db');// Importa la connessione al database

function createOrder(req, res) {
    const { user, items, total } = req.body;

    const orderQuery = `
        INSERT INTO orders 
        (user_name, user_surname, user_email, user_address, user_phone, price, postal_code, city, country, tax_id_code, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderValues = [
        user.name,
        user.surname,
        user.email,
        user.address,
        user.phone,
        total,
        user.postal_code,
        user.city,
        user.country,
        user.tax_id_code,
        'pending' // valore iniziale dello status
    ];

    connection.query(orderQuery, orderValues, (err, result) => {
        if (err) {
            console.error('Errore durante la creazione dell\'ordine:', err);
            return res.status(500).json({ error: 'Errore durante la creazione dell\'ordine' });
        }

        const orderId = result.insertId;

        // Prepara i dati per la tabella products_order
        const itemsQuery = `
            INSERT INTO products_order (order_id, products_id, quantity)
            VALUES ?
        `;

        const itemsValues = items.map(item => [
            orderId,
            item.product_id,
            item.quantity
        ]);

        connection.query(itemsQuery, [itemsValues], (err) => {
            if (err) {
                console.error('Errore durante l\'inserimento dei prodotti:', err);
                return res.status(500).json({ error: 'Errore durante l\'inserimento dei prodotti' });
            }

            res.status(201).json({ message: 'Ordine creato con successo', orderId });
        });
    });
}


module.exports = { createOrder };
