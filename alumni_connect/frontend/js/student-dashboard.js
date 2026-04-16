// Student Dashboard - Load student profile, stats, and recent updates

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard script started');

    // Get login session data
    const userId = sessionStorage.getItem('userId');
    const userType = sessionStorage.getItem('userType');

    console.log('User ID:', userId);
    console.log('User Type:', userType);

    // Check if student is logged in
    if (!userId || userType !== 'student') {
        alert('Please login first');
        window.location.href = '../html/login.html';
        return;
    }

    const API_BASE = 'https://alumni-connect-backend-yy97.onrender.com/api';

    // Get all required elements
    const displayNameEl = document.getElementById('displayName');
    const alumniCountEl = document.getElementById('alumniCount');
    const mentorshipLimitEl = document.getElementById('mentorshipLimit');
    const jobCountEl = document.getElementById('jobCount');
    const eventCountEl = document.getElementById('eventCount');
    const recentUpdatesEl = document.getElementById('recentUpdates');

    try {
        // ===== LOAD STUDENT PROFILE =====
        const profileRes = await fetch(`${API_BASE}/auth/student/profile/${userId}`);

        if (profileRes.ok) {
            const studentData = await profileRes.json();
            console.log('Student profile:', studentData);

            if (displayNameEl) {
                displayNameEl.textContent = studentData.full_name || 'Student';
            }
        } else if (profileRes.status === 404) {
            console.warn('Student profile not found');
            if (displayNameEl) {
                displayNameEl.textContent = 'Student';
            }
        } else {
            console.error('Failed to fetch student profile');
            if (displayNameEl) {
                displayNameEl.textContent = 'Student';
            }
        }

        // ===== LOAD STATS =====
        try {
            const statsRes = await fetch(`${API_BASE}/stats/dashboard`);

            if (statsRes.ok) {
                const stats = await statsRes.json();
                console.log('Stats:', stats);

                if (alumniCountEl) {
                    alumniCountEl.textContent = stats.alumni_count ?? 0;
                }

                if (jobCountEl) {
                    jobCountEl.textContent = stats.job_count ?? 0;
                }

                if (eventCountEl) {
                    eventCountEl.textContent = stats.event_count ?? 0;
                }

                if (mentorshipLimitEl) {
                    mentorshipLimitEl.textContent = stats.mentorship_limit || '0 / Month';
                }
            } else {
                console.warn('Failed to fetch stats');
            }
        } catch (statsError) {
            console.warn('Stats not available:', statsError);

            if (alumniCountEl) alumniCountEl.textContent = '0';
            if (jobCountEl) jobCountEl.textContent = '0';
            if (eventCountEl) eventCountEl.textContent = '0';
            if (mentorshipLimitEl) mentorshipLimitEl.textContent = '0 / Month';
        }

        // ===== LOAD RECENT UPDATES =====
        try {
            const updatesRes = await fetch(`${API_BASE}/updates/recent`);

            if (updatesRes.ok) {
                const updates = await updatesRes.json();
                console.log('Recent updates:', updates);

                if (recentUpdatesEl) {
                    if (Array.isArray(updates) && updates.length > 0) {
                        recentUpdatesEl.innerHTML = updates
                            .map(
                                (u) => `
                                    <li>
                                        <i class="fas fa-info-circle"></i>
                                        ${u.message}
                                    </li>
                                `
                            )
                            .join('');
                    } else {
                        recentUpdatesEl.innerHTML = `
                            <li>
                                <i class="fas fa-info-circle"></i>
                                No recent updates available
                            </li>
                        `;
                    }
                }
            } else {
                console.warn('Failed to fetch updates');

                if (recentUpdatesEl) {
                    recentUpdatesEl.innerHTML = `
                        <li>
                            <i class="fas fa-info-circle"></i>
                            Unable to load updates
                        </li>
                    `;
                }
            }
        } catch (updatesError) {
            console.warn('Updates not available:', updatesError);

            if (recentUpdatesEl) {
                recentUpdatesEl.innerHTML = `
                    <li>
                        <i class="fas fa-info-circle"></i>
                        Unable to load updates
                    </li>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);

        if (displayNameEl) displayNameEl.textContent = 'Student';
        if (alumniCountEl) alumniCountEl.textContent = '0';
        if (jobCountEl) jobCountEl.textContent = '0';
        if (eventCountEl) eventCountEl.textContent = '0';
        if (mentorshipLimitEl) mentorshipLimitEl.textContent = '0 / Month';

        if (recentUpdatesEl) {
            recentUpdatesEl.innerHTML = `
                <li>
                    <i class="fas fa-info-circle"></i>
                    Failed to load dashboard data
                </li>
            `;
        }
    }
});

// ===== LOGOUT FUNCTION =====
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../html/login.html';
}