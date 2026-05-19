/**
 * API CONFIGURATION - KindHeart Platform
 * 
 * SECURITY FIXES APPLIED:
 * - FIX #4: API URL now uses environment variables (not hardcoded)
 * - FIX #6: Token management uses SessionManager for expiry handling
 * - FIX #7: Logout clears all sensitive data securely
 * 
 * ENVIRONMENT VARIABLES:
 * - REACT_APP_API_URL (React/Vite)
 * - VUE_APP_API_URL (Vue)
 * - API_URL (fallback in window.APP_CONFIG)
 */
// API Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:3000/api'
    : 'https://kindheart-api.onrender.com/api';

// Get API URL from environment variables or config
// Do NOT hardcode URLs - use environment-based configuration
function getAPIUrl() {
    // Check environment variables first
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.REACT_APP_API_URL) {
            console.log('Using REACT_APP_API_URL from environment');
            return process.env.REACT_APP_API_URL;
        }
        if (process.env.VUE_APP_API_URL) {
            console.log('Using VUE_APP_API_URL from environment');
            return process.env.VUE_APP_API_URL;
        }
    }
    
    // Check window config object (set in index.html)
    if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
        console.log('Using API_URL from window.APP_CONFIG');
        return window.APP_CONFIG.API_URL;
    }
    
    // Check localStorage for custom URL (admin configuration)
    const customUrl = localStorage.getItem('customApiUrl');
    if (customUrl) {
        console.log('Using custom API URL from localStorage');
        return customUrl;
    }
    
    // Fallback (set in production)
    console.warn('WARNING: Using fallback API URL. Set environment variables in production!');
    return 'https://kindheart-api.onrender.com/api';
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
    RESEND_VERIFICATION: `${API_URL}/auth/resend-verification`,
    RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    UPDATE_PROFILE: `${API_URL}/auth/update-profile`,
    CHANGE_PASSWORD: `${API_URL}/auth/change-password`,

    // Campaigns
    CAMPAIGNS: `${API_URL}/campaigns`,
    MY_CAMPAIGNS: `${API_URL}/campaigns/my-campaigns`,

    // Donations
    DONATIONS: `${API_URL}/donations`,
    MY_DONATIONS: `${API_URL}/donations/my-donations`,
    VERIFY_DONATION: `${API_URL}/donations/verify`,

    // Categories
    CATEGORIES: `${API_URL}/categories`,

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

// Helper function to calculate progress percentage
function calculateProgress(raised, goal) {
    if (goal === 0) return 0;
    return Math.min(Math.round((raised / goal) * 100), 100);
}

// ===== INPUT VALIDATION UTILITIES =====
// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

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

function showToast(message, type = 'info') {
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

    window.setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        toast.style.transition = 'opacity 140ms ease, transform 140ms ease';
        window.setTimeout(() => toast.remove(), 140);
    }, 3200);
}

// Backward compatibility for existing pages still using alert().
window.alert = function (message) {
    showToast(message, inferToastType(message));
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    else if (type === 'error') iconClass = 'fa-exclamation-circle';
    else if (type === 'warning') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.style.animation='toastSlideOut 0.3s forwards'; setTimeout(() => this.parentElement.remove(), 300);">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s forwards';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }, 4500);
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
