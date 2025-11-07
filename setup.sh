#!/bin/bash

# CUT529 Development Setup Script

echo "🚀 Starting CUT529 Payment System Setup..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found! Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual Stripe keys and email configuration"
    echo "   Get Stripe keys from: https://dashboard.stripe.com/apikeys"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your Stripe keys"
echo "   2. Configure your email settings in .env"
echo "   3. Run: npm start"
echo ""
echo "🔗 Useful links:"
echo "   - Stripe Dashboard: https://dashboard.stripe.com"
echo "   - Test Cards: https://stripe.com/docs/testing"
echo ""
