const connection = require('../data/db'); // Importa la connessione al database

function sendConfirmationEmail(toEmail, orderId, items, total) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,     // es: boolshop@gmail.com
            pass: process.env.MAIL_PASS      // usa una App Password se hai 2FA
        }
    });

    const itemsHtml = items.map(item => `
        <li>Prodotto #${item.product_id} — Quantità: ${item.quantity}</li>
    `).join('');

    const mailOptions = {
        from: '"Boolshop" <noreply@boolshop.com>',
        to: toEmail,
        subject: `Conferma Ordine #${orderId}`,
        html: `
            <h2>Grazie per il tuo ordine!</h2>
            <p>Ordine #${orderId} confermato con successo.</p>
            <ul>${itemsHtml}</ul>
            <p><strong>Totale:</strong> €${total.toFixed(2)}</p>
            <p>Ti contatteremo appena l’ordine sarà spedito.</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Errore nell’invio email:', error);
        }
        console.log('Email inviata:', info.response);
    });
}

function createOrder(req, res) {

    // Dati simulati come se venissero dal frontend
    const user = {
        name: "Mario",
        surname: "Rossi",
        email: "mario@example.com",
        address: "Via Roma 123",
        phone: "1234567890",
        postal_code: "90100",
        city: "Palermo",
        country: "Italia",
        tax_id_code: "MRARSS80A01H501X"
    };

    const items = [
        { product_id: 1, quantity: 2 },
        { product_id: 3, quantity: 1 }
    ];


    // const total = 59.90;


    // Total calcolato prendnedo i prezzi direttamente dal db

    // 🔁 Estrai gli ID dei prodotti
    const productIds = items.map(item => item.product_id);

    // 🔍 Query per ottenere i prezzi dal DB
    const placeholders = productIds.map(() => '?').join(','); // ?, ?, ?
    const sql = `SELECT id, price FROM products WHERE id IN (${placeholders})`;

    connection.query(sql, productIds, (err, results) => {
        if (err) {
            console.error('Errore nel recupero prezzi:', err);
            return res.status(500).json({ error: 'Errore nel recupero prezzi' });
        }

        // ✅ Crea una mappa ID → prezzo
        const priceMap = {};
        results.forEach(product => {
            priceMap[product.id] = parseFloat(product.price);
        });

        // 💰 Calcola il totale: somma (prezzo * quantità)
        const total = items.reduce((sum, item) => {
            const price = priceMap[item.product_id];
            return sum + (price * item.quantity);
        }, 0);

        // 📦 Query per inserire l’ordine
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
            'pending' // stato iniziale
        ];

        connection.query(orderQuery, orderValues, (err, result) => {
            if (err) {
                console.error('Errore durante la creazione dell\'ordine:', err);
                return res.status(500).json({ error: 'Errore durante la creazione dell\'ordine' });
            }

            const orderId = result.insertId;

            // 🧾 Prepara i dati per la tabella products_order
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

                res.status(201).json({
                    message: 'Ordine creato con successo',
                    orderId,
                    total: total.toFixed(2)
                });

                sendConfirmationEmail(user.email, orderId, items, total);

            });
        });
    });
}

module.exports = { createOrder };