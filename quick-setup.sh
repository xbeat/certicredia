#!/bin/bash
#
# Quick Setup Script - Run this after setting DATABASE_URL in .env
#

set -e

echo "🔧 CertiCredia - Quick Setup"
echo "============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found"
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env and set your DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if grep -q "your-neon-host" .env; then
    echo "❌ ERROR: DATABASE_URL not configured in .env"
    echo ""
    echo "You need to:"
    echo "1. Get your DATABASE_URL from Neon.tech dashboard"
    echo "2. Edit .env file (line 8)"
    echo "3. Replace the placeholder with your actual connection string"
    echo ""
    echo "Example:"
    echo "DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/certicredia?sslmode=require"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo ""

# Run migrations
echo "📊 Running database migrations..."
npm run migrate
echo ""

# Seed test users
echo "🌱 Creating test users..."
npm run seed:users
echo ""

echo "✅ Setup complete!"
echo ""
echo "Test credentials:"
echo "  Admin:      admin@certicredia.test / Admin123!@#"
echo "  Ente:       ente@certicredia.test / Ente123!@#"
echo "  Specialist: specialist@certicredia.test / Specialist123!@#"
echo "  Candidato:  candidate@certicredia.test / Candidate123!@#"
echo ""
echo "Now start the server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000/public/pages/login.html"
