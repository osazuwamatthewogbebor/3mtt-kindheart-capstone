# KindHeart Crowdfunding Platform - Backend API

A complete Node.js backend for a crowdfunding platform with user authentication, campaign management, payment processing, and admin dashboard.

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login with JWT
  - Password reset via email
  - Role-based access control (USER, ADMIN)
  - Profile management

- **Campaign Management**
  - Create, read, update, delete campaigns
  - Image upload for campaigns
  - Campaign categories
  - Progress tracking
  - Search and filter campaigns

- **Donation System**
  - Secure payment processing with Paystack
  - Payment verification
  - Donation tracking
  - Anonymous donations support

- **Admin Dashboard**
  - User management
  - Campaign oversight
  - Statistics and analytics
  - Activity logs
  - Role management

- **Categories**
  - Predefined categories (Health, Education, Business, Charity, Emergency)
  - Category management (admin only)

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- Paystack account (for payments)
- Email service (Gmail or similar)

## 🛠️ Installation

### 1. Clone or Download the Project

```bash
cd kindheart-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

Run the SQL script in PostgreSQL:

```bash
psql -U postgres
\i path/to/database_schema.sql
```

Or manually create the database and run the SQL commands from the provided schema.

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# SERVER
PORT=5000
NODE_ENV=development

# DATABASE
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=kindheart

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# EMAIL
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# PAYSTACK
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# FRONTEND URL
FRONTEND_URL=http://localhost:3000
```

### 5. Create Uploads Directory

```bash
mkdir uploads
```

### 6. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

#### Update Profile
```http
PUT /api/auth/update-profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@example.com"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Campaign Endpoints

#### Get All Campaigns
```http
GET /api/campaigns?status=ACTIVE&category=Health&search=cancer&limit=20&page=1
```

#### Get Single Campaign
```http
GET /api/campaigns/{id}
```

#### Create Campaign
```http
POST /api/campaigns
Authorization: Bearer {token}
Content-Type: multipart/form-data

title: Campaign Title
description: Campaign description
goal_amount: 100000
category_id: {category_uuid}
image: [file]
```

#### Update Campaign
```http
PUT /api/campaigns/{id}
Authorization: Bearer {token}
Content-Type: multipart/form-data

title: Updated Title
description: Updated description
goal_amount: 150000
status: ACTIVE
image: [file]
```

#### Delete Campaign
```http
DELETE /api/campaigns/{id}
Authorization: Bearer {token}
```

#### Get My Campaigns
```http
GET /api/campaigns/my-campaigns
Authorization: Bearer {token}
```

### Donation Endpoints

#### Create Donation (Initialize Payment)
```http
POST /api/donations
Content-Type: application/json

{
  "campaign_id": "{campaign_uuid}",
  "amount": 5000,
  "email": "donor@example.com"
}
```

Response includes Paystack payment URL.

#### Verify Donation
```http
GET /api/donations/verify/{reference}
```

#### Get All Donations (Admin)
```http
GET /api/donations?status=SUCCESS&campaign_id={uuid}&limit=50&page=1
Authorization: Bearer {admin_token}
```

#### Get My Donations
```http
GET /api/donations/my-donations
Authorization: Bearer {token}
```

#### Get Campaign Donations
```http
GET /api/donations/campaign/{campaignId}
```

### Category Endpoints

#### Get All Categories
```http
GET /api/categories
```

#### Get Single Category
```http
GET /api/categories/{id}
```

#### Create Category (Admin)
```http
POST /api/categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Technology"
}
```

#### Update Category (Admin)
```http
PUT /api/categories/{id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Category (Admin)
```http
DELETE /api/categories/{id}
Authorization: Bearer {admin_token}
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/stats
```

#### Get All Users
```http
GET /api/admin/users?role=USER&search=john&limit=50&page=1
Authorization: Bearer {admin_token}
```

#### Get Single User
```http
GET /api/admin/users/{id}
Authorization: Bearer {admin_token}
```

#### Update User Role
```http
PUT /api/admin/users/{id}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### Delete User
```http
DELETE /api/admin/users/{id}
Authorization: Bearer {admin_token}
```

#### Get Admin Logs
```http
GET /api/admin/logs?limit=100&page=1
Authorization: Bearer {admin_token}
```

#### Get Recent Activity
```http
GET /api/admin/activity?limit=20
Authorization: Bearer {admin_token}
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/{id}
```

#### Upload Profile Image
```http
PUT /api/users/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: [file]
```

#### Get User Campaigns
```http
GET /api/users/{id}/campaigns?status=ACTIVE
```

#### Get User Donations
```http
GET /api/users/{id}/donations
Authorization: Bearer {token}
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: USER and ADMIN roles
- **Input Validation**: Express-validator
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configurable cross-origin requests
- **File Upload Validation**: Type and size restrictions

## 📁 Project Structure

```
kindheart-backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── campaignController.js # Campaign logic
│   │   ├── donationController.js # Donation logic
│   │   ├── categoryController.js # Category logic
│   │   ├── adminController.js   # Admin logic
│   │   └── userController.js    # User logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validator.js         # Input validation
│   │   └── upload.js            # File upload handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── campaignRoutes.js
│   │   ├── donationRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── adminRoutes.js
│   │   └── userRoutes.js
│   └── utils/
│       ├── helpers.js           # Helper functions
│       └── paystack.js          # Payment integration
├── uploads/                     # Uploaded files
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├── server.js                    # Main application file
└── README.md
```

## 🧪 Testing the API

### Using cURL

Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for base URL and token
3. Test each endpoint

## 💳 Payment Integration (Paystack)

### Setup Paystack

1. Create account at [paystack.com](https://paystack.com)
2. Get your API keys from Settings > API Keys & Webhooks
3. Add keys to `.env` file

### Payment Flow

1. User initiates donation
2. Backend creates donation record and initializes Paystack payment
3. User is redirected to Paystack payment page
4. After payment, user is redirected back
5. Backend verifies payment with Paystack
6. Campaign raised amount is updated

### Webhook (Optional)

Set up webhook URL in Paystack dashboard:
```
https://your-domain.com/api/donations/webhook
```

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification
   - App passwords
   - Generate new password
3. Use the generated password in `.env`

## 🚀 Deployment

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create kindheart-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set PAYSTACK_SECRET_KEY=your_key
# ... set all other variables

# Deploy
git push heroku main
```

### VPS (Ubuntu)

```bash
# Install Node.js and PostgreSQL
sudo apt update
sudo apt install nodejs npm postgresql

# Clone project
git clone your-repo
cd kindheart-backend

# Install dependencies
npm install

# Set up database
sudo -u postgres psql < database_schema.sql

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name kindheart-api

# Set up Nginx reverse proxy
sudo apt install nginx
# Configure nginx...
```

## 🐛 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

### JWT Error
- Check JWT_SECRET is set
- Verify token format in Authorization header

### File Upload Error
- Check `uploads/` directory exists
- Verify file size limits
- Check file type restrictions

### Payment Error
- Verify Paystack keys are correct
- Check API is in test/live mode
- Ensure callback URL is accessible

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 👥 Support

For issues or questions:
- Create an issue in the repository
- Email: support@kindheart.com

## 🔄 Updates

Check for updates regularly. Version 1.0.0

---

**Made with ❤️ by KindHeart Team**
