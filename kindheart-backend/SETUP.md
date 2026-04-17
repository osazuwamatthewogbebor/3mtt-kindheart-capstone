# Complete Setup Guide - KindHeart Backend

This guide will walk you through setting up the KindHeart crowdfunding backend from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Creating Admin User](#creating-admin-user)
8. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node -v`

2. **PostgreSQL** (v12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Verify installation: `psql --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/

### Required Accounts

1. **Paystack Account**
   - Sign up at: https://paystack.com/
   - Get API keys from dashboard

2. **Email Account** (Gmail recommended)
   - Enable 2-Factor Authentication
   - Generate App Password for SMTP

---

## Installation

### Step 1: Get the Code

If you have the project folder:
```bash
cd kindheart-backend
```

Or clone from Git:
```bash
git clone <repository-url>
cd kindheart-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- pg (PostgreSQL client)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- multer (file uploads)
- and more...

### Step 3: Create Required Directories

```bash
mkdir uploads
```

Or run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

---

## Database Setup

### Step 1: Start PostgreSQL

**Windows:**
- PostgreSQL should start automatically
- Or use Services app to start it

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### Step 2: Access PostgreSQL

```bash
psql -U postgres
```

If you get "authentication failed", you may need to set a password:
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
```

### Step 3: Create Database

Inside psql:
```sql
CREATE DATABASE kindheart;
\c kindheart
```

### Step 4: Run Database Schema

**Option 1: From psql**
```sql
\i /path/to/database_schema.sql
```

**Option 2: From terminal**
```bash
psql -U postgres -d kindheart -f database_schema.sql
```

### Step 5: Verify Tables

```sql
\dt
```

You should see these tables:
- users
- categories
- campaigns
- donations
- payments
- password_resets
- admin_logs

---

## Configuration

### Step 1: Create .env File

Copy the example:
```bash
cp .env.example .env
```

### Step 2: Edit .env File

Open `.env` in your text editor and configure:

#### Server Settings
```env
PORT=5000
NODE_ENV=development
```

#### Database Settings
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=kindheart
```

#### JWT Settings
Generate a strong secret (can use: https://randomkeygen.com/)
```env
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRE=7d
```

#### Email Settings (Gmail Example)

1. Go to Google Account Settings
2. Security > 2-Step Verification > App passwords
3. Generate app password for "Mail"

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### Paystack Settings

1. Log in to Paystack
2. Go to Settings > API Keys & Webhooks
3. Copy your test keys

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

#### Frontend URL
```env
FRONTEND_URL=http://localhost:3000
```

---

## Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Verify It's Running

Open your browser to: http://localhost:5000

You should see:
```json
{
  "success": true,
  "message": "Welcome to KindHeart Crowdfunding API",
  "version": "1.0.0"
}
```

Or check health endpoint: http://localhost:5000/api/health

---

## Testing

### Test 1: Register a User

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Using Postman:**
1. Open Postman
2. Create POST request to `http://localhost:5000/api/auth/register`
3. Set header: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from response!

### Test 3: Get Categories

```bash
curl http://localhost:5000/api/categories
```

Should return default categories:
- Health
- Education
- Business
- Charity
- Emergency

### Test 4: Create Campaign (requires authentication)

```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Help Build School",
    "description": "We need funds to build a school in rural area",
    "goal_amount": 1000000,
    "category_id": "CATEGORY_UUID_FROM_STEP_3"
  }'
```

### Test 5: Get Dashboard Stats

```bash
curl http://localhost:5000/api/admin/stats
```

---

## Creating Admin User

By default, all users are created with "USER" role. To create an admin:

### Method 1: Direct Database Update

```sql
psql -U postgres -d kindheart

UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, name, email, role FROM users;
```

### Method 2: Using pgAdmin

1. Open pgAdmin
2. Connect to kindheart database
3. Browse to Tables > users
4. Find your user
5. Edit role to 'ADMIN'

---

## Common Issues

### Issue 1: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux

# Or change port in .env
PORT=5001
```

### Issue 2: "Database connection failed"

**Solution:**
1. Check PostgreSQL is running
2. Verify credentials in .env
3. Test connection:
```bash
psql -U postgres -d kindheart
```

### Issue 3: "JWT malformed error"

**Solution:**
- Make sure token is in format: `Bearer <token>`
- Check JWT_SECRET is set in .env
- Generate new token by logging in again

### Issue 4: "File upload failed"

**Solution:**
```bash
# Check uploads directory exists
ls -la uploads/

# Create if missing
mkdir uploads
chmod 755 uploads
```

### Issue 5: "Email sending failed"

**Solution:**
1. Verify Gmail app password is correct
2. Check 2FA is enabled
3. Test SMTP settings:
```bash
telnet smtp.gmail.com 587
```

### Issue 6: "Paystack payment initialization failed"

**Solution:**
1. Verify Paystack keys are correct
2. Check you're using test keys in development
3. Ensure internet connection is available

---

## Project Structure Reference

```
kindheart-backend/
├── src/
│   ├── config/
│   │   └── database.js          # DB connection
│   ├── controllers/
│   │   ├── authController.js    # Login, register, etc.
│   │   ├── campaignController.js
│   │   ├── donationController.js
│   │   ├── categoryController.js
│   │   ├── adminController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── validator.js         # Input validation
│   │   └── upload.js            # File handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── donationRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── adminRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       ├── helpers.js           # Utility functions
│       └── paystack.js          # Payment integration
├── uploads/                     # User uploaded files
├── .env                         # Configuration (create this)
├── .env.example                 # Template
├── .gitignore
├── package.json
├── server.js                    # Main entry point
├── README.md
├── DEPLOYMENT.md
├── POSTMAN.md
└── SETUP.md (this file)
```

---

## Next Steps

1. ✅ Backend is running
2. 📱 Connect your frontend dashboard
3. 💳 Test payment flow
4. 🚀 Deploy to production

---

## Need Help?

- Check README.md for API documentation
- Check DEPLOYMENT.md for deployment guide
- Check POSTMAN.md for API testing examples
- Create an issue on GitHub
- Email: support@kindheart.com

---

**Happy Coding! 🎉**
