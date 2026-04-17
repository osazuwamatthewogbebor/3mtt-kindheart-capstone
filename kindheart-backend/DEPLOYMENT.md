# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- Node.js installed on server
- PostgreSQL database set up
- Domain name (optional)
- SSL certificate (for production)
- Paystack account with live keys

## Option 1: Deploy to Heroku (Easiest)

### Step 1: Prepare Your App

```bash
# Make sure you have a Procfile
echo "web: node server.js" > Procfile

# Commit changes
git add .
git commit -m "Ready for deployment"
```

### Step 2: Create Heroku App

```bash
# Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create kindheart-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 3: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-super-secret-key-here
heroku config:set JWT_EXPIRE=7d
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set PAYSTACK_SECRET_KEY=sk_live_your_live_key
heroku config:set PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
heroku config:set MAX_FILE_SIZE=5242880
```

### Step 4: Deploy

```bash
# Push to Heroku
git push heroku main

# Run database migrations
heroku pg:psql < database_schema.sql

# Check logs
heroku logs --tail
```

### Step 5: Access Your API

Your API will be available at: `https://kindheart-api.herokuapp.com`

## Option 2: Deploy to DigitalOcean/AWS/VPS

### Step 1: Set Up Server

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### Step 2: Set Up Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE kindheart;
CREATE USER kindheartuser WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE kindheart TO kindheartuser;
\q

# Run your SQL schema
sudo -u postgres psql kindheart < /path/to/database_schema.sql
```

### Step 3: Deploy Application

```bash
# Create app directory
mkdir -p /var/www/kindheart-backend
cd /var/www/kindheart-backend

# Clone your repository
git clone https://github.com/yourusername/kindheart-backend.git .

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste your production environment variables
```

### Step 4: Configure PM2

```bash
# Start application
pm2 start server.js --name kindheart-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions provided

# Check status
pm2 status
```

### Step 5: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kindheart-api

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name api.kindheart.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Handle file uploads
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kindheart-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.kindheart.com

# Certbot will automatically configure SSL and redirect HTTP to HTTPS
```

### Step 7: Set Up Firewall

```bash
# Allow OpenSSH
sudo ufw allow OpenSSH

# Allow Nginx
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

## Option 3: Deploy to Railway

### Step 1: Sign Up

Visit [railway.app](https://railway.app) and sign up

### Step 2: Create New Project

- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your repository

### Step 3: Add PostgreSQL

- Click "New" > "Database" > "PostgreSQL"
- Railway will automatically create database

### Step 4: Configure Environment Variables

Add all environment variables in Railway dashboard

### Step 5: Deploy

Railway will automatically deploy your app

## Environment Variables for Production

```env
NODE_ENV=production
PORT=5000

# Database (get from hosting provider)
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=kindheart

# JWT (generate strong secret)
JWT_SECRET=generate-strong-random-string-here
JWT_EXPIRE=7d

# Email (use production email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@kindheart.com
EMAIL_PASSWORD=your-app-password

# Paystack (use LIVE keys)
PAYSTACK_SECRET_KEY=sk_live_your_actual_live_key
PAYSTACK_PUBLIC_KEY=pk_live_your_actual_live_key

# Frontend URL (your actual domain)
FRONTEND_URL=https://kindheart.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connection
- [ ] Test file uploads
- [ ] Test payment integration with Paystack
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backups for database
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Test email delivery
- [ ] Review security settings
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Test SSL certificate
- [ ] Set up logging
- [ ] Create admin user
- [ ] Update frontend API URL

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs kindheart-api

# Monitor CPU and memory
pm2 monit

# Restart app
pm2 restart kindheart-api

# View process info
pm2 info kindheart-api
```

### Database Backups

```bash
# Backup database
pg_dump -U kindheartuser kindheart > backup_$(date +%Y%m%d).sql

# Restore database
psql -U kindheartuser kindheart < backup_20240101.sql

# Set up automated daily backups
crontab -e
# Add: 0 2 * * * pg_dump -U kindheartuser kindheart > /backups/kindheart_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Server not starting
```bash
# Check PM2 logs
pm2 logs kindheart-api --lines 100

# Check system resources
free -h
df -h
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -U kindheartuser -d kindheart -h localhost
```

### Nginx issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Maintenance

### Updates

```bash
# Pull latest changes
cd /var/www/kindheart-backend
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart kindheart-api
```

### Security Updates

```bash
# Update Node.js packages
npm audit fix

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## Performance Optimization

1. **Enable Gzip in Nginx**
2. **Set up CDN for static files**
3. **Use connection pooling for database**
4. **Implement caching with Redis**
5. **Set up load balancer for multiple instances**

---

**Need Help?** Contact support@kindheart.com
