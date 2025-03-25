const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const { createOrderFromStripe } = require('./ordersController');


async function handleStripeWebhook(req, res) {


    console.log('📩 Webhook ricevuto da Stripe:', req.body);


    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestione evento
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;


        console.log('✅ Sessione completata, creo ordine per:', session.metadata.user_email);


        // Qui potresti recuperare i dati dal metadata o da un DB temporaneo
        // E poi salvare l’ordine nel DB
        await createOrderFromStripe(session);
    }

    res.status(200).json({ received: true });
}


async function createCheckoutSession(req, res) {
    // Qui stai simulando i dati che normalmente arriveranno dal FE
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

    const items = [
        { product_id: 7, quantity: 1, name: "Naruto Card Pack", price: 2000 },
        { product_id: 5, quantity: 1, name: "Dragon Ball Set", price: 1500 }
    ];



    // Calcolo totale prodotti
    const subtotal = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    // Calcola spese spedizione: 10€ sotto 50€, gratuita sopra
    const shippingCost = subtotal >= 5000 ? 0 : 1000;


    console.log("💸 Subtotal:", subtotal); // in euro
    console.log("🚚 Spese di spedizione (euro):", shippingCost);
    console.log("🚚 Spese di spedizione (centesimi per Stripe):", shippingCost);




    // Line items dei prodotti
    const line_items = items.map(item => ({
        price_data: {
            currency: 'eur',
            product_data: {
                name: item.name,
            },
            unit_amount: item.price
        },
        quantity: item.quantity
    }));

    // 📦 Line item per le spese di spedizione (se presenti)
    if (shippingCost > 0) {
        line_items.push({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Spese di spedizione'
                },
                unit_amount: shippingCost
            },
            quantity: 1
        });
    }





    // 🔁 Crea sessione
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items,
        success_url: `${process.env.FE_APP}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FE_APP}/cart`,
        shipping_address_collection: {
            allowed_countries: ['IT', 'FR', 'DE', 'ES'],
        },
        metadata: {
            user_name: user.name,
            user_surname: user.surname,
            user_email: user.email,
            user_address: user.address,
            user_phone: user.phone,
            postal_code: user.postal_code,
            city: user.city,
            country: user.country,
            tax_id_code: user.tax_id_code,
            shipping_cost: shippingCost.toString(),
            items: JSON.stringify(items.map(({ product_id, quantity, price }) => ({
                product_id,
                quantity,
                price: price / 100
            })))
        }
    });

    res.json({ url: session.url });
}

module.exports = { createCheckoutSession, handleStripeWebhook };