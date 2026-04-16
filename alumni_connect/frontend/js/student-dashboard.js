// Student Dashboard - Load student profile

document.addEventListener('DOMContentLoaded', async function () {
    console.log('1️⃣ Dashboard script started');

    // Get user_id from session storage (saved during login)
    const userId = sessionStorage.getItem('userId');
    const userType = sessionStorage.getItem('userType');
    console.log('2️⃣ User ID from session:', userId);
    console.log('2️⃣ User Type from session:', userType);

    // Auth check
    if (!userId || userType !== 'student') {
        console.log('3️⃣ Not logged in as student - redirecting');
        alert('Please login first');
        window.location.href = '../html/login.html';
        return;
    }

    const API_BASE = 'https://alumni-connect-backend-yy97.onrender.com/api';

    try {
        // ===== LOAD STUDENT PROFILE =====
        const url = `${API_BASE}/auth/student/profile/${userId}`;
        console.log('4️⃣ Fetching from:', url);

        const response = await fetch(url);
        console.log('5️⃣ Response status:', response.status);

        if (response.ok) {
            const studentData = await response.json();
            console.log('6️⃣ Student data received:', studentData);

            const nameElement = document.getElementById('displayName');
            if (nameElement) {
                nameElement.textContent = studentData.full_name || 'Student';
                console.log('8️⃣ Name updated to:', nameElement.textContent);
            }

        } else if (response.status === 404) {
            console.log('9️⃣ 404 - Student profile not found');
            document.getElementById('displayName').textContent = 'Student';
        } else {
            console.error('🔟 Failed to fetch student profile');
        }

        // ===== LOAD STATS =====
        try {
            const statsRes = await fetch(`${API_BASE}/stats/dashboard`);
            if (statsRes.ok) {
                const stats = await statsRes.json();
                if (document.getElementById('alumniCount'))
                    document.getElementById('alumniCount').textContent = stats.alumni_count || 0;
                if (document.getElementById('jobCount'))
                    document.getElementById('jobCount').textContent = stats.job_count || 0;
                if (document.getElementById('eventCount'))
                    document.getElementById('eventCount').textContent = stats.event_count || 0;
                if (document.getElementById('mentorshipLimit'))
                    document.getElementById('mentorshipLimit').textContent = stats.mentorship_limit || '0 / Month';
            }
        } catch (statsError) {
            console.warn('Stats not available:', statsError);
        }

        // ===== LOAD RECENT UPDATES =====
        try {
            const updatesRes = await fetch(`${API_BASE}/updates/recent`);
            if (updatesRes.ok) {
                const updates = await updatesRes.json();
                const list = document.getElementById('recentUpdates');
                if (list && updates.length > 0) {
                    list.innerHTML = updates.map(u => `
                        <li><i class="fas fa-info-circle"></i> ${u.message}</li>
                    `).join('');
                }
            }
        } catch (updatesError) {
            console.warn('Updates not available:', updatesError);
        }

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
});

// ===== LOGOUT =====
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../html/login.html';
}