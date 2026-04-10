// Student Dashboard - Load student profile

document.addEventListener('DOMContentLoaded', async function() {
    console.log('1️⃣ Dashboard script started');
    
    // Get user_id from session storage (saved during login)
    const userId = sessionStorage.getItem('userId');
    console.log('2️⃣ User ID from session:', userId);
    
    if(!userId) {
        console.log('3️⃣ No user ID - redirecting');
        alert('Please login first');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const url = `https://alumni-connect-backend-yy97.onrender.com/api/auth/student/profile/${userId}`;
        console.log('4️⃣ Fetching from:', url);
        
        const response = await fetch(url);
        console.log('5️⃣ Response status:', response.status);
        
        if(response.ok) {
            const studentData = await response.json();
            console.log('6️⃣ Student data received:', studentData);
            
            // Update the welcome message with student's name
            const nameElement = document.getElementById('displayName');
            console.log('7️⃣ Name element:', nameElement);
            
            nameElement.textContent = studentData.full_name || 'Student';
            console.log('8️⃣ Name updated to:', nameElement.textContent);
            
        } else if(response.status === 404) {
            console.log('9️⃣ 404 - Student profile not found');
            document.getElementById('displayName').textContent = 'Student';
        } else {
            console.error('🔟 Failed to fetch student profile');
        }
    } catch(error) {
        console.error('❌ Error loading dashboard:', error);
    }
});

// Logout function
function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}
