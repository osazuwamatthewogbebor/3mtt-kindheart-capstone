// Profile Page - Main Script
// Handles user profile management, editing, and password changes

// Check authentication
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

const user = JSON.parse(localStorage.getItem('user'));

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function toggleEdit(section) {
    const view = document.getElementById(section + 'View');
    const edit = document.getElementById(section + 'Edit');
    
    view.classList.toggle('hidden');
    edit.classList.toggle('hidden');
}

// Load profile
async function loadProfile() {
    try {
        const response = await fetch(API.ME, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (result.success) {
            const user = result.data;
            
            // Update display
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('profileAvatar').textContent = initials;
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('navUserName').textContent = user.name;
            document.getElementById('memberSince').textContent = formatDate(user.createdAt || user.created_at);

            document.getElementById('displayName').textContent = user.name;
            document.getElementById('displayEmail').textContent = user.email;
            document.getElementById('displayRole').textContent = user.role;
            document.getElementById('displayJoined').textContent = formatDate(user.createdAt || user.created_at);

            document.getElementById('editName').value = user.name;
            document.getElementById('editEmail').value = user.email;

            if (user.role === 'ADMIN') {
                document.getElementById('adminLink').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update profile
document.getElementById('updateProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    
    // Validate name
    if (!isValidName(name)) {
        showToast('Please enter a valid name (2-100 characters, letters and spaces only)', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    try {
        const response = await fetch(API.UPDATE_PROFILE, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'X-CSRF-Token': getCSRFToken() || ''
            },
            body: JSON.stringify({ name, email })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            showToast('Profile updated successfully!', 'success');
            
            // Update local storage
            const updatedUser = { ...user, ...data.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            loadProfile();
            toggleEdit('info');
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.message.includes('HTTP error')) {
            showToast('Server error. Please try again later.', 'error');
        } else if (error instanceof TypeError) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast('Error updating profile. Please try again.', 'error');
        }
    }
});

// Change password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate current password is not empty
    if (!currentPassword || currentPassword.length === 0) {
        showToast('Please enter your current password', 'error');
        return;
    }
    
    if (currentPassword.length > 500) {
        showToast('Current password is too long', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters long!', 'error');
        return;
    }

    // Validate password strength
    if (!isPasswordValid(newPassword)) {
        showToast('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 'error');
        return;
    }

    try {
        const response = await fetch(API.CHANGE_PASSWORD, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'X-CSRF-Token': getCSRFToken() || ''
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            showToast('Password changed successfully!', 'success');
            document.getElementById('changePasswordForm').reset();
            toggleEdit('password');
        } else {
            showToast(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.message.includes('HTTP error')) {
            showToast('Server error. Please try again later.', 'error');
        } else if (error instanceof TypeError) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast('Error changing password. Please try again.', 'error');
        }
    }
});

// Load stats
async function loadStats() {
    try {
        const userId = user.id;
        const response = await fetch(`${API.USERS}/${userId}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalCampaigns').textContent = data.data.total_campaigns || 0;
            document.getElementById('totalDonations').textContent = data.data.total_donations || 0;
            document.getElementById('totalRaised').textContent = formatCurrency(data.data.total_raised || 0);
            document.getElementById('totalDonated').textContent = formatCurrency(data.data.total_donated || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Initialize
loadProfile();
loadStats();
