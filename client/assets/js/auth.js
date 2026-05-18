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
                // Store token and user data
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success message
                alert('Login successful!');
                
                // Redirect based on role
                if (data.user.role === 'ADMIN') {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'my-campaigns.html';
                }
            } else {
                alert(data.message || 'Login failed. Please try again.');
                if (data.message && (data.message.toLowerCase().includes('verify') || data.message.toLowerCase().includes('verification'))) {
                    const resendContainer = document.getElementById('resendVerificationContainer');
                    if (resendContainer) resendContainer.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred. Please try again.');
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
            alert('Passwords do not match!');
            return;
        }
        
        // Validate password length
        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
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
                // Store token and user data
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success message
                alert('Account created successfully!');
                
                // Redirect to dashboard or campaigns page
                window.location.href = 'my-campaigns.html';
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred. Please try again.');
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
                alert('Password reset link sent to your email!');
                document.getElementById('email').value = '';
            } else {
                alert(data.message || 'Failed to send reset link. Please try again.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Google Login Placeholder
function googleLogin() {
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

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    
    // If on login or register page and already logged in, redirect
    if ((currentPage.includes('login.html') || currentPage.includes('register.html')) && isLoggedIn()) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role === 'ADMIN') {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'my-campaigns.html';
        }
    }
});
