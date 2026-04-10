// Student Registration Form Handler

document.getElementById('submitBtn').addEventListener('click', async function(e) {
    e.preventDefault(); // Prevent form from submitting normally
    
    // Get form values
    const fullName = document.getElementById('fullName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const email = document.getElementById('email').value;
    const branch = document.getElementById('branch').value;
    const year = document.getElementById('year').value;
    const interestsInput = document.getElementById('interests').value;
    
    // Validate form
    if(!fullName || !rollNumber || !email || !branch || !year) {
        alert('Please fill all required fields');
        return;
    }
    
    // Process interests (comma separated to array)
    const interests = interestsInput ? interestsInput.split(',').map(i => i.trim()) : [];
    
    // Prepare data for API
    const studentData = {
        fullName: fullName,
        rollNumber: rollNumber,
        email: email,
        branch: branch,
        year: year,
        interests: interests
    };
    
    // Show loading state
    const btn = document.getElementById('submitBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Submitting...';
    btn.disabled = true;
    
    try {
        // Send to backend
        const response = await fetch('https://alumni-connect-backend-yy97.onrender.com/api/auth/student-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });
        
        const result = await response.json();
        
        if(response.ok) {
            // Success
            alert('✅ Success! ' + result.message);
            
            // Clear form
            document.getElementById('fullName').value = '';
            document.getElementById('rollNumber').value = '';
            document.getElementById('email').value = '';
            document.getElementById('branch').value = '';
            document.getElementById('year').value = '';
            document.getElementById('interests').value = '';
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Error from server
            alert('❌ Error: ' + result.message);
        }
    } catch(error) {
        console.error('Error:', error);
        alert('❌ Network error. Make sure server is running at https://alumni-connect-backend-yy97.onrender.com');
    } finally {
        // Reset button
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Add Enter key support
document.addEventListener('keypress', function(e) {
    if(e.key === 'Enter') {
        document.getElementById('submitBtn').click();
    }
});
