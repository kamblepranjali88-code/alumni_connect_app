// Student Registration Form Handler

let isSubmitting = false; // ← prevents double submission

document.getElementById('submitBtn').addEventListener('click', async function(e) {
    e.preventDefault();

    // ✅ Prevent double submission
    if (isSubmitting) return;

    // Get form values
    const fullName = document.getElementById('fullName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const email = document.getElementById('email').value;
    const branch = document.getElementById('branch').value;
    const year = document.getElementById('year').value;
    const interestsInput = document.getElementById('interests').value;

    // Validate form
    if (!fullName || !rollNumber || !email || !branch || !year) {
        alert('Please fill all required fields');
        return;
    }

    // Process interests
    const interests = interestsInput ? interestsInput.split(',').map(i => i.trim()) : [];

    // Prepare data
    const studentData = { fullName, rollNumber, email, branch, year, interests };

    // Show loading state
    const btn = document.getElementById('submitBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Submitting...';
    btn.disabled = true;
    isSubmitting = true; // ✅ Lock submission

    try {
        const response = await fetch('https://alumni-connect-backend-yy97.onrender.com/api/auth/student-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ Success! ' + result.message);

            // Clear form
            document.getElementById('fullName').value = '';
            document.getElementById('rollNumber').value = '';
            document.getElementById('email').value = '';
            document.getElementById('branch').value = '';
            document.getElementById('year').value = '';
            document.getElementById('interests').value = '';

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } else {
            alert('❌ Error: ' + result.message);
            // ✅ Only unlock if error so they can try again
            isSubmitting = false;
            btn.textContent = originalText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Network error. Make sure server is running.');
        isSubmitting = false;
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// ✅ Enter key only on last input field, not entire document
document.getElementById('interests').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('submitBtn').click();
    }
});