// API Configuration
const API_URL = 'https://kindheart-api.onrender.com/api';

// API Endpoints
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

    // Users
    USERS: `${API_URL}/users`,
};

// Helper function to get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Helper function to check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Helper function to logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
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
};

// Helper function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    if (error.response) {
        return error.response.data.message || 'An error occurred';
    }
    return 'Network error. Please check your connection.';
}
