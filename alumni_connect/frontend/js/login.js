// Login functionality

document.getElementById('loginBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    const userId   = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;

    if (!userId || !password) {
        alert('Please enter both User ID and password');
        return;
    }

    const btn = document.getElementById('loginBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        // Auto detect route based on User ID prefix
        const loginUrl = userId.startsWith('ALM_')
            ? 'http://localhost:5000/api/alumni/login'
            : 'http://localhost:5000/api/auth/login';

        console.log('Login URL:', loginUrl);
        console.log('User ID:', userId);

        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });

        const result = await response.json();

        if (response.ok) {
            // Save user info in session
            sessionStorage.setItem('userId', result.user_id);
            sessionStorage.setItem('userType', result.user_type);

            if (result.login_count === 0) {
                // First time login → change password
                window.location.href = 'change-password.html?userId=' + result.user_id;
            } else {
                // ===== CHECK FOR REDIRECT URL =====
                const urlParams   = new URLSearchParams(window.location.search);
                const redirectPage = urlParams.get('redirect');

                if (redirectPage) {
                    // Redirect to the page from email link
                    window.location.href = redirectPage;
                } else {
                    // Normal redirect based on user type
                    if (result.user_type === 'alumni') {
                        window.location.href = 'alumni-dashboard.html';
                    } else {
                        window.location.href = 'student-dashboard.html';
                    }
                }
            }
        } else {
            alert('❌ Error: ' + result.message);
        }

    } catch (error) {
        console.error('Login error:', error);
        alert('❌ Network error. Make sure server is running at http://localhost:5000');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Allow Enter key to submit
document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});