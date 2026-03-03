// Login functionality

document.getElementById('loginBtn').addEventListener('click', async function(e) {
    e.preventDefault(); // Prevent form from submitting normally
    
    // Get form values
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    
    // Validate
    if(!userId || !password) {
        alert('Please enter both User ID and password');
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('loginBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Logging in...';
    btn.disabled = true;
    
    try {
        // Send login request to backend
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                password: password
            })
        });
        
        const result = await response.json();
        
        if(response.ok) {
            // Save user info in session
            sessionStorage.setItem('userId', result.user_id);
            sessionStorage.setItem('userType', result.user_type);
            
            if(result.login_count === 0) {
                // First time login - redirect to change password
                window.location.href = 'change-password.html?userId=' + result.user_id;
            } else {
                // Normal login - redirect to dashboard
                window.location.href = 'student-dashboard.html';
                // You can create dashboard.html later
                // alert('Login successful! Redirecting to dashboard...');
            }
        } else {
            // Show error message from server
            alert('❌ Error: ' + result.message);
        }
    } catch(error) {
        console.error('Login error:', error);
        alert('❌ Network error. Make sure server is running at http://localhost:5000');
    } finally {
        // Reset button
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Allow Enter key to submit
document.getElementById('password').addEventListener('keypress', function(e) {
    if(e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});