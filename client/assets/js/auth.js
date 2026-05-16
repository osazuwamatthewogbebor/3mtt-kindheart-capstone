// Login Form Handler
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            console.log(data)
            
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
                
                // Show success message
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

                showToast(data.message || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('An error occurred. Please try again.', 'error');
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
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'warning');
            return;
        }

        // Validate password strength
        if (!isPasswordValid(password)) {
            showToast('Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.', 'warning');
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long!', 'warning');
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
            
            const data = await response.json();
            
            if (data.success) {
                const requiresVerification =
                    data.requiresVerification === true ||
                    data.emailVerificationRequired === true ||
                    data.user?.isVerified === false ||
                    data.user?.verified === false ||
                    data.user?.emailVerified === false;

                // New accounts should not be logged in until verification is complete.
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                if (requiresVerification) {
                    showToast('Account created. Check your email and verify your account before logging in.', 'warning');
                    window.location.href = 'login.html?verification=required';
                    return;
                }

                // Fallback for unexpected backend payloads that do not explicitly flag verification.
                showToast('Account created. Please verify your email before logging in.', 'warning');
                window.location.href = 'login.html?verification=required';
            } else {
                showToast(data.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('An error occurred. Please try again.', 'error');
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
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch(API.FORGOT_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Password reset link sent to your email!', 'success');
                document.getElementById('email').value = '';
            } else {
                showToast(data.message || 'Failed to send reset link. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showToast('An error occurred. Please try again.', 'error');
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
}

async function resendVerificationEmail() {
    const emailInput = document.getElementById('email');
    const resendButton = document.getElementById('resendVerificationBtn');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        showToast('Enter your email first, then resend the verification email.', 'warning');
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

// Check if user is already logged in
// Password strength validation
const PASSWORD_PATTERN = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    minLength: 6
};

function validatePasswordStrength(password) {
    return {
        uppercase: PASSWORD_PATTERN.uppercase.test(password),
        lowercase: PASSWORD_PATTERN.lowercase.test(password),
        number: PASSWORD_PATTERN.number.test(password),
        special: PASSWORD_PATTERN.special.test(password),
        length: password.length >= PASSWORD_PATTERN.minLength
    };
}

function isPasswordValid(password) {
    const validation = validatePasswordStrength(password);
    return validation.uppercase && validation.lowercase && validation.number && validation.special && validation.length;
}

function updatePasswordRequirements(passwordInputId, requirementsPrefix = '') {
    const passwordInput = document.getElementById(passwordInputId);
    if (!passwordInput) return;

    const validation = validatePasswordStrength(passwordInput.value);
    
    const requirements = ['upper', 'lower', 'number', 'special', 'length'];
    const validationKeys = ['uppercase', 'lowercase', 'number', 'special', 'length'];
    
    requirements.forEach((req, index) => {
        const reqId = requirementsPrefix ? `req-${req}-${requirementsPrefix}` : `req-${req}`;
        const reqElement = document.getElementById(reqId);
        if (reqElement) {
            if (validationKeys[index] && validation[validationKeys[index]]) {
                reqElement.classList.add('met');
            } else {
                reqElement.classList.remove('met');
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

    // Registration page - attach password validation
    const registerPasswordInput = document.getElementById('password');
    if (registerPasswordInput) {
        registerPasswordInput.addEventListener('input', () => updatePasswordRequirements('password'));
    }

    // Profile password change page - attach password validation
    const profilePasswordInput = document.getElementById('newPassword');
    if (profilePasswordInput) {
        profilePasswordInput.addEventListener('input', () => updatePasswordRequirements('newPassword', 'profile'));
    }
});
