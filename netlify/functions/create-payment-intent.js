const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Exchange rates (approximate)
const exchangeRates = {
    USD: 1,
    MXN: 20,
    EUR: 0.85,
    GBP: 0.75,
    CAD: 1.35,
    AUD: 1.45,
    BRL: 5.50,
    ARS: 350
};

const plans = {
    basic: {
        name: 'Get Free Plan',
        priceUSD: 10,
        features: ['Smart URL blocking (DNS)', 'Temporary irrevocable mode', 'Commitment timer', 'Email support']
    },
    premium: {
        name: 'Stay Clean Plan',
        priceUSD: 100,
        features: ['Everything from Get Free', 'Visual AI analysis', 'Advanced irrevocable mode'],
        availableDate: '2024-12-14',
        preorder: true
    },
    enterprise: {
        name: 'No Way Back Plan',
        priceUSD: 1000,
        features: ['Everything from Stay Clean', 'Network monitoring', 'Therapy session'],
        availableDate: '2025-02-14',
        preorder: true
    }
};

function convertPrice(priceUSD, currency) {
    if (currency === 'USD') return priceUSD;
    const rate = exchangeRates[currency];
    if (!rate) return priceUSD;
    return Math.round(priceUSD * rate * 100) / 100;
}

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'POST') {
        try {
            const { plan, currency = 'USD' } = JSON.parse(event.body);
            
            if (!plans[plan]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid plan selected' })
                };
            }

            if (!exchangeRates[currency]) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Unsupported currency' })
                };
            }

            const planConfig = plans[plan];
            const convertedPrice = convertPrice(planConfig.priceUSD, currency);
            const amount = Math.round(convertedPrice * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: currency.toLowerCase(),
                automatic_payment_methods: { enabled: true },
                metadata: {
                    plan: plan,
                    planName: planConfig.name,
                    originalPriceUSD: planConfig.priceUSD,
                    convertedPrice: convertedPrice,
                    selectedCurrency: currency
                }
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    clientSecret: paymentIntent.client_secret,
                    amount: amount,
                    plan: {
                        ...planConfig,
                        price: convertedPrice,
                        currency: currency
                    }
                })
            };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to create payment intent' })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};
