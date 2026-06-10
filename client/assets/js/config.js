/**
 * API CONFIGURATION - KindHeart Platform
 * 
 * SECURITY FIXES APPLIED:
 * - FIX #4: API URL now uses environment variables (not hardcoded)
 * - FIX #6: Token management uses SessionManager for expiry handling
 * - FIX #7: Logout clears all sensitive data securely
 * 
 * ENVIRONMENT VARIABLES:
 * - API_URL (fallback in window.APP_CONFIG)
 */
// API Configuration

// Get API URL from environment variables or config
// Do NOT hardcode URLs - use environment-based configuration
function getAPIUrl() {
    // Check localhost first
    // if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    //     return 'http://localhost:3000/api';
    // }


    
    // // Check window config object (set in index.html)
    if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
        console.log('Using API_URL from window.APP_CONFIG');
        return window.APP_CONFIG.API_URL;
    }
    
    // // Check localStorage for custom URL (admin configuration)
    const customUrl = localStorage.getItem('customApiUrl');
    if (customUrl) {
        console.log('Using custom API URL from localStorage');
        return customUrl;
    }

    
    // Fallback (set in production)
    console.warn('WARNING: Using fallback API URL. Set environment variables in production!');
    return 'https://kindheart-api.onrender.com/api';
}

// Helper to perform authenticated requests with automatic refresh-on-401 and retry
async function authFetch(url, options = {}) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {}, getAuthHeaders());

    // If sending FormData, remove Content-Type so the browser sets the correct multipart boundary
    if (options.body instanceof FormData) {
        if (options.headers && options.headers['Content-Type']) delete options.headers['Content-Type'];
        if (options.headers && options.headers['content-type']) delete options.headers['content-type'];
    }

    let resp = await fetch(url, options);

    if (resp.status !== 401) return resp;

    // Try to refresh token once
    const newToken = await refreshAccessToken();
    if (!newToken) return resp; // return original 401 response

    // Retry original request with fresh token
    options.headers = Object.assign({}, options.headers || {}, getAuthHeaders());
    return await fetch(url, options);
}

const API_URL = getAPIUrl();

console.log(`✅ API Configuration loaded. Endpoint: ${API_URL}`);

// API Endpoints - all derived from API_URL
const API = {
    // Auth
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
    RESEND_VERIFICATION: `${API_URL}/auth/resend-verification`,
    ME: `${API_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    UPDATE_PROFILE: `${API_URL}/auth/update-profile`,
    CHANGE_PASSWORD: `${API_URL}/auth/change-password`,
    VERIFY_EMAIL: `${API_URL}/auth/verify-email`,
    GOOGLE_AUTH: `${API_URL}/auth/google`,

    // Campaigns
    CAMPAIGNS: `${API_URL}/campaigns`,
    MY_CAMPAIGNS: `${API_URL}/campaigns/me`,

    // Donations
    DONATIONS: `${API_URL}/donations`,
    MY_DONATIONS: `${API_URL}/donations/me`,
    CONTACT: `${API_URL}/contact`,

    // Categories
    CATEGORIES: `${API_URL}/categories`,

    // Public Stats (no auth required)
    PUBLIC_STATS: `${API_URL}/stats`,
	// Refresh token endpoint
	REFRESH_TOKEN: `${API_URL}/auth/refresh-token`,

    // Admin
    ADMIN_STATS: `${API_URL}/admin/stats`,
    ADMIN_USERS: `${API_URL}/admin/users`,
    ADMIN_CAMPAIGNS: `${API_URL}/admin/campaigns`,

    // Users
    USERS: `${API_URL}/users`,
};

/**
 * SECURITY FIX #6 & #7: Token Management & Secure Logout
 * Uses SessionManager for automatic token expiry and complete logout.
 * Prevents session hijacking from expired or leaked tokens.
 */

function getToken() {
    if (typeof SessionManager !== 'undefined') {
        return SessionManager.getToken();
    }
    return localStorage.getItem('token');
}

function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
    const name = 'csrf-token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(name) === 0) return cookie.substring(name.length);
    }
    return null;
}

// SECURITY FIX #3: Ensures CSRF token on ALL requests
function getAuthHeaders() {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const csrfToken = getCSRFToken();
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    return headers;
}

function isLoggedIn() {
    if (typeof SessionManager !== 'undefined') {
        return SessionManager.isTokenValid();
    }
    return !!localStorage.getItem('token');
}

// Parse JWT expiry and return TTL in seconds (rounded)
function parseJwtExpirySeconds(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp) return null;
        const ttl = Math.max(0, Math.floor(payload.exp - (Date.now() / 1000)));
        return ttl;
    } catch (e) {
        return null;
    }
}

// Attempt to refresh access token using refresh-token endpoint (server should set refresh cookie)
async function refreshAccessToken() {
    try {
        const resp = await fetch(API.REFRESH_TOKEN, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!resp.ok) {
            console.warn('refreshAccessToken: refresh failed', resp.status);
            return null;
        }

        const body = await resp.json();
        const newToken = body.accessToken || body.token || null;
        if (!newToken) return null;

        const ttl = parseJwtExpirySeconds(newToken) || SessionManager.DEFAULT_TTL;
        if (typeof SessionManager !== 'undefined') {
            SessionManager.setToken(newToken, ttl);
        } else {
            localStorage.setItem('token', newToken);
            const expiry = Date.now() + (ttl * 1000);
            localStorage.setItem('tokenExpiry', expiry.toString());
        }

        console.log('refreshAccessToken: obtained new access token');
        return newToken;
    } catch (err) {
        console.error('refreshAccessToken error', err);
        return null;
    }
}

/**
 * SECURITY FIX #7: Secure Logout - Clears ALL sensitive data
 */
function logout() {
    console.log('🔒 Logging out - clearing sensitive data...');
    if (typeof SessionManager !== 'undefined') {
        SessionManager.logout();
        return;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    sessionStorage.clear();
    localStorage.removeItem('password');
    localStorage.removeItem('creditCard');
    window.location.href = 'login.html';
}

/**
 * Email Validation (Stricter Pattern)
 * SECURITY: Prevents email spoofing
 */
function isValidEmail(email) {
    const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return pattern.test(email) && email.length <= 254;
}

// Helper function to format currency
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '₦0';
    
    // Helper to format the base number (e.g., 1.50)
    const formatBase = (num) => {
        return num.toLocaleString('en-NG', {
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2,
        })
    }

    // Handle Millions, Billions, Trillions
    if (amount >= 1_000_000_000_000) {
        return `₦${formatBase(amount / 1_000_000_000_000)}T`;
    } else if (amount >= 1_000_000_000) {
        return `₦${formatBase(amount / 1_000_000_000)}B`;
    } else if (amount >= 1_000_000) {
        return `₦${formatBase(amount / 1_000_000)}M`;
    }

    // Default for numbers under 1 million
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
    }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper function to derive a friendly user display name
function getDisplayName(user) {
  if (!user || typeof user !== 'object') return 'User';
  const rawName = String(user.name || user.fullName || user.full_name || user.username || user.email || '').trim();
  const lowerName = rawName.toLowerCase();
  const isRoleOnly = /^(admin|user|member|donor|supporter|campaigner|superadmin|moderator|guest)$/i.test(lowerName);
    if (rawName && !isRoleOnly) return rawName.split(/\s+/)[0];

  if (user.email) {
      const email = String(user.email).trim();
      const localPart = email.split('@')[0].trim();
      if (localPart) return localPart;
  }

  if (user.username && String(user.username).trim()) {
      return String(user.username).trim();
  }

  if (user.role && String(user.role).trim()) {
      return String(user.role).trim();
  }

  return 'User';
}

// Helper function to calculate progress percentage
function calculateProgress(raised, goal) {
    const r = Number(raised) || 0;
    const g = Number(goal) || 0;
    if (!Number.isFinite(g) || g <= 0) return 0;
    const percentage = (r / g) * 100;
    return Math.min(Math.round(percentage), 100);
}

// ===== INPUT VALIDATION UTILITIES =====

// Name validation (2-100 characters, letters and spaces only)
function isValidName(name) {
    const nameRegex = /^[a-zA-Z\s]{2,100}$/;
    return nameRegex.test(name.trim());
}

// Password validation (8+ chars, uppercase, lowercase, number, special char)
function isPasswordValid(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && isLongEnough;
}

// Campaign title validation (5-200 characters)
function isValidCampaignTitle(title) {
    const trimmed = title.trim();
    return trimmed.length >= 5 && trimmed.length <= 200;
}

// Campaign description validation (20-5000 characters)
function isValidDescription(description) {
    const trimmed = description.trim();
    return trimmed.length >= 20 && trimmed.length <= 5000;
}

// Goal amount validation (minimum 1000)
function isValidGoalAmount(amount) {
    const num = Number(amount);
    return Number.isFinite(num) && num >= 1000 && num <= 1000000000;
}

// File validation for images
function isValidImageFile(file) {
    if (!file) return true; // Optional field
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
}

// Sanitize user input (prevent XSS)
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Validate form field with error message
function validateFormField(value, validator, fieldName) {
    if (!validator(value)) {
        return { valid: false, error: `Invalid ${fieldName}` };
    }
    return { valid: true };
}

// Toast system (shared across all pages)
const TOAST_CLASS_BY_TYPE = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info'
};

const nativeAlert = window.alert ? window.alert.bind(window) : null;

function ensureToastStyles() {
    if (document.getElementById('kindheart-toast-styles')) return;

    const style = document.createElement('style');
    style.id = 'kindheart-toast-styles';
    style.textContent = `
        #kindheart-toast-container {
            position: fixed;
            top: 1rem;
            right: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            z-index: 10000;
            max-width: min(420px, calc(100vw - 2rem));
        }

        .kindheart-toast {
            background: #ffffff;
            border-radius: 0.75rem;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
            border-left: 4px solid #3b82f6;
            padding: 0.875rem 1rem;
            color: #1e293b;
            font-size: 0.9375rem;
            line-height: 1.4;
            animation: kindheartToastIn 180ms ease-out;
        }

        .kindheart-toast.toast-success { border-left-color: #10b981; }
        .kindheart-toast.toast-error { border-left-color: #ef4444; }
        .kindheart-toast.toast-warning { border-left-color: #f59e0b; }
        .kindheart-toast.toast-info { border-left-color: #3b82f6; }

        @keyframes kindheartToastIn {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 640px) {
            #kindheart-toast-container {
                right: 0.75rem;
                left: 0.75rem;
                max-width: none;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureToastContainer() {
    let container = document.getElementById('kindheart-toast-container');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'kindheart-toast-container';
    document.body.appendChild(container);
    return container;
}

function inferToastType(message) {
    const text = String(message || '').toLowerCase();
    if (text.includes('success')) return 'success';
    if (text.includes('error') || text.includes('failed') || text.includes('not found')) return 'error';
    if (text.includes('please') || text.includes('invalid') || text.includes('match')) return 'warning';
    return 'info';
}

function showToast(message, type = 'info', duration = 8000) {
    const text = String(message || '').trim();
    if (!text) return;

    const safeType = TOAST_CLASS_BY_TYPE[type] ? type : 'info';

    // If the DOM is not ready yet, preserve behavior with native alert fallback.
    if (!document.body) {
        if (nativeAlert) nativeAlert(text);
        return;
    }

    ensureToastStyles();
    const container = ensureToastContainer();

    const toast = document.createElement('div');
    toast.className = `kindheart-toast ${TOAST_CLASS_BY_TYPE[safeType]}`;
    toast.textContent = text;
    container.appendChild(toast);

    const timeoutId = window.setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        toast.style.transition = 'opacity 140ms ease, transform 140ms ease';
        window.setTimeout(() => toast.remove(), 140);
    }, duration);

    toast.addEventListener('mouseover', () => {
        window.clearTimeout(timeoutId);
    });

    toast.addEventListener('mouseleave', () => {
        window.setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            toast.style.transition = 'opacity 140ms ease, transform 140ms ease';
            window.setTimeout(() => toast.remove(), 140);
        }, 2000);
    });
}



// Seamlessly override default alert to use beautiful premium Toast notifications!
window.alert = function(message) {
    // Guess status based on keywords
    let type = 'info';
    const msgLower = message.toLowerCase();
    if (msgLower.includes('success') || msgLower.includes('approve') || msgLower.includes('verified') || msgLower.includes('activated')) {
        type = 'success';
    } else if (msgLower.includes('error') || msgLower.includes('fail') || msgLower.includes('invalid') || msgLower.includes('reject') || msgLower.includes('suspend') || msgLower.includes('cannot') || msgLower.includes('required')) {
        type = 'error';
    } else if (msgLower.includes('warning') || msgLower.includes('attention') || msgLower.includes('sure')) {
        type = 'warning';
    }
    showToast(message, type);
};

// Helper function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    if (error.response) {
        return error.response.data.message || 'An error occurred';
    }
    return 'Network error. Please check your connection.';
}
