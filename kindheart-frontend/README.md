# KindHeart Frontend

A modern, responsive crowdfunding platform frontend built with HTML, CSS, and vanilla JavaScript.

## 📁 Project Structure

```
kindheart-frontend/
├── index.html                  # Homepage
├── css/
│   ├── style.css              # Main stylesheet
│   └── auth.css               # Authentication pages styles
├── js/
│   ├── config.js              # API configuration
│   ├── main.js                # Homepage scripts
│   ├── auth.js                # Authentication logic
│   └── campaigns.js           # Campaigns page logic
├── pages/
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── forgot-password.html   # Password reset
│   ├── campaigns.html         # Browse campaigns
│   └── dashboard.html         # Admin dashboard (from previous file)
└── images/                    # Image assets
```

## 🚀 Features

### ✨ Homepage
- Hero section with statistics
- Featured campaigns
- Category browse
- How it works section
- Testimonials
- Responsive design

### 🔐 Authentication
- User registration
- User login
- Password reset
- Remember me functionality
- JWT token management

### 📢 Campaigns
- Browse all campaigns
- Search campaigns
- Filter by category
- Sort options
- Responsive campaign cards
- Progress tracking

### 🎨 Design Features
- Modern, clean interface
- Smooth animations
- Gradient effects
- Card hover effects
- Mobile-friendly
- Accessibility considerations

## 🛠️ Setup

### 1. Configure API URL

Edit `js/config.js`:

```javascript
const API_URL = 'http://localhost:5000/api'; // Change to your backend URL
```

### 2. Run the Frontend

#### Option 1: Simple HTTP Server (Python)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Visit: http://localhost:8000

#### Option 2: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

#### Option 3: Node.js HTTP Server
```bash
npx http-server -p 8000
```

### 3. Start Your Backend

Make sure your backend is running on `http://localhost:5000`

## 📄 Pages

### Homepage (`index.html`)
- Landing page with hero section
- Featured campaigns showcase
- Category browsing
- Statistics display
- Call-to-action sections

### Login (`pages/login.html`)
- Email/password login
- Remember me option
- Forgot password link
- Redirect to dashboard on successful login

### Register (`pages/register.html`)
- Full name, email, password fields
- Password confirmation
- Terms acceptance
- Auto-login after registration

### Forgot Password (`pages/forgot-password.html`)
- Email input for password reset
- Sends reset link to email

### Campaigns (`pages/campaigns.html`)
- Browse all active campaigns
- Search functionality
- Category filter
- Sort options
- Pagination (ready for implementation)

### Dashboard (`pages/dashboard.html`)
- Admin statistics
- Campaign overview
- User management
- Activity feed
- Modern, professional design

## 🎨 Customization

### Colors

Edit CSS variables in `css/style.css`:

```css
:root {
    --primary: #10b981;        /* Main brand color */
    --primary-dark: #059669;
    --secondary: #3b82f6;
    --dark: #1e293b;
    /* ... */
}
```

### Logo

Replace the heart icon in navigation:

```html
<div class="logo">
    <i class="fas fa-heart"></i>  <!-- Change this -->
    <span>KindHeart</span>         <!-- Or this -->
</div>
```

### Images

Place campaign images in `/images/campaigns/`

Update image paths in campaign cards.

## 🔧 JavaScript Functions

### Authentication

```javascript
// Check if user is logged in
isLoggedIn()

// Get auth token
getToken()

// Get auth headers
getAuthHeaders()

// Logout user
logout()
```

### Utilities

```javascript
// Format currency
formatCurrency(50000) // Returns "₦50,000"

// Format date
formatDate('2024-01-15') // Returns "Jan 15, 2024"

// Calculate progress
calculateProgress(raised, goal) // Returns percentage
```

## 📱 Responsive Breakpoints

```css
/* Desktop: Default */
/* Tablet: max-width: 968px */
/* Mobile: max-width: 768px */
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🎯 API Integration

All API calls are configured in `js/config.js`:

```javascript
// Login
fetch(API.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
})

// Get campaigns
fetch(API.CAMPAIGNS)

// Create campaign (requires auth)
fetch(API.CAMPAIGNS, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(campaignData)
})
```

## 🔐 Authentication Flow

1. User submits login form
2. Frontend sends credentials to `/api/auth/login`
3. Backend returns JWT token
4. Token stored in `localStorage`
5. Token included in subsequent API requests
6. User redirected based on role (Admin → Dashboard, User → My Campaigns)

## 📋 To-Do / Future Features

- [ ] Create campaign page
- [ ] Campaign details page
- [ ] Donation payment flow
- [ ] User profile page
- [ ] My campaigns page
- [ ] My donations page
- [ ] Image upload functionality
- [ ] Social sharing
- [ ] Email notifications
- [ ] Real-time updates
- [ ] Search autocomplete
- [ ] Advanced filters

## 🐛 Troubleshooting

### API Connection Issues

**Problem:** Can't connect to backend
**Solution:** 
1. Check backend is running
2. Verify API_URL in `config.js`
3. Check CORS settings in backend

### Images Not Loading

**Problem:** Campaign images not displaying
**Solution:**
1. Check image path is correct
2. Verify backend is serving static files
3. Use placeholder images as fallback

### Login Not Working

**Problem:** Login returns error
**Solution:**
1. Check credentials are correct
2. Verify backend `/api/auth/login` endpoint
3. Check browser console for errors
4. Clear localStorage and try again

## 📚 Additional Resources

- [Font Awesome Icons](https://fontawesome.com/icons)
- [Google Fonts](https://fonts.google.com/)
- [CSS Gradients](https://cssgradient.io/)
- [Placeholder Images](https://placeholder.com/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License - feel free to use for personal or commercial projects

---

**Built with ❤️ by the KindHeart Team**
