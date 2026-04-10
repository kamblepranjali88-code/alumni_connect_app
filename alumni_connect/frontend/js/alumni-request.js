document.getElementById('submitBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    // Get form values
    const fullName       = document.getElementById('fullName').value.trim();
    const prnNumber      = document.getElementById('prnNumber').value.trim();
    const dateOfBirth    = document.getElementById('dob').value;
    const email          = document.getElementById('email').value.trim();
    const graduationYear = document.getElementById('graduationYear').value;
    const branch         = document.getElementById('branch').value;

    // ===== VALIDATIONS =====

    if (!fullName) {
        alert('⚠️ Please enter your Full Name');
        document.getElementById('fullName').focus();
        return;
    }
    if (fullName.length < 3) {
        alert('⚠️ Full Name must be at least 3 characters');
        document.getElementById('fullName').focus();
        return;
    }
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
        alert('⚠️ Full Name should only contain letters and spaces');
        document.getElementById('fullName').focus();
        return;
    }

    if (!prnNumber) {
        alert('⚠️ Please enter your PRN Number');
        document.getElementById('prnNumber').focus();
        return;
    }
    if (prnNumber.length < 4) {
        alert('⚠️ Please enter a valid PRN Number');
        document.getElementById('prnNumber').focus();
        return;
    }

    if (!dateOfBirth) {
        alert('⚠️ Please select your Date of Birth');
        document.getElementById('dob').focus();
        return;
    }
    const today = new Date();
    const dob = new Date(dateOfBirth);
    if (dob >= today) {
        alert('⚠️ Date of Birth cannot be today or a future date');
        document.getElementById('dob').focus();
        return;
    }
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 18 || age > 60) {
        alert('⚠️ Please enter a valid Date of Birth');
        document.getElementById('dob').focus();
        return;
    }

    if (!email) {
        alert('⚠️ Please enter your Email ID');
        document.getElementById('email').focus();
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('⚠️ Please enter a valid Email ID (e.g. name@gmail.com)');
        document.getElementById('email').focus();
        return;
    }

    if (!graduationYear) {
        alert('⚠️ Please select your Graduation Year');
        document.getElementById('graduationYear').focus();
        return;
    }

    if (!branch) {
        alert('⚠️ Please select your Branch');
        document.getElementById('branch').focus();
        return;
    }

    // Show loading
    const btn = document.getElementById('submitBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    try {
        const payload = {
            fullName,
            prnNumber,
            dateOfBirth,
            email,
            graduationYear,
            branch
        };

        console.log('Sending registration data:', payload);

        const response = await fetch('https://alumni-connect-backend-yy97.onrender.com/api/alumni/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Registration successful!\nCheck your email for login credentials.');
            window.location.href = 'login.html';
        } else {
            alert('❌ ' + result.message);
        }

    } catch (error) {
        console.error('Registration error:', error);
        alert('❌ Network error. Make sure server is running at https://alumni-connect-backend-yy97.onrender.com');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});
