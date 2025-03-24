const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connection = require('../data/db');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// webhook
function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const customerEmail = session.customer_details.email;
        const shipping = session.shipping;
        const cart = JSON.parse(session.metadata.cart);
        const total = session.amount_total / 100;

        const user = {
            name: session.customer_details.name,
            email: customerEmail,
            address: shipping.address.line1,
            phone: shipping.phone || '',
            city: shipping.address.city,
            postal_code: shipping.address.postal_code,
            country: shipping.address.country,
            tax_id_code: session.metadata.tax_id_code || null,
            note: session.metadata.note || null
        };



        console.log("📩 Webhook ricevuto:", event.type);
        console.log("🧾 Metadata:", session.metadata);
        console.log("👤 Utente:", session.customer_details);




        const orderQuery = `
            INSERT INTO orders 
            (user_name, user_email, user_address, user_phone, price, city, postal_code, country, status, tax_id_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const orderValues = [
            user.name,
            user.email,
            user.address,
            user.phone,
            total,
            user.city,
            user.postal_code,
            user.country,
            'paid',
            user.tax_id_code
        ];

        connection.query(orderQuery, orderValues, (err, result) => {
            if (err) {
                console.error('Failed to insert order:', err);
                return res.status(500).end();
            }

            const orderId = result.insertId;

            const productValues = cart.map(item => [
                item.product_id,
                orderId,
                item.quantity,
                item.price
            ]);

            const itemsQuery = `
                INSERT INTO products_order (products_id, order_id, quantity, price)
                VALUES ?
            `;

            connection.query(itemsQuery, [productValues], (err2) => {
                if (err2) {
                    console.error('Failed to insert products_order:', err2);
                    return res.status(500).end();
                }

                console.log('✅ Order and items saved to DB');
                res.status(200).end();
            });
        });
    } else {
        res.status(200).end(); // altri eventi, ignorali
    }
}



module.exports = { handleStripeWebhook };
