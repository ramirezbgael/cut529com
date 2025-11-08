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

const currencyConfig = {
    USD: { symbol: '$', name: 'US Dollar' },
    MXN: { symbol: '$', name: 'Mexican Peso' },
    EUR: { symbol: '€', name: 'Euro' },
    GBP: { symbol: '£', name: 'British Pound' },
    CAD: { symbol: 'C$', name: 'Canadian Dollar' },
    AUD: { symbol: 'A$', name: 'Australian Dollar' },
    BRL: { symbol: 'R$', name: 'Brazilian Real' },
    ARS: { symbol: '$', name: 'Argentine Peso' }
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

    if (event.httpMethod === 'GET') {
        // Extract currency from path like /prices/MXN
        const currency = event.path.split('/').pop() || 'USD';
        
        if (!exchangeRates[currency]) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Unsupported currency' })
            };
        }

        const convertedPlans = {};
        for (const [key, plan] of Object.entries(plans)) {
            convertedPlans[key] = {
                ...plan,
                price: convertPrice(plan.priceUSD, currency),
                currency: currency,
                currencyInfo: currencyConfig[currency]
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                plans: convertedPlans,
                currency: currency,
                exchangeRate: exchangeRates[currency],
                currencyInfo: currencyConfig[currency]
            })
        };
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};
