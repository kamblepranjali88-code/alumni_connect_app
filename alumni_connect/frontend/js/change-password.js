// Change Password functionality

// Get userId from URL
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');

// Display User ID when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Change password page loaded');

    if (userId) {
        const display = document.getElementById('userIdDisplay');
        if (display) display.textContent = userId;
    } else {
        alert('Session expired. Please login again.');
        window.location.href = 'login.html';
    }
});

// Handle password change
document.getElementById('changePwdBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!newPassword || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    const btn = document.getElementById('changePwdBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Updating...';
    btn.disabled = true;

    try {
        const response = await fetch('https://alumni-connect-backend-yy97.onrender.com/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                new_password: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Password changed successfully! Redirecting to dashboard...');

            // ✅ Redirect to student dashboard after password change
            const userType = sessionStorage.getItem('userType');
            if (userType === 'alumni') {
                window.location.href = '/html/alumni-dashboard.html';
            } else {
                window.location.href = '/html/student-dashboard.html';
            }
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (error) {
        console.error('Password change error:', error);
        alert('❌ Network error. Make sure server is running.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Allow Enter key
document.getElementById('confirmPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('changePwdBtn').click();
    }
});