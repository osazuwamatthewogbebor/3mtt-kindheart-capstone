#!/bin/bash

# KindHeart Backend Setup Script
# This script helps you set up the backend quickly

echo "========================================"
echo "   KindHeart Backend Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL: https://www.postgresql.org/download/"
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Creating uploads directory..."
mkdir -p uploads

echo ""
echo "Checking .env file..."
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your credentials."
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file with your:"
    echo "   - Database credentials"
    echo "   - JWT secret"
    echo "   - Email settings"
    echo "   - Paystack API keys"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Set up PostgreSQL database:"
echo "   psql -U postgres"
echo "   \\i path/to/database_schema.sql"
echo ""
echo "2. Edit .env file with your credentials"
echo ""
echo "3. Start the server:"
echo "   npm run dev   (development)"
echo "   npm start     (production)"
echo ""
echo "4. Test the API:"
echo "   http://localhost:5000/api/health"
echo ""
echo "========================================"
