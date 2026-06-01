/**
 * UI Helper Functions
 * Common UI utilities for navigation, menus, and user interactions
 */

// Load user name in navigation
function loadUserName() {
    if (isLoggedIn()) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const displayName = (typeof getDisplayName === 'function' ? getDisplayName(user) : (user && (user.name || user.username) ? (user.name || user.username) : 'User')) || 'User';
            const firstName = displayName.split(' ')[0];
            const navUserName = document.getElementById('navUserName');
            if (navUserName) {
                navUserName.textContent = firstName;
            }
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = firstName;
            }
        } catch (error) {
            console.error('Error loading user name:', error);
        }
    }
}

// Toggle user dropdown menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        
        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});
