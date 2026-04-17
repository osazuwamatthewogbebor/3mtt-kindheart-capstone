# KindHeart Backend - Quick Start Guide

Get your crowdfunding backend up and running in 10 minutes!

## ⚡ Quick Setup (5 steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Create Database
```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kindheart;
\c kindheart
\i database_schema.sql
\q
```

### 3️⃣ Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - DB_PASSWORD (your postgres password)
# - JWT_SECRET (any long random string)
```

### 4️⃣ Create Uploads Folder
```bash
mkdir uploads
```

### 5️⃣ Start Server
```bash
npm run dev
```

Visit: **http://localhost:5000** ✅

---

## 🧪 Quick Test

### Test the API is working:
```bash
curl http://localhost:5000/api/health
```

### Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@test.com","password":"pass123"}'
```

### Get categories:
```bash
curl http://localhost:5000/api/categories
```

---

## 📱 Connect Your Dashboard

Update your dashboard HTML file to point to the backend:

```javascript
const API = "http://localhost:5000/api";
```

Now your dashboard should work! 🎉

---

## 🔑 Create Admin User

```sql
psql -U postgres -d kindheart

UPDATE users SET role = 'ADMIN' 
WHERE email = 'john@test.com';
```

---

## 📚 Full Documentation

- **SETUP.md** - Complete setup guide with troubleshooting
- **README.md** - Full API documentation
- **DEPLOYMENT.md** - Production deployment guide
- **POSTMAN.md** - API testing examples

---

## 🆘 Having Issues?

### Database connection error?
- Check PostgreSQL is running
- Verify DB_PASSWORD in .env

### Port already in use?
- Change PORT in .env
- Or kill the process using port 5000

### Need more help?
- Read SETUP.md for detailed instructions
- Check Common Issues section

---

## ✨ Features Included

✅ User authentication (register, login, forgot password)
✅ Campaign management (create, edit, delete, list)
✅ Payment integration with Paystack
✅ File uploads (images)
✅ Admin dashboard with statistics
✅ Category management
✅ Donation tracking
✅ Email notifications
✅ Role-based access control

---

## 🚀 What's Next?

1. Test all endpoints
2. Configure Paystack for payments
3. Set up email service
4. Connect your frontend
5. Deploy to production

**Your crowdfunding platform is ready! 🎊**
