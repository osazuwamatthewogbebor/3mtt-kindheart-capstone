// API Configuration
const API_URL = 'http://localhost:5000/api';

// API Endpoints
const API = {
    // Auth
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
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
    window.location.href = '/pages/login.html';
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
    // You can implement a toast library or custom toast here
    alert(message);
}

// Helper function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    if (error.response) {
        return error.response.data.message || 'An error occurred';
    }
    return 'Network error. Please check your connection.';
}
