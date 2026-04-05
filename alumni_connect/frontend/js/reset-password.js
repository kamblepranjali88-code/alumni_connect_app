// Get token and email from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const email = urlParams.get('email');

if (!token || !email) {
    alert('Invalid reset link. Please request a new password reset.');
    window.location.href = 'forgot-password.html';
}

document.getElementById('token').value = token;
document.getElementById('email').value = email;

// Password strength checker
document.getElementById('newPassword').addEventListener('input', function() {
    const password = this.value;
    const strengthDiv = document.getElementById('passwordStrength');
    
    let strength = '';
    let strengthClass = '';
    
    if (password.length === 0) {
        strength = '';
    } else if (password.length < 6) {
        strength = '❌ Too short (min 6 characters)';
        strengthClass = 'strength-weak';
    } else if (password.length < 8) {
        strength = '⚠️ Weak';
        strengthClass = 'strength-weak';
    } else if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8) {
        strength = '✅ Strong';
        strengthClass = 'strength-strong';
    } else if (password.length >= 8) {
        strength = '🟡 Medium';
        strengthClass = 'strength-medium';
    }
    
    strengthDiv.innerHTML = strength;
    strengthDiv.className = 'password-strength ' + strengthClass;
});

// Form submission
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const token = document.getElementById('token').value;
    const email = document.getElementById('email').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!newPassword || !confirmPassword) {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill in all fields';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 6) {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
    
    try {
        const response = await fetch('http://localhost:5000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, token, new_password: newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + data.message;
            successDiv.style.display = 'block';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (data.message || 'Failed to reset password');
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Network error. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
    }
});