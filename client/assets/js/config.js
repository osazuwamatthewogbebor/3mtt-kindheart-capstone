// API Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://localhost:3000/api'
    : 'https://kindheart-api.onrender.com/api';

// API Endpoints
const API = {
    // Auth
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
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

// Helper function to show toast notification
function showToast(message, type = 'info') {
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
