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
            
            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // Not valid JSON
            }

            if (!response.ok) {
                const message = data?.message || data?.error || `HTTP error! status: ${response.status}`;
                const lowerMessage = String(message || '').toLowerCase();
                const isVerificationError = response.status === 403 || lowerMessage.includes('verify') || lowerMessage.includes('verification');

                if (isVerificationError) {
                    showToast('Account not verified. Please verify your email before logging in.', 'warning');
                    const resendContainer = document.getElementById('resendVerificationContainer');
                    if (resendContainer) resendContainer.style.display = 'block';
                } else {
                    showToast(message, 'error');
                }
                return;
            }
            
            if (data.success !== false) {
                const requiresVerification =
                    data.requiresVerification === true ||
                    data.emailVerificationRequired === true ||
                    data.user?.isVerified === false ||
                    data.user?.verified === false ||
                    data.user?.emailVerified === false;

                if (requiresVerification) {
                    showToast('Account not verified. Please verify your email before logging in.', 'warning');
                    const resendContainer = document.getElementById('resendVerificationContainer');
                    if (resendContainer) resendContainer.style.display = 'block';
                    return;
                }

                // Store token and user info
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                showToast('Login successful!', 'success');
                
                // Redirect based on role with a slight delay so toast is visible
                setTimeout(() => {
                    if (data.user?.role === 'ADMIN') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                }, 1500);
            } else {
                showToast(data.message || 'Login failed. Please check your credentials.', 'error');
                if (data.message && (data.message.toLowerCase().includes('verify') || data.message.toLowerCase().includes('verification'))) {
                    const resendContainer = document.getElementById('resendVerificationContainer');
                    if (resendContainer) resendContainer.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error instanceof TypeError) {
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
            
            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // Not valid JSON
            }

            if (!response.ok) {
                const message = data?.message || data?.error || `HTTP error! status: ${response.status}`;
                showToast(message, 'error');
                return;
            }
            
            if (data.success !== false) {
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
                    setTimeout(() => {
                        window.location.href = `login.html?verification=required&email=${encodeURIComponent(email)}`;
                    }, 2000);
                    return;
                }

                showToast('Account created. Please verify your email before logging in.', 'success');
                setTimeout(() => {
                    window.location.href = `login.html?verification=required&email=${encodeURIComponent(email)}`;
                }, 2000);
            } else {
                showToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (error instanceof TypeError) {
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
            
            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                // Not valid JSON
            }

            if (!response.ok) {
                const message = data?.message || data?.error || `HTTP error! status: ${response.status}`;
                showToast(message, 'error');
                return;
            }
            
            if (data.success !== false) {
                showToast('Password reset link sent to your email!', 'success');
                document.getElementById('email').value = '';
            } else {
                showToast(data.message || 'Failed to send reset link. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            if (error instanceof TypeError) {
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

// Google Login Handler
function googleLogin() {
    window.location.href = API.GOOGLE_AUTH;
}

// Resend Verification Email Link Handler
async function resendVerificationEmail() {
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : '';

    // Validate email format
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    const resendButton = document.getElementById('resendVerificationBtn');
    const originalText = resendButton ? resendButton.innerHTML : '';

    if (resendButton) {
        resendButton.disabled = true;
        resendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';
    }

    try {
        const response = await fetch(API.RESEND_VERIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            // Not valid JSON
        }

        if (!response.ok) {
            const message = data?.message || data?.error || `HTTP error! status: ${response.status}`;
            showToast(message, 'error');
            return;
        }

        if (data.success !== false) {
            showToast(data.message || 'Verification email sent. Check your inbox.', 'success');
            return;
        }

        showToast(data.message || 'Could not resend verification email.', 'error');
    } catch (error) {
        console.error('Resend verification error:', error);
        if (error instanceof TypeError) {
            showToast('Network error. Please check your connection.', 'error');
        } else {
            showToast('Could not resend verification email right now.', 'error');
        }
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
        const resendContainer = document.getElementById('resendVerificationContainer');
        const emailInput = document.getElementById('email');
        
        // Initialize: hide resend verification container by default
        if (resendContainer) {
            resendContainer.style.display = 'none';
        }
        
        // If coming from registration with verification required, show the resend container
        if (queryParams.get('verification') === 'required') {
            showToast('Please verify your email to continue.', 'warning');
            const notice = document.getElementById('verificationNotice');
            if (notice) {
                notice.classList.remove('hidden');
            }
            if (resendContainer) {
                resendContainer.style.display = 'block';
            }
        }
        
        // Pre-fill email if provided in query params
        const emailParam = queryParams.get('email');
        if (emailParam && emailInput) {
            emailInput.value = decodeURIComponent(emailParam);
            if (queryParams.get('verification') === 'required' && resendContainer) {
                resendContainer.style.display = 'block';
            }
        }
    }
    
    // If on login or register page and already logged in, redirect
    if ((currentPage.includes('login.html') || currentPage.includes('register.html')) && isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html#campaigns';
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
    
    // Auto-verify email logic on verify.html
    if (currentPage.includes('verify.html')) {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');
        const statusDiv = document.getElementById('verifyStatus');
        
        const renderStatus = (html, toastMessage, toastType = 'info') => {
            if (statusDiv) statusDiv.innerHTML = html;
            if (toastMessage) showToast(toastMessage, toastType);
        };

        if (!token) {
            renderStatus(
                '<div class="alert alert-danger">Invalid or missing verification token. Please open the link from your email again.</div>',
                'Invalid verification token',
                'error',
            );
            return;
        }

        fetch(`${API.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));

                if (!res.ok || data.success === false) {
                    const message = data.message || 'Verification failed or token expired.';
                    renderStatus(
                        `<div class="alert alert-danger">${message}</div>`,
                        message,
                        'error',
                    );
                    return;
                }

                renderStatus(
                    '<div class="alert alert-success">Email verified successfully! Redirecting to login...</div>',
                    'Email verified successfully!',
                    'success',
                );

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            })
            .catch((err) => {
                console.error('Verification request failed:', err);
                renderStatus(
                    '<div class="alert alert-danger">Unable to verify your account right now. Please try again later.</div>',
                    'Network error during verification.',
                    'error',
                );
            });
    }
});

// Reset Password Form Handler
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('resetBtn');
        const originalText = btn.innerHTML;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        if (!isPasswordValid(password)) {
            showToast('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.', 'error');
            return;
        }
        
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');
        
        if (!token) {
            showToast('Invalid password reset token.', 'error');
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        btn.disabled = true;
        
        try {
            const response = await fetch(`${API.RESET_PASSWORD}/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (!response.ok || data.success === false) {
                showToast(data?.message || 'Reset failed', 'error');
                return;
            }
            
            showToast('Password reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                const loginUrl = new URL('login.html', window.location.href).href;
                window.location.href = loginUrl;
            }, 2500);
        } catch (error) {
            showToast('An error occurred during password reset.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

