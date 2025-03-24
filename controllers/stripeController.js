const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// createCheckoutSession
function createCheckoutSession(req, res) {
    const { cart, tax_id_code, note } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    // Prepara i prodotti per Stripe
    const line_items = cart.map(item => ({
        price_data: {
            currency: 'eur',
            product_data: {
                name: item.name,
            },
            unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
    }));

    stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items,
        success_url: `${process.env.FE_APP}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FE_APP}/cart`,
        shipping_address_collection: {
            allowed_countries: ['IT', 'FR', 'DE', 'ES'],
        },
        metadata: {
            cart: JSON.stringify(cart),
            tax_id_code: tax_id_code || '',
            note: note || ''
        }
    }, (err, session) => {
        if (err) {
            console.error('Stripe session error:', err);
            return res.status(500).json({ error: 'Stripe session failed' });
        }

        res.status(200).json({ id: session.id });
    });
}

module.exports = { createCheckoutSession };
