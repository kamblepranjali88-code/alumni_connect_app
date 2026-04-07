
// Login functionality

document.getElementById('loginBtn').addEventListener('click', async function (e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;

    if (!userId || !password) {
        alert('Please enter both User ID and password');
        return;
    }

    const btn = document.getElementById('loginBtn');
    const originalText = btn.textContent;

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const BASE_URL = 'http://localhost:5000/api';

    try {

        // ===== ADMIN LOGIN =====
        if (userId.toUpperCase().startsWith('ADMIN_')) {

            const response = await fetch(`${BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            const result = await response.json();

            if (response.ok) {

                sessionStorage.setItem('userId', result.admin_id);
                sessionStorage.setItem('userType', 'admin');
                sessionStorage.setItem('fullName', result.full_name);

                window.location.href = 'admin-dashboard.html';
                return;

            } else {
                alert('❌ ' + result.message);
                return;
            }
        }


        // ===== ALUMNI / STUDENT LOGIN =====

        const loginUrl = userId.startsWith('ALM_')
            ? `${BASE_URL}/alumni/login`
            : `${BASE_URL}/auth/login`;

        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        });

        const result = await response.json();

        if (response.ok) {

            sessionStorage.setItem('userId', result.user_id);
            sessionStorage.setItem('userType', result.user_type);

            if (result.login_count === 0) {

                window.location.href =
                    'change-password.html?userId=' + result.user_id;

            } else {

                const urlParams = new URLSearchParams(window.location.search);
                const redirectPage = urlParams.get('redirect');

                if (redirectPage) {
                    window.location.href = redirectPage;
                } else {

                    if (result.user_type === 'alumni') {
                        window.location.href = 'alumni-dashboard.html';
                    } else {
                        window.location.href = 'student-dashboard.html';
                    }

                }
            }

        } else {
            alert('❌ ' + result.message);
        }

    } catch (error) {

        console.error('Login error:', error);

        alert(
            '❌ Network error. Make sure server is running at http://localhost:5000'
        );

    } finally {

        btn.textContent = originalText;
        btn.disabled = false;

    }
});


// Allow Enter key to submit
document.getElementById('password').addEventListener('keypress', function (e) {

    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }

});

