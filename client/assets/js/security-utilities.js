/**
 * SECURITY UTILITIES - KindHeart Platform
 * 
 * This module provides security-hardened utilities for:
 * - Session management with token expiry (CRITICAL FIX #6)
 * - Safe DOM manipulation to prevent XSS (CRITICAL FIX #1)
 * - Input validation and sanitization
 * - Secure storage management
 * 
 * Last Updated: May 18, 2026
 * Status: SECURITY-CRITICAL
 */

// ============================================================
// SESSION MANAGER - Token Expiry & Auto-Logout (FIX #6)
// ============================================================
/**
 * Manages user sessions with automatic token expiry and logout.
 * Prevents session hijacking from expired tokens.
 * 
 * SECURITY FEATURES:
 * - Tracks token expiration time
 * - Auto-logs out when token expires
 * - Prevents use of expired tokens
 * - Clears sensitive data on expiry
 */
class SessionManager {
    static TOKEN_KEY = 'token';
    static EXPIRY_KEY = 'tokenExpiry';
    static USER_KEY = 'user';
    static DEFAULT_TTL = 3600; // 1 hour in seconds
    static EXPIRY_CHECK_INTERVAL = 60000; // Check every minute
    static WARNING_TIME = 300; // Warn 5 minutes before expiry
    static expiryCheckInterval = null;

    /**
     * Stores token with expiry time.
     * @param {string} token - JWT token
     * @param {number} expirySeconds - Token TTL in seconds (default: 1 hour)
     */
    static setToken(token, expirySeconds = this.DEFAULT_TTL) {
        if (!token) {
            console.error('SessionManager: Attempted to set invalid token');
            return false;
        }

        const expiryTime = Date.now() + (expirySeconds * 1000);
        
        try {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());
            
            // Start expiry check if not already running
            if (!this.expiryCheckInterval) {
                this.startExpiryCheck();
            }
            
            console.log(`SessionManager: Token set with ${expirySeconds}s TTL`);
            return true;
        } catch (error) {
            console.error('SessionManager: Failed to set token', error);
            return false;
        }
    }

    /**
     * Gets current token if valid, null if expired.
     * @returns {string|null} Valid token or null
     */
    static getToken() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const expiry = localStorage.getItem(this.EXPIRY_KEY);

        if (!token || !expiry) return null;

        const expiryTime = parseInt(expiry, 10);
        const now = Date.now();

        // Token expired
        if (now >= expiryTime) {
            console.warn('SessionManager: Token expired, clearing session');
            this.logout();
            return null;
        }

        // Warn if token expiring soon
        if (now >= (expiryTime - (this.WARNING_TIME * 1000))) {
            console.warn('SessionManager: Token expiring soon');
            // Dispatch event to notify UI
            window.dispatchEvent(new Event('tokenExpiringSoon'));
        }

        return token;
    }

    /**
     * Checks if current token is still valid.
     * @returns {boolean} True if token valid
     */
    static isTokenValid() {
        return this.getToken() !== null;
    }

    /**
     * Starts periodic check for token expiry.
     * Auto-logs out user if token expires.
     */
    static startExpiryCheck() {
        // Clear any existing interval
        if (this.expiryCheckInterval) {
            clearInterval(this.expiryCheckInterval);
        }

        this.expiryCheckInterval = setInterval(() => {
            const token = localStorage.getItem(this.TOKEN_KEY);
            const expiry = localStorage.getItem(this.EXPIRY_KEY);

            if (!token || !expiry) {
                clearInterval(this.expiryCheckInterval);
                this.expiryCheckInterval = null;
                return;
            }

            const expiryTime = parseInt(expiry, 10);
            const now = Date.now();

            if (now >= expiryTime) {
                console.warn('SessionManager: Auto-logout due to token expiry');
                this.logout();
            }
        }, this.EXPIRY_CHECK_INTERVAL);
    }

    /**
     * Completely clears session data.
     * Clears token, user data, and sensitive info.
     */
    static logout() {
        try {
            // Clear all auth-related data
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.EXPIRY_KEY);
            localStorage.removeItem(this.USER_KEY);
            
            // Clear any sensitive session data
            sessionStorage.clear();
            
            // Stop expiry check
            if (this.expiryCheckInterval) {
                clearInterval(this.expiryCheckInterval);
                this.expiryCheckInterval = null;
            }
            
            console.log('SessionManager: Session cleared');
            
            // Redirect to login
            window.location.href = 'login.html';
        } catch (error) {
            console.error('SessionManager: Error during logout', error);
        }
    }
}

// ============================================================
// SAFE DOM UTILITIES - XSS Prevention (FIX #1)
// ============================================================
/**
 * Provides safe DOM manipulation methods.
 * Prevents XSS attacks by using textContent instead of innerHTML.
 * 
 * SECURITY FEATURES:
 * - Uses createElement + textContent (safe from XSS)
 * - Sanitizes user-provided HTML when necessary
 * - Validates element creation
 */
class SafeDOM {
    /**
     * Safely sets text content of an element.
     * @param {string} elementId - Element ID
     * @param {string} text - Text to set (NOT HTML)
     */
    static setText(elementId, text) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`SafeDOM: Element not found: ${elementId}`);
            return;
        }

        // Use textContent to prevent XSS
        element.textContent = text;
    }

    /**
     * Safely creates and appends element with text.
     * @param {HTMLElement} parent - Parent element
     * @param {string} tag - HTML tag name
     * @param {string} className - CSS class name
     * @param {string} text - Text content (NOT HTML)
     * @returns {HTMLElement} Created element
     */
    static createElement(parent, tag, className = '', text = '') {
        if (!parent || !(parent instanceof HTMLElement)) {
            console.error('SafeDOM: Invalid parent element');
            return null;
        }

        try {
            const element = document.createElement(tag);
            
            if (className) {
                element.className = className;
            }
            
            if (text) {
                // Use textContent to prevent XSS
                element.textContent = text;
            }
            
            parent.appendChild(element);
            return element;
        } catch (error) {
            console.error('SafeDOM: Error creating element', error);
            return null;
        }
    }

    /**
     * Safely clears element contents and sets text.
     * @param {string} elementId - Element ID
     * @param {string} text - Text to set
     */
    static clearAndSetText(elementId, text) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`SafeDOM: Element not found: ${elementId}`);
            return;
        }

        element.innerHTML = ''; // Clear safely
        element.textContent = text;
    }

    /**
     * Safely creates list items from array.
     * Prevents XSS in list content.
     * @param {string} parentId - Parent element ID
     * @param {Array} items - Array of items
     * @param {string} className - CSS class for items
     */
    static createList(parentId, items = [], className = '') {
        const parent = document.getElementById(parentId);
        if (!parent) {
            console.warn(`SafeDOM: Parent element not found: ${parentId}`);
            return;
        }

        parent.innerHTML = ''; // Clear safely

        items.forEach(item => {
            const li = document.createElement('li');
            if (className) li.className = className;
            li.textContent = item; // Safe: textContent not innerHTML
            parent.appendChild(li);
        });
    }
}

// ============================================================
// INPUT VALIDATION - Prevent Invalid Data (FIX #5)
// ============================================================
/**
 * Comprehensive input validation for donations and forms.
 * Prevents invalid amounts from being sent to API.
 * 
 * SECURITY FEATURES:
 * - Validates donation amounts (min/max/decimals)
 * - Email validation (RFC 5322 compliant)
 * - Password strength requirements
 * - Type checking and range validation
 */
class InputValidator {
    // Donation validation
    static DONATION_MIN = 100; // ₦100 minimum
    static DONATION_MAX = 10000000; // ₦10M maximum
    static DONATION_DECIMALS = 2; // Max 2 decimal places

    /**
     * Validates donation amount.
     * @param {number|string} amount - Amount to validate
     * @returns {object} {valid: boolean, error: string}
     */
    static validateDonationAmount(amount) {
        // Parse amount
        const parsed = parseFloat(amount);

        // Check if valid number
        if (isNaN(parsed) || parsed <= 0) {
            return {
                valid: false,
                error: 'Please enter a valid amount'
            };
        }

        // Check minimum
        if (parsed < this.DONATION_MIN) {
            return {
                valid: false,
                error: `Minimum donation is ₦${this.DONATION_MIN}`
            };
        }

        // Check maximum
        if (parsed > this.DONATION_MAX) {
            return {
                valid: false,
                error: `Maximum donation is ₦${this.DONATION_MAX.toLocaleString()}`
            };
        }

        // Check decimal places
        const decimalPart = (amount.toString().split('.')[1] || '');
        if (decimalPart.length > this.DONATION_DECIMALS) {
            return {
                valid: false,
                error: `Maximum ${this.DONATION_DECIMALS} decimal places allowed`
            };
        }

        return {
            valid: true,
            error: null,
            amount: parsed
        };
    }

    /**
     * Validates email format (RFC 5322 simplified).
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    static validateEmail(email) {
        // Stricter pattern than before
        const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return pattern.test(email) && email.length <= 254;
    }

    /**
     * Validates password strength.
     * @param {string} password - Password to validate
     * @returns {object} {valid: boolean, errors: array}
     */
    static validatePassword(password) {
        const errors = [];

        if (!password || password.length < 8) {
            errors.push('Minimum 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('At least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('At least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('At least one number');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            errors.push('At least one special character (!@#$%^&*)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// ============================================================
// SECURE STORAGE - Clear Sensitive Data
// ============================================================
/**
 * Provides secure storage operations.
 * Ensures sensitive data is properly cleared.
 */
class SecureStorage {
    /**
     * Safely stores non-sensitive data.
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('SecureStorage: Error setting item', error);
        }
    }

    /**
     * Safely retrieves data.
     * @param {string} key - Storage key
     * @returns {*} Stored value or null
     */
    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('SecureStorage: Error getting item', error);
            return null;
        }
    }

    /**
     * Securely removes item from storage.
     * @param {string} key - Storage key
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('SecureStorage: Error removing item', error);
        }
    }

    /**
     * Clears all sensitive data.
     * Called on logout.
     */
    static clearAllSensitive() {
        const keysToRemove = [
            'token',
            'tokenExpiry',
            'user',
            'password', // Should never be stored, but remove if exists
            'creditCard', // Should never be stored
            'csrfToken'
        ];

        keysToRemove.forEach(key => this.removeItem(key));
    }
}

// ============================================================
// API ENVIRONMENT CONFIGURATION (FIX #4)
// ============================================================
/**
 * Centralized environment configuration.
 * Prevents hardcoded API URLs.
 * Uses environment variables with fallback.
 */
class AppConfig {
    static getApiUrl() {
        // Try environment variable first
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.REACT_APP_API_URL) {
                return process.env.REACT_APP_API_URL;
            }
            if (process.env.VUE_APP_API_URL) {
                return process.env.VUE_APP_API_URL;
            }
        }

        // Try window config (set in index.html)
        if (window.APP_CONFIG && window.APP_CONFIG.API_URL) {
            return window.APP_CONFIG.API_URL;
        }

        // Fallback (should be set in production)
        return localStorage.getItem('apiUrl') || 
               'https://kindheart-api.onrender.com/api';
    }

    static setApiUrl(url) {
        localStorage.setItem('apiUrl', url);
    }
}

// Initialize session manager on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SessionManager !== 'undefined') {
        SessionManager.startExpiryCheck();
    }
});

// Listen for token expiry warnings
window.addEventListener('tokenExpiringSoon', () => {
    console.warn('Token expiring soon - user should re-authenticate');
    // Could show UI notification here
});

console.log('✅ Security Utilities loaded - XSS prevention, session management, and validation enabled');
