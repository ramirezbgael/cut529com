const express = require('express');
require('dotenv').config(); // Load environment variables
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Email configuration (configure with your email provider)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Plan configurations (precios base en USD)
const plans = {
    trial: {
        name: '7-Day Free Trial',
        priceUSD: 0,
        priceId: 'trial', 
        downloadUrl: 'https://cut529.com/downloads/cut529-trial.zip',
        features: ['Full premium features', '7 days completely free', 'No commitment'],
        disabled: true
    },
    basic: {
        name: 'Get Free Plan',
        priceUSD: 10, // Precio base en USD
        priceId: 'price_1234567890',
        downloadUrl: 'https://cut529.com/downloads/cut529-basic.zip',
        features: ['Smart URL blocking (DNS)', 'Temporary irrevocable mode', 'Commitment timer', 'Email support']
    },
    premium: {
        name: 'Stay Clean Plan',
        priceUSD: 100, // Precio base en USD
        priceId: 'price_0987654321',
        downloadUrl: 'https://cut529.com/downloads/cut529-premium.zip',
        features: ['Everything from Get Free', 'Visual AI analysis', 'Advanced irrevocable mode'],
        availableDate: '2024-12-14',
        preorder: true // Habilitado para preventa
    },
    enterprise: {
        name: 'No Way Back Plan',
        priceUSD: 1000, // Precio base en USD
        priceId: 'price_1122334455',
        downloadUrl: 'https://cut529.com/downloads/cut529-enterprise.zip',
        features: ['Everything from Stay Clean', 'Network monitoring', 'Therapy session'],
        availableDate: '2025-02-14',
        preorder: true // Habilitado para preventa
    }
};

// Exchange rates (approximate - you can update these or use a live API)
const exchangeRates = {
    USD: 1,      // Base currency
    MXN: 20,     // 1 USD = 20 MXN
    EUR: 0.85,   // 1 USD = 0.85 EUR
    GBP: 0.75,   // 1 USD = 0.75 GBP
    CAD: 1.35,   // 1 USD = 1.35 CAD
    AUD: 1.45,   // 1 USD = 1.45 AUD
    BRL: 5.50,   // 1 USD = 5.50 BRL
    ARS: 350     // 1 USD = 350 ARS
};

// Currency symbols and formatting
const currencyConfig = {
    USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
    MXN: { symbol: '$', locale: 'es-MX', name: 'Mexican Peso' },
    EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
    GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
    CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar' },
    AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar' },
    BRL: { symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real' },
    ARS: { symbol: '$', locale: 'es-AR', name: 'Argentine Peso' }
};

// Function to convert price to different currency
function convertPrice(priceUSD, currency) {
    if (currency === 'USD') return priceUSD;
    const rate = exchangeRates[currency];
    if (!rate) return priceUSD;
    return Math.round(priceUSD * rate * 100) / 100; // Round to 2 decimals
}

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/config', (req, res) => {
    res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Get prices in specific currency
app.get('/prices/:currency', (req, res) => {
    const { currency } = req.params;
    
    if (!exchangeRates[currency]) {
        return res.status(400).json({ error: 'Unsupported currency' });
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

    res.json({
        plans: convertedPlans,
        currency: currency,
        exchangeRate: exchangeRates[currency],
        currencyInfo: currencyConfig[currency]
    });
});

// Handle free trial signup
app.post('/start-trial', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        // For trial, send email with basic plan download
        const trialPlan = {
            name: '7-Day Free Trial',
            downloadUrl: 'https://cut529.com/downloads/cut529-trial.zip',
            features: [
                'Basic URL blocking',
                'Trial irrevocable mode (7 days max)',
                'Basic protection features',
                'Email support'
            ]
        };
        
        await sendDownloadEmail(email, name, trialPlan);
        
        res.json({ 
            success: true, 
            message: 'Free trial activated! Check your email for download instructions.' 
        });
    } catch (error) {
        console.error('Trial signup error:', error);
        res.status(500).json({ error: 'Failed to start trial' });
    }
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { plan, currency = 'USD' } = req.body;
        
        if (!plans[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Note: Plans with preorder flag are now enabled for pre-order payments

        if (!exchangeRates[currency]) {
            return res.status(400).json({ error: 'Unsupported currency' });
        }

        const planConfig = plans[plan];
        const convertedPrice = convertPrice(planConfig.priceUSD, currency);
        const amount = Math.round(convertedPrice * 100); // Convert to cents/centavos

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                plan: plan,
                planName: planConfig.name,
                originalPriceUSD: planConfig.priceUSD,
                convertedPrice: convertedPrice,
                selectedCurrency: currency
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: amount,
            plan: {
                ...planConfig,
                price: convertedPrice,
                currency: currency
            }
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Process payment (legacy endpoint for token-based payments)
app.post('/process-payment', async (req, res) => {
    try {
        const { token, email, name, plan, amount } = req.body;

        if (!plans[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const planConfig = plans[plan];
        
        // Create charge with Stripe
        const charge = await stripe.charges.create({
            amount: parseFloat(amount) * 100, // Convert to cents
            currency: 'mxn', // Cambiado a pesos mexicanos
            source: token,
            description: `CUT529 ${planConfig.name} - ${email}`,
            metadata: {
                email: email,
                name: name,
                plan: plan,
                planName: planConfig.name
            }
        });

        if (charge.status === 'succeeded') {
            // Send download email
            await sendDownloadEmail(email, name, planConfig);
            
            res.json({ 
                success: true, 
                message: 'Payment successful! Check your email for download instructions.',
                chargeId: charge.id
            });
        } else {
            res.status(400).json({ error: 'Payment failed' });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ 
            error: error.message || 'Payment processing failed' 
        });
    }
});

// Webhook to handle Stripe events (temporarily disabled - no webhook secret configured)
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    // Skip webhook verification for now if no secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
        console.log('⚠️  Webhook secret not configured, skipping verification');
        return res.json({ received: true, note: 'Webhook secret not configured' });
    }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('💰 Payment succeeded:', paymentIntent.id);
            
            // Get metadata
            const { plan, planName } = paymentIntent.metadata;
            
            if (plans[plan] && paymentIntent.receipt_email) {
                await sendDownloadEmail(
                    paymentIntent.receipt_email, 
                    paymentIntent.metadata.customer_name || 'Customer',
                    plans[plan]
                );
            }
            break;
        
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ Payment failed:', failedPayment.id);
            break;
        
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Handle free trial signup
app.post('/start-trial', async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email || !name) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        console.log(`🎁 Free trial started for: ${email}`);
        
        // Send trial email (you can customize this)
        const trialPlan = {
            name: '7-Day Free Trial',
            downloadUrl: 'https://cut529.com/downloads/cut529-trial.zip',
            features: ['Full premium features', '7 days completely free', 'No commitment']
        };
        
        await sendDownloadEmail(email, name, trialPlan);
        
        res.json({ 
            success: true, 
            message: 'Free trial activated! Check your email for download instructions.' 
        });
    } catch (error) {
        console.error('Trial signup error:', error);
        res.status(500).json({ error: 'Failed to start trial' });
    }
});

// Send download email
async function sendDownloadEmail(email, name, plan) {
    const isPreorder = plan.preorder === true;
    
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, ${isPreorder ? '#ffa500 0%, #ff6600' : '#00cfff 0%, #0099bb'} 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .download-button { display: inline-block; background: ${isPreorder ? '#ffa500' : '#00cfff'}; color: white; 
                              padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                              font-weight: bold; margin: 20px 0; }
            .features { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .preorder-notice { background: #fff3cd; border: 2px solid #ffa500; border-radius: 8px; 
                              padding: 20px; margin: 20px 0; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${isPreorder ? '🚀 Pre-order Confirmed!' : '🎉 Welcome to CUT529!'}</h1>
                <p>${isPreorder ? 'Your investment in change starts today' : 'Your journey to digital freedom starts now'}</p>
            </div>
            
            <div class="content">
                <h2>Hi ${name},</h2>
                
                ${isPreorder ? `
                <div class="preorder-notice">
                    <h3>🎯 Pre-order Success!</h3>
                    <p><strong>You get immediate access to Get Free Plan</strong> while we prepare your ${plan.name} features.</p>
                    <p><strong>Full ${plan.name} features will be delivered on ${plan.availableDate}</strong></p>
                </div>
                
                <p>Thank you for pre-ordering <strong>${plan.name}</strong>! You're helping us build the future of digital wellness.</p>
                ` : `
                <p>Thank you for choosing <strong>${plan.name}</strong>! Your AI-powered protection is ready to download.</p>
                `}
                
                <div style="text-align: center;">
                    <a href="${isPreorder ? 'https://cut529.com/downloads/cut529-basic.zip' : plan.downloadUrl}" class="download-button">
                        📥 ${isPreorder ? 'Download Get Free Plan (Immediate Access)' : 'Download CUT529 Now'}
                    </a>
                </div>
                
                <div class="features">
                    <h3>${isPreorder ? 'What you get immediately:' : `What you get with ${plan.name}:`}</h3>
                    <ul>
                        ${isPreorder ? 
                            ['Smart URL blocking (DNS)', 'Temporary irrevocable mode', 'Commitment timer', 'Email support'].map(feature => `<li>${feature}</li>`).join('') :
                            plan.features.map(feature => `<li>${feature}</li>`).join('')
                        }
                    </ul>
                    ${isPreorder ? `
                    <h3>What you'll get on ${plan.availableDate}:</h3>
                    <ul>
                        ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    ` : ''}
                </div>
                
                <h3>🚀 Quick Setup Guide:</h3>
                <ol>
                    <li>Download the installer using the button above</li>
                    <li>Run the installer as administrator</li>
                    <li>Follow the setup wizard</li>
                    <li>Configure your protection settings</li>
                    <li>Activate irrevocable mode when ready</li>
                </ol>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>💡 Pro Tip:</strong> Start with a shorter commitment period (1 week) to get familiar with the system before setting longer protection periods.
                </div>
                
                <h3>🔐 Your License Details:</h3>
                <p><strong>Plan:</strong> ${plan.name}<br>
                <strong>Email:</strong> ${email}<br>
                <strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
                
                <h3>📞 Need Help?</h3>
                <p>Our support team is ready to help you succeed:</p>
                <ul>
                    <li>📧 Email: support@cut529.com</li>
                    <li>💬 Live Chat: Available on our website</li>
                    <li>📚 Documentation: docs.cut529.com</li>
                </ul>
                
                <p><strong>Remember:</strong> This isn't just software – it's your commitment to change. We're here to support you every step of the way.</p>
                
                <p>Best regards,<br>
                The CUT529 Team</p>
            </div>
            
            <div class="footer">
                <p>CUT529 - AI-Powered NSFW Content Blocking<br>
                This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const emailSubject = isPreorder 
        ? `🚀 Pre-order confirmed: ${plan.name} + Immediate Access!`
        : `🎉 Your CUT529 ${plan.name} is ready for download!`;

    const mailOptions = {
        from: '"CUT529 Team" <noreply@cut529.com>',
        to: email,
        subject: emailSubject,
        html: emailTemplate
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Download email sent to: ${email}`);
    } catch (error) {
        console.error('❌ Failed to send email:', error);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CUT529 Payment Server running on port ${PORT}`);
    console.log(`💳 Payment page: http://localhost:${PORT}/payment`);
    console.log(`🏠 Main site: http://localhost:${PORT}/`);
});

module.exports = app; 