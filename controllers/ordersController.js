const connection = require('../data/db'); // Importa la connessione al database
const nodemailer = require('nodemailer');


// funzione per inviare email di conferma ordine
function sendConfirmationEmail(toEmail, orderId, items, total) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    const itemsHtml = items.map(item => `
        <li>Prodotto #${item.product_id} — Quantità: ${item.quantity}</li>
    `).join('');

    const mailOptions = {
        from: '"Eggrocket" <noreply@eggrocket.com>',
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


// funzione per creare un ordine nel db senza Stripe
async function createOrder(req, res) {
    // Simula i dati che normalmente arriverebbero dal frontend
    const user = {
        name: "Luca",
        surname: "Telese",
        email: "ducciok@gmail.com",
        address: "Via Roma 123",
        phone: "1234567890",
        postal_code: "90100",
        city: "Palermo",
        country: "Italia",
        tax_id_code: "MRARSS80A01H501X"
    };

    // Simula i prodotti nel carrello (prezzi in centesimi)
    const items = [
        { product_id: 7, quantity: 1, name: "Naruto Card Pack", price: 2000 },
        { product_id: 5, quantity: 1, name: "Dragon Ball Set", price: 1500 }
    ];

    // Calcola il subtotal degli articoli nel carrello
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = Number(item.price) * Number(item.quantity);  // Assicurati che i valori siano numerici
        return sum + itemTotal;
    }, 0);

    // Calcola le spese di spedizione (simulato)
    const shippingCost = subtotal >= 5000 ? 0 : 1000;  // 10€ sotto 50€, gratuita sopra

    const total = subtotal + shippingCost;

    // Esegui l'inserimento dell'ordine nel database
    const orderQuery = `
        INSERT INTO orders 
        (user_name, user_surname, user_email, user_address, user_phone, price, shipping_cost, postal_code, city, country, tax_id_code, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderValues = [
        user.name,
        user.surname,
        user.email,
        user.address,
        user.phone,
        subtotal,
        shippingCost,
        user.postal_code,
        user.city,
        user.country,
        user.tax_id_code,
        'unpaid'  // Stato dell'ordine "pending"
    ];

    // Salva l'ordine
    connection.query(orderQuery, orderValues, (err, result) => {
        if (err) {
            console.error('❌ Errore salvataggio ordine:', err.sqlMessage || err);
            return res.status(500).json({ message: 'Errore nel salvataggio dell\'ordine' });
        }

        const orderId = result.insertId;

        // Salva gli articoli nell'ordine
        const itemsValues = items.map(item => [
            orderId,
            item.product_id || item.id,  // fallback se `product_id` non esiste
            item.quantity
        ]);

        const itemsQuery = `
            INSERT INTO products_order (order_id, products_id, quantity)
            VALUES ?
        `;

        connection.query(itemsQuery, [itemsValues], (err) => {
            if (err) {
                console.error('❌ Errore inserimento prodotti:', err.sqlMessage || err);
                return res.status(500).json({ message: 'Errore nel salvataggio degli articoli dell\'ordine' });
            }

            // Invia la conferma dell'ordine via email
            sendConfirmationEmail(user.email, orderId, items, total);
            console.log(`✅ Ordine #${orderId} salvato con successo.`);

            // Rispondi con un messaggio di successo
            res.status(201).json({
                message: `Ordine #${orderId} creato con successo.`,
                orderId
            });
        });
    });
}


// funzione per creare un ordine nel db a partire da una sessione Stripe
async function createOrderFromStripe(session) {
    const user = {
        name: session.metadata.user_name,
        surname: session.metadata.user_surname,
        email: session.metadata.user_email,
        address: session.metadata.user_address,
        phone: session.metadata.user_phone,
        postal_code: session.metadata.postal_code,
        city: session.metadata.city,
        country: session.metadata.country,
        tax_id_code: session.metadata.tax_id_code
    };

    const items = JSON.parse(session.metadata.items);
    const shippingCost = Number(session.metadata.shipping_cost) / 100;

    const productIds = items.map(item => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const sql = `SELECT id, price FROM products WHERE id IN (${placeholders})`;

    connection.query(sql, productIds, (err, results) => {
        if (err) return console.error('Errore recupero prezzi:', err);

        const priceMap = {};
        results.forEach(product => {
            priceMap[product.id] = parseFloat(product.price);
        });

        const subtotal = items.reduce((sum, item) => {
            const price = priceMap[item.product_id];
            return sum + (price * item.quantity);
        }, 0);

        const total = subtotal + shippingCost;

        const orderQuery = `
            INSERT INTO orders 
            (user_name, user_surname, user_email, user_address, user_phone, price, shipping_cost, postal_code, city, country, tax_id_code, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const orderValues = [
            user.name,
            user.surname,
            user.email,
            user.address,
            user.phone,
            subtotal,
            shippingCost,
            user.postal_code,
            user.city,
            user.country,
            user.tax_id_code,
            'paid' // Perché Stripe ha confermato il pagamento
        ];

        connection.query(orderQuery, orderValues, (err, result) => {
            if (err) return console.error('Errore salvataggio ordine:', err);

            const orderId = result.insertId;
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
                if (err) return console.error('Errore inserimento prodotti:', err);

                sendConfirmationEmail(user.email, orderId, items, total);
                console.log(`Ordine #${orderId} salvato con successo.`);


                console.log(`✅ Ordine #${orderId} salvato e conferma email inviata.`);

            });
        });
    });
}

module.exports = {
    createOrder,
    createOrderFromStripe
};