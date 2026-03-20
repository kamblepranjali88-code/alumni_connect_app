const BASE_URL = 'http://localhost:5000/api/alumni';

// ===== GET USER ID FROM SESSION =====
const userId = sessionStorage.getItem('userId');
if (!userId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

// ===== LOAD DASHBOARD DATA =====
async function loadDashboard() {
    try {
        const response = await fetch(`${BASE_URL}/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to load dashboard');

        const alumni = await response.json();

        // Show alumni name
        document.getElementById('alumni-name').textContent =
            `Welcome, ${alumni.full_name || 'Alumni'}! 👋`;

        // Update stats (hardcoded for now — connect to DB later)
        document.getElementById('requestCount').textContent     = '0';
        document.getElementById('activeMentorships').textContent = '0';
        document.getElementById('jobsPosted').textContent       = '0';
        document.getElementById('eventCount').textContent       = '0';

        // Recent updates
        const updatesList = document.getElementById('alumniUpdates');
        updatesList.innerHTML = '';

        const updates = [
            { icon: 'fa-user-check', text: `Profile ${alumni.company ? 'complete' : 'incomplete — please update your profile'}` },
            { icon: 'fa-hands-helping', text: `Mentorship: ${alumni.available_for_mentorship ? 'You are available for mentorship' : 'You are not available for mentorship'}` },
            { icon: 'fa-info-circle', text: 'No new mentorship requests' }
        ];

        updates.forEach(update => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas ${update.icon}"></i> ${update.text}`;
            updatesList.appendChild(li);
        });

    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('alumni-name').textContent = 'Welcome, Alumni! 👋';
    }
}

// ===== LOGOUT =====
document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

// ===== LOAD ON PAGE LOAD =====
loadDashboard();