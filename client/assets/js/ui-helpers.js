/**
 * UI Helper Functions
 * Common UI utilities for navigation, menus, and user interactions
 */

// Load user name in navigation
function loadUserName() {
    if (isLoggedIn()) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.name) {
                const navUserName = document.getElementById('navUserName');
                if (navUserName) {
                    navUserName.textContent = user.name.split(' ')[0]; // First name
                }
                const userName = document.getElementById('userName');
                if (userName) {
                    userName.textContent = user.name.split(' ')[0]; // First name
                }
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
