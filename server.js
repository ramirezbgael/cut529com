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

// Plan configurations
const plans = {
    basic: {
        name: 'Get Free Plan',
        price: 10,
        priceId: 'price_1234567890', // Replace with actual Stripe price ID
        downloadUrl: 'https://cut529.com/downloads/cut529-basic.zip',
        features: ['Smart URL blocking', 'Basic irrevocable mode', 'Commitment timer']
    },
    premium: {
        name: 'Stay Clean Plan',
        price: 100,
        priceId: 'price_0987654321', // Replace with actual Stripe price ID
        downloadUrl: 'https://cut529.com/downloads/cut529-premium.zip',
        features: ['Everything from Get Free', 'Visual AI analysis', 'Advanced irrevocable mode']
    },
    enterprise: {
        name: 'No Way Back Plan',
        price: 1000,
        priceId: 'price_1122334455', // Replace with actual Stripe price ID
        downloadUrl: 'https://cut529.com/downloads/cut529-enterprise.zip',
        features: ['Everything from Stay Clean', 'Network monitoring', 'Therapy session']
    }
};

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});

// Public config endpoint (serves safe, non-secret config)
app.get('/config', (req, res) => {
    res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { plan, email, name } = req.body;
        
        if (!plans[plan]) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const selectedPlan = plans[plan];
        
        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: selectedPlan.price * 100, // Convert to cents
            currency: 'usd',
            metadata: {
                plan: plan,
                customer_email: email,
                customer_name: name,
                product: 'CUT529 License'
            },
            receipt_email: email
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            amount: selectedPlan.price
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

        const selectedPlan = plans[plan];

        // Create charge using the token
        const charge = await stripe.charges.create({
            amount: parseInt(amount) * 100, // Convert to cents
            currency: 'usd',
            source: token,
            description: `CUT529 ${selectedPlan.name} License`,
            metadata: {
                plan: plan,
                customer_email: email,
                customer_name: name
            },
            receipt_email: email
        });

        if (charge.status === 'succeeded') {
            // Send download email
            await sendDownloadEmail(email, name, selectedPlan);
            
            // Log successful purchase
            console.log(`✅ Successful purchase: ${name} (${email}) - ${selectedPlan.name} - $${amount}`);
            
            res.json({ 
                success: true, 
                charge: charge.id,
                message: 'Payment successful! Check your email for download instructions.'
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: 'Payment failed. Please try again.' 
            });
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'An error occurred while processing your payment.' 
            });
        }
    }
});

// Webhook to handle Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.WEBHOOK_SECRET_KEY;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`⚠️ Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`✅ PaymentIntent succeeded: ${paymentIntent.id}`);
            
            // Send download email
            const plan = paymentIntent.metadata.plan;
            const email = paymentIntent.metadata.customer_email;
            const name = paymentIntent.metadata.customer_name;
            
            if (plans[plan]) {
                sendDownloadEmail(email, name, plans[plan]);
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log(`❌ Payment failed: ${failedPayment.id}`);
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Send download email
async function sendDownloadEmail(email, name, plan) {
    const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Inter, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00cfff 0%, #0099bb 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .download-button { display: inline-block; background: #00cfff; color: white; 
                              padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                              font-weight: bold; margin: 20px 0; }
            .features { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to CUT529!</h1>
                <p>Your journey to digital freedom starts now</p>
            </div>
            
            <div class="content">
                <h2>Hi ${name},</h2>
                
                <p>Thank you for choosing <strong>${plan.name}</strong>! Your AI-powered protection is ready to download.</p>
                
                <div style="text-align: center;">
                    <a href="${plan.downloadUrl}" class="download-button">
                        📥 Download CUT529 Now
                    </a>
                </div>
                
                <div class="features">
                    <h3>What you get with ${plan.name}:</h3>
                    <ul>
                        ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
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

    const mailOptions = {
        from: '"CUT529 Team" <noreply@cut529.com>',
        to: email,
        subject: `🎉 Your CUT529 ${plan.name} is ready for download!`,
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