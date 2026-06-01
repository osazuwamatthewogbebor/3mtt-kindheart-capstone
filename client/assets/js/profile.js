// Profile Page - Main Script
// Handles user profile management, editing, and password changes

// Defensive: only run if helpers exist
if (typeof isLoggedIn === 'undefined' || typeof authFetch === 'undefined' || typeof API === 'undefined') {
    console.warn('Profile script: required helpers not available yet. Initialization deferred.');
} else {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('user')) || null; } catch (e) { user = null; }

    function toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.toggle('show');
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest || !e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
    });

    function toggleEdit(section) {
        const view = document.getElementById(section + 'View');
        const edit = document.getElementById(section + 'Edit');
        if (!view || !edit) return;
        view.classList.toggle('hidden');
        edit.classList.toggle('hidden');
    }

    async function loadProfile() {
        try {
            const response = await authFetch(API.ME, { method: 'GET' });
            let result = {};
            try { result = await response.json(); } catch (e) { result = {}; }

            const u = result.data || result.user || result;
            if (!u) throw new Error('No user data');
            user = u;

            // Defensive DOM updates
            const initials = (user.name || 'User').split(' ').map(n => n[0] || '').join('').toUpperCase();
            const profileAvatar = document.getElementById('profileAvatar'); if (profileAvatar) profileAvatar.textContent = initials;
            const profileName = document.getElementById('profileName'); if (profileName) profileName.textContent = user.name || '';
            const profileEmail = document.getElementById('profileEmail'); if (profileEmail) profileEmail.textContent = user.email || '';
            const navUserName = document.getElementById('navUserName'); if (navUserName) navUserName.textContent = user.name || '';
            const memberSince = document.getElementById('memberSince'); if (memberSince) memberSince.textContent = formatDate(user.createdAt || user.created_at || new Date());

            const displayName = document.getElementById('displayName'); if (displayName) displayName.textContent = user.name || '';
            const displayEmail = document.getElementById('displayEmail'); if (displayEmail) displayEmail.textContent = user.email || '';
            const displayRole = document.getElementById('displayRole'); if (displayRole) displayRole.textContent = user.role || '';
            const displayJoined = document.getElementById('displayJoined'); if (displayJoined) displayJoined.textContent = formatDate(user.createdAt || user.created_at || new Date());

            const editName = document.getElementById('editName'); if (editName) editName.value = user.name || '';
            const editEmail = document.getElementById('editEmail'); if (editEmail) editEmail.value = user.email || '';

            if (user.role === 'ADMIN') {
                const adminLink = document.getElementById('adminLink'); if (adminLink) adminLink.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    function attachProfileFormHandler() {
        const form = document.getElementById('updateProfileForm');
        if (!form) return false;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('editName');
            const emailEl = document.getElementById('editEmail');
            const name = nameEl ? nameEl.value.trim() : '';
            const email = emailEl ? emailEl.value.trim() : '';
            if (!isValidName(name)) return showToast('Please enter a valid name (2-100 chars)', 'error');
            if (!isValidEmail(email)) return showToast('Please enter a valid email address', 'error');
            try {
                const resp = await authFetch(API.UPDATE_PROFILE, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
                if (!resp.ok) {
                    const txt = await resp.text().catch(() => '');
                    throw new Error(`Update failed (${resp.status}): ${txt}`);
                }
                const data = await resp.json().catch(() => ({}));
                const updated = data.data || data.user || {};
                showToast('Profile updated', 'success');
                const updatedLocal = Object.assign({}, user || {}, updated);
                localStorage.setItem('user', JSON.stringify(updatedLocal));
                await loadProfile();
                toggleEdit('info');
            } catch (err) {
                console.error('Error updating profile:', err);
                showToast(err.message || 'Failed to update profile', 'error');
            }
        });
        return true;
    }

    function attachChangePasswordHandler() {
        const form = document.getElementById('changePasswordForm');
        if (!form) return false;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPasswordEl = document.getElementById('currentPassword');
            const newPasswordEl = document.getElementById('newPassword');
            const confirmEl = document.getElementById('confirmPassword');
            const currentPassword = currentPasswordEl ? currentPasswordEl.value : '';
            const newPassword = newPasswordEl ? newPasswordEl.value : '';
            const confirmPassword = confirmEl ? confirmEl.value : '';
            if (!currentPassword) return showToast('Enter current password', 'error');
            if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
            if (!isPasswordValid(newPassword)) return showToast('Password must be 8+ chars, include upper/lower/number/special', 'error');
            try {
                const resp = await authFetch(API.CHANGE_PASSWORD, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
                if (!resp.ok) {
                    const txt = await resp.text().catch(() => '');
                    throw new Error(`Change password failed (${resp.status}): ${txt}`);
                }
                await resp.json().catch(() => ({}));
                showToast('Password updated', 'success');
                form.reset();
                toggleEdit('password');
            } catch (err) {
                console.error('Error changing password:', err);
                showToast(err.message || 'Failed to change password', 'error');
            }
        });
        return true;
    }

    function initProfileBindings() {
        const a1 = attachProfileFormHandler();
        const a2 = attachChangePasswordHandler();
        if (a1 && a2) { loadProfile(); loadStats(); return; }
        const observer = new MutationObserver((mutations, obs) => {
            const r1 = attachProfileFormHandler();
            const r2 = attachChangePasswordHandler();
            if (r1 && r2) { obs.disconnect(); loadProfile(); loadStats(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 5000);
    }

    initProfileBindings();
}

                await resp.json().catch(() => ({}));
                showToast('Password updated', 'success');
                form.reset();
                toggleEdit('password');
            } catch (err) {
                console.error('Error changing password:', err);
                showToast(err.message || 'Failed to change password', 'error');
            }
        });
        return true;
    }

    // Attach handlers when DOM elements are available. If not present, observe mutations for a short time.
    function initProfileBindings() {
        const attached1 = attachProfileFormHandler();
        const attached2 = attachChangePasswordHandler();
        // If both attached, load profile immediately
        if (attached1 && attached2) {
            loadProfile();
            loadStats();
            return;
        }

        // Observe for node additions (profile tab injection) for up to 5s
        const observer = new MutationObserver((mutations, obs) => {
            const a1 = attachProfileFormHandler();
            const a2 = attachChangePasswordHandler();
            if (a1 && a2) {
                obs.disconnect();
                loadProfile();
                loadStats();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Stop observing after 5s
        setTimeout(() => observer.disconnect(), 5000);
    }
    if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
    if (!isPasswordValid(newPassword)) return showToast('Password must be 8+ chars, include upper/lower/number/special', 'error');
    initProfileBindings();
        const resp = await authFetch(API.CHANGE_PASSWORD, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!resp.ok) {
            const txt = await resp.text().catch(() => '');
            throw new Error(`Change password failed (${resp.status}): ${txt}`);
        }

        const data = await resp.json().catch(() => ({}));
        showToast('Password updated', 'success');
        document.getElementById('changePasswordForm').reset();
        toggleEdit('password');
    } catch (err) {
        console.error('Error changing password:', err);
        showToast(err.message || 'Failed to change password', 'error');
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
            const tC = document.getElementById('totalCampaigns'); if (tC) tC.textContent = data.data.total_campaigns || 0;
            const tD = document.getElementById('totalDonations'); if (tD) tD.textContent = data.data.total_donations || 0;
            const tR = document.getElementById('totalRaised'); if (tR) tR.textContent = formatCurrency(data.data.total_raised || 0);
            const tDon = document.getElementById('totalDonated'); if (tDon) tDon.textContent = formatCurrency(data.data.total_donated || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Initialize
loadProfile();
loadStats();
