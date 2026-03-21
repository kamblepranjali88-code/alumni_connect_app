const BASE_URL = 'http://localhost:5000/api';
const alumniId = sessionStorage.getItem('userId');

if (!alumniId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

let allRequests = [];
let currentTab  = 'active';

// ===== LOAD DATA =====
async function loadConnections() {
    try {
        const response = await fetch(`${BASE_URL}/requests/alumni/${alumniId}`);
        allRequests    = await response.json();
        updateStats(allRequests);
        renderTab(currentTab);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('connectionsContent').innerHTML =
            '<p class="error-text">❌ Error loading connections.</p>';
    }
}

// ===== UPDATE STATS =====
function updateStats(requests) {
    const now       = new Date();
    const active    = requests.filter(r => r.status === 'accepted' && new Date(r.expires_at) > now).length;
    const completed = requests.filter(r => r.status === 'accepted' && new Date(r.expires_at) <= now).length;
    const pending   = requests.filter(r => r.status === 'pending').length;

    document.getElementById('activeCount').textContent    = active;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent   = pending;
}

// ===== SWITCH TAB =====
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    renderTab(tab);
}

// ===== RENDER TAB =====
function renderTab(tab) {
    const now    = new Date();
    let filtered = [];

    if (tab === 'active') {
        filtered = allRequests.filter(r =>
            r.status === 'accepted' && new Date(r.expires_at) > now
        );
    } else if (tab === 'completed') {
        filtered = allRequests.filter(r =>
            r.status === 'accepted' && new Date(r.expires_at) <= now
        );
    }

    renderCards(filtered, tab);
}

// ===== RENDER CARDS =====
function renderCards(requests, tab) {
    const container = document.getElementById('connectionsContent');
    container.innerHTML = '';

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${tab === 'active' ? 'fa-users' : 'fa-check-circle'}"></i>
                <p>${tab === 'active' ? 'No active mentees yet.' : 'No completed connections yet.'}</p>
            </div>`;
        return;
    }

    requests.forEach(req => {
        const student   = req.student || {};
        const avatarSrc = student.profile_photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'S')}&size=54&background=2563eb&color=fff`;

        const now       = new Date();
        const cardClass = tab === 'active' ? 'active-card' : 'completed-card';
        const statusLabel = tab === 'active' ? '✅ Active' : '✔️ Completed';
        const statusClass = tab === 'active' ? 'status-active' : 'status-completed';

        // Timer for active
        let timerHtml = '';
        if (tab === 'active' && req.accepted_at && req.expires_at) {
            const total     = new Date(req.expires_at) - new Date(req.accepted_at);
            const remaining = new Date(req.expires_at) - now;
            const percent   = Math.max(0, (remaining / total) * 100);
            const daysLeft  = Math.ceil(remaining / (1000 * 60 * 60 * 24));
            const fillClass = percent > 50 ? '' : percent > 25 ? 'warning' : 'critical';

            timerHtml = `
                <div class="timer-section">
                    <div class="timer-label">
                        <span>Connection Period</span>
                        <span>${daysLeft} days remaining</span>
                    </div>
                    <div class="timer-bar">
                        <div class="timer-fill ${fillClass}" style="width: ${percent}%"></div>
                    </div>
                </div>`;
        }

        const div = document.createElement('div');
        div.className = `connection-card ${cardClass}`;
        div.innerHTML = `
            <div class="person-info">
                <img src="${avatarSrc}" alt="${student.full_name}"
                     onerror="this.src='https://ui-avatars.com/api/?name=S&size=54&background=2563eb&color=fff'">
                <div>
                    <div class="person-name">${student.full_name || 'Unknown'}</div>
                    <div class="person-meta">
                        ${student.branch || '-'} • Year ${student.year || '-'}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            ${timerHtml}
            <div class="connection-message">
                <i class="fas fa-quote-left" style="color:#2563eb; font-size:11px; margin-right:6px;"></i>
                ${req.message}
            </div>
            <div class="connection-footer">
                <span class="connection-date">
                    <i class="fas fa-calendar"></i> ${formatDate(req.accepted_at)}
                </span>
                <div class="card-btns">
                    <button class="btn-view" onclick="viewStudentProfile(${student.student_id})">
                        <i class="fas fa-user"></i> View Profile
                    </button>
                    ${tab === 'active' ? `
                    <button class="btn-chat" disabled title="Coming soon">
                        <i class="fas fa-comments"></i> Chat (Coming Soon)
                    </button>` : ''}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function viewStudentProfile(studentId) {
    window.location.href = `view-student-profile.html?id=${studentId}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

loadConnections();