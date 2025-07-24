# CUT529 Payment System 💳

AI-powered NSFW blocker with seamless Stripe payment integration. The payment experience is designed to feel like a premium download rather than a traditional payment process.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm run setup
```

### 2. Configure Stripe Keys

#### Get your Stripe keys:
1. Create a [Stripe account](https://stripe.com)
2. Go to Developers → API Keys
3. Copy your **Publishable key** and **Secret key**

#### Update the configuration:

**In `payment.html` (line ~200):**
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');
```

**In `server.js` (line 2):**
```javascript
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY_HERE');
```

### 3. Configure Email (Optional)

**In `server.js` (lines 15-20):**
```javascript
const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email provider
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password' // Use App Password for Gmail
    }
});
```

### 4. Run the Server
```bash
npm start
```

Visit: http://localhost:3000

## 🎯 Payment Flow Strategy

### The "Download" Psychology
The payment page is designed as a **premium download experience**:

- ✅ Uses "Download" language instead of "Buy"
- ✅ Shows immediate value ("AI-powered protection starts in 30 seconds")
- ✅ Emphasizes what they get instantly
- ✅ Trust indicators (SSL, money-back guarantee)
- ✅ Professional design that reduces payment anxiety

### Key Features:
- **Seamless plan switching** during checkout
- **Real-time price updates**
- **Mobile-optimized** payment forms
- **Success modal** with next steps
- **Automatic email** with download links

## 📁 File Structure

```
cut529.com/
├── index.html          # Main landing page
├── payment.html        # Payment/checkout page
├── styles.css          # Main site styles
├── payment-styles.css  # Payment-specific styles
├── server.js           # Node.js backend with Stripe
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔧 Advanced Configuration

### Webhooks Setup
1. In Stripe Dashboard: Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook secret to `server.js` line ~140

### Environment Variables (Recommended)
Create a `.env` file:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

Then update `server.js`:
```javascript
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Production Checklist
- [ ] Replace test keys with live Stripe keys
- [ ] Set up proper domain for webhooks
- [ ] Configure production email service
- [ ] Set up SSL certificate
- [ ] Add proper error logging
- [ ] Configure database for storing orders
- [ ] Set up download link expiration

## 💡 UX Psychology Tips

### Why this approach works:
1. **Reduces friction**: "Download" feels easier than "Purchase"
2. **Immediate gratification**: Emphasizes instant access
3. **Trust building**: Security badges and guarantees
4. **Social proof**: "Most Popular" plan highlighting
5. **Progressive disclosure**: Show value before asking for payment

### Conversion optimization:
- Plans are compared side-by-side
- Default selection on most popular plan
- Price anchoring with highest plan shown
- Urgency through "starts in 30 seconds"
- Risk reversal with money-back guarantee

## 🔒 Security Features

- **PCI Compliance**: Stripe handles all card data
- **SSL Encryption**: All transactions encrypted
- **Webhook Verification**: Prevents fraudulent requests
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Prevents abuse (add if needed)

## 📊 Analytics & Tracking

Consider adding:
- Google Analytics for conversion tracking
- Stripe Dashboard for payment analytics
- Conversion funnel analysis
- A/B testing for different CTAs

## 🚨 Troubleshooting

### Common Issues:

**1. "Stripe is not defined" error:**
- Check if Stripe script is loaded in payment.html
- Verify publishable key is set correctly

**2. Payment not processing:**
- Check server logs for Stripe errors
- Verify secret key in server.js
- Ensure webhook endpoint is accessible

**3. Email not sending:**
- Check email credentials
- For Gmail, use App Password instead of regular password
- Verify less secure app access if needed

**4. CORS errors:**
- Make sure cors middleware is enabled
- Check if frontend and backend are on same domain

### Test Cards:
```
Visa: 4242 4242 4242 4242
Visa (debit): 4000 0566 5566 5556
Mastercard: 5555 5555 5555 4444
Declined: 4000 0000 0000 0002
```

## 📞 Support

- **Documentation**: [Stripe Docs](https://stripe.com/docs)
- **Testing**: Use Stripe test mode for development
- **Webhooks**: Test with [ngrok](https://ngrok.com) for local development

---

## 🎨 Customization

### Changing Colors:
The design uses `#00cfff` as the primary color. To change:
1. Update CSS variables in `styles.css` and `payment-styles.css`
2. Update Stripe Elements styling in `payment.html`

### Adding Payment Methods:
Stripe supports various payment methods. Update the payment form to include:
- Apple Pay / Google Pay
- Bank transfers
- Buy now, pay later options

---

**Happy coding! 🚀**

*Remember: This system is designed to feel like a premium download experience rather than a traditional payment flow. The psychology matters as much as the technology.* 