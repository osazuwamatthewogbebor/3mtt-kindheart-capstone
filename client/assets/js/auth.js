// Login Form Handler
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate email format
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        
        // Validate password is not empty
        if (!password || password.length === 0) {
            showToast('Please enter your password', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        
        if (password.length > 500) {
            showToast('Password is too long', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        
        try {
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                const requiresVerification =
                    data.requiresVerification === true ||
                    data.emailVerificationRequired === true ||
                    data.user?.isVerified === false ||
                    data.user?.verified === false ||
                    data.user?.emailVerified === false;

                if (requiresVerification) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    showToast('Please verify your email before logging in.', 'warning');
                    return;
                }

                // Store token and user data
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showToast('Login successful!', 'success');
                
                // Redirect based on role
                if (data.user.role === 'ADMIN') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'my-campaigns.html';
                }
            } else {
                const verificationRequired =
                    data.requiresVerification === true ||
                    data.emailVerificationRequired === true ||
                    /verify|verification|confirm your email/i.test(data.message || '');

                if (verificationRequired) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    showToast(data.message || 'Please verify your email before logging in.', 'warning');
                    return;
                }

                showToast(data.message || 'Login failed. Please check your credentials.', 'error');
                alert(data.message || 'Login failed. Please try again.');
                if (data.message && (data.message.toLowerCase().includes('verify') || data.message.toLowerCase().includes('verification'))) {
                    const resendContainer = document.getElementById('resendVerificationContainer');
                    if (resendContainer) resendContainer.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.message.includes('HTTP error')) {
                showToast('Server error. Please try again later.', 'error');
            } else if (error instanceof TypeError) {
                showToast('Network error. Please check your connection.', 'error');
            } else {
                showToast('An error occurred. Please try again.', 'error');
            }
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Register Form Handler
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('registerBtn');
        const originalText = btn.innerHTML;
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
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
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        // Validate password strength (minimum 8 chars with uppercase, lowercase, number, special char)
        if (password.length < 8) {
            showToast('Password must be at least 8 characters long!', 'error');
            return;
        }
        if (!isPasswordValid(password)) {
            showToast('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 'error');
            return;
        }
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        btn.disabled = true;
        
        try {
            const response = await fetch(API.REGISTER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                const requiresVerification =
                    data.requiresVerification === true ||
                    data.emailVerificationRequired === true ||
                    data.user?.isVerified === false ||
                    data.user?.verified === false ||
                    data.user?.emailVerified === false;

                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (requiresVerification) {
                    showToast('Account created. Check your email and verify your account before logging in.', 'success');
                    window.location.href = 'login.html?verification=required';
                    return;
                }

                showToast('Account created. Please verify your email before logging in.', 'success');
                window.location.href = 'login.html?verification=required';
            } else {
                showToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (error.message.includes('HTTP error')) {
                showToast('Server error. Please try again later.', 'error');
            } else if (error instanceof TypeError) {
                showToast('Network error. Please check your connection.', 'error');
            } else {
                showToast('An error occurred. Please try again.', 'error');
            }
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Forgot Password Form Handler
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('forgotBtn');
        const originalText = btn.innerHTML;
        const email = document.getElementById('email').value.trim();
        
        // Validate email format
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        try {
            const response = await fetch(API.FORGOT_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Password reset link sent to your email!', 'success');
                document.getElementById('email').value = '';
            } else {
                showToast(data.message || 'Failed to send reset link. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            if (error.message.includes('HTTP error')) {
                showToast('Server error. Please try again later.', 'error');
            } else if (error instanceof TypeError) {
                showToast('Network error. Please check your connection.', 'error');
            } else {
                showToast('An error occurred. Please try again.', 'error');
            }
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Google Login Placeholder
function googleLogin() {
    showToast('Google Login is being integrated. Please use the email login for now.', 'info');
    // In a real implementation, you would use Firebase Auth or another Google OAuth library here
    // Example: auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    alert('Google Login is being integrated. Please use the email login for now.');
}

// Resend Verification Email Link Handler
async function resendVerificationEmail() {
    const emailInput = document.getElementById('email');
    if (!emailInput || !emailInput.value.trim()) {
        alert('Please enter your email address to resend the verification link.');
        return;
    }

    const email = emailInput.value.trim();
    const btn = document.getElementById('resendVerificationBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';
    btn.disabled = true;

    try {
        const response = await fetch(API.RESEND_VERIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert('Verification email has been resent successfully. Please check your inbox!');
            const resendContainer = document.getElementById('resendVerificationContainer');
            if (resendContainer) resendContainer.style.display = 'none';
        } else {
            alert(data.message || 'Failed to resend verification email. Please try again.');
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        alert('An error occurred while resending the verification email. Please check your network connection.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function resendVerificationEmail() {
    const emailInput = document.getElementById('email');
    const resendButton = document.getElementById('resendVerificationBtn');
    const email = emailInput ? emailInput.value.trim() : '';

    // Validate email format
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    const originalText = resendButton ? resendButton.innerHTML : '';

    if (resendButton) {
        resendButton.disabled = true;
        resendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }

    try {
        const response = await fetch(API.RESEND_VERIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (response.ok && data.success !== false) {
            showToast(data.message || 'Verification email sent. Check your inbox.', 'success');
            return;
        }

        showToast(data.message || 'Could not resend verification email.', 'error');
    } catch (error) {
        console.error('Resend verification error:', error);
        showToast('Could not resend verification email right now.', 'error');
    } finally {
        if (resendButton) {
            resendButton.disabled = false;
            resendButton.innerHTML = originalText;
        }
    }
}


// Password requirements update function (works with config.js validation utils)
function updatePasswordRequirements(password) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasLength = password.length >= 8;
    
    // Update requirement UI elements if they exist
    const reqs = {
        'req-upper': hasUpper,
        'req-lower': hasLower,
        'req-number': hasNumber,
        'req-special': hasSpecial,
        'req-length': hasLength
    };
    
    Object.entries(reqs).forEach(([id, met]) => {
        const element = document.getElementById(id);
        if (element) {
            if (met) {
                element.classList.add('met');
            } else {
                element.classList.remove('met');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes('login.html')) {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('verification') === 'required') {
            showToast('Your account was created. Please verify your email before logging in.', 'warning');
            const notice = document.getElementById('verificationNotice');
            if (notice) {
                notice.classList.remove('hidden');
            }
        }
    }
    
    // If on login or register page and already logged in, redirect
    if ((currentPage.includes('login.html') || currentPage.includes('register.html')) && isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'ADMIN') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'my-campaigns.html';
        }
    }

    // Registration page - attach password validation listener
    const registerPasswordInput = document.getElementById('password');
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', () => {
            updatePasswordRequirements(registerPasswordInput.value);
        });
    }

    // Profile password change page - attach password validation listener
    const profilePasswordInput = document.getElementById('newPassword');
    if (profilePasswordInput) {
        profilePasswordInput.addEventListener('input', () => {
            updatePasswordRequirements(profilePasswordInput.value);
        });
    }
});
