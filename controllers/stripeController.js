// Import Stripe e inizializza con la chiave segreta dal .env
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// Chiave per verificare la firma del webhook
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;


// Importa la funzione che salva l’ordine nel database
const { createOrderFromStripe } = require('./ordersController');


//  1. Crea una sessione di checkout per iniziare il processo di pagamento con Stripe
async function createCheckoutSession(req, res) {
    // simula i dati che normalmente arriveranno dal FE
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

    // simula i prodotti nel carrello (prezzi in centesimi)
    const items = [
        { product_id: 7, quantity: 1, name: "Naruto Card Pack", price: 2000 },
        { product_id: 5, quantity: 1, name: "Dragon Ball Set", price: 1500 }
    ];


    // Calcola il subtotal degli articoli nel carrello
    const subtotal = items.reduce(
        // Funzione di callback che viene eseguita su ogni elemento dell'array
        (acc, item) => {
            // Moltiplica il prezzo dell'articolo (item.price) per la quantità (item.quantity)
            // e somma il risultato all'accumulatore (acc), che tiene traccia del totale
            return acc + item.price * item.quantity;
        },
        // Il valore iniziale dell'accumulatore (acc) è 0
        0
    );

    // Calcola spese spedizione: 10€ sotto 50€, gratuita sopra
    const shippingCost = subtotal >= 5000 ? 0 : 1000;


    console.log("💸 Subtotal:", subtotal); // in euro
    console.log("🚚 Spese di spedizione (euro):", shippingCost);
    console.log("🚚 Spese di spedizione (centesimi per Stripe):", shippingCost);




    // Costruzione degli articoli per Stripe (line items- sintassi di default dell'API di stripe)
    // Crea un array di oggetti `line_items` per ciascun articolo nel carrello
    const line_items = items.map(item => ({
        // Oggetto che rappresenta i dati relativi al prezzo dell'articolo
        price_data: {
            currency: 'eur',
            // Dati relativi al prodotto (nome)
            product_data: {
                name: item.name,
            },
            // Prezzo unitario dell'articolo
            unit_amount: item.price
        },
        // Quantità dell'articolo nel carrello
        quantity: item.quantity
    }));

    // Aggiungi la spedizione come prodotto separato, se dovuta
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





    // Creazione della sessione di pagamento
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], // accetta solo carte
        mode: 'payment', // modalità di pagamento, in questo caso 'payment' per transazioni una tantum

        // Array degli articoli che l'utente sta acquistando
        line_items,
        success_url: `${process.env.FE_APP}/success?session_id={CHECKOUT_SESSION_ID}`, // URL dopo il pagamento
        cancel_url: `${process.env.FE_APP}/cart`, // URL se l'utente annulla
        shipping_address_collection: {
            allowed_countries: ['IT', 'FR', 'DE', 'ES'],
        },


        metadata: {
            // Dati dell'utente inviati dal backend al momento della creazione della sessione di pagamento. Questi metadati sono poi disponibili nel webhook dopo il completamento del pagamento
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

            // Serializza gli articoli per poterli leggere nel webhook
            items: JSON.stringify(items.map(({ product_id, quantity, price }) => ({
                product_id,
                quantity,
                price: price / 100
            })))
        }
    });

    res.json({ url: session.url });
}


//  2. Gestisce gli eventi inviati da Stripe al tuo server tramite webhook
async function handleStripeWebhook(req, res) {

    console.log('📩 Webhook ricevuto da Stripe:', req.body);

    // Firma della richiesta per verificare che venga davvero da Stripe
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        // Costruisce l’evento usando la chiave segreta
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // // Se l’evento è completamento del pagamento...
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object; // L'oggetto sessione, che contiene i metadata inviati dal backend al momento della creazione della sessione di pagamento


        console.log('✅ Sessione completata, creo ordine per:', session.metadata.user_email);


        // Salva l’ordine nel DB usando i metadata ricevuti
        await createOrderFromStripe(session);
    }

    // Rispondiamo a Stripe per confermare la ricezione
    res.status(200).json({ received: true });
}



module.exports = { createCheckoutSession, handleStripeWebhook };