const BASE_URL  = 'http://localhost:5000/api';
const studentId = sessionStorage.getItem('userId');

if (!studentId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

let allRequests  = [];
let currentTab   = 'active';

// ===== LOAD DATA =====
async function loadConnections() {
    try {
        const [requestsRes, slotsRes] = await Promise.all([
            fetch(`${BASE_URL}/requests/student/${studentId}`),
            fetch(`${BASE_URL}/requests/slots/${studentId}`)
        ]);

        allRequests      = await requestsRes.json();
        const slots      = await slotsRes.json();

        updateStats(allRequests, slots);
        renderTab(currentTab);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('connectionsContent').innerHTML =
            '<p class="error-text">❌ Error loading connections.</p>';
    }
}

// ===== UPDATE STATS =====
function updateStats(requests, slots) {
    const now = new Date();
    const active    = requests.filter(r => r.status === 'accepted' && new Date(r.expires_at) > now).length;
    const pending   = requests.filter(r => r.status === 'pending').length;
    const completed = requests.filter(r => r.status === 'accepted' && new Date(r.expires_at) <= now).length;

    document.getElementById('activeCount').textContent     = active;
    document.getElementById('pendingCount').textContent    = pending;
    document.getElementById('completedCount').textContent  = completed;
    document.getElementById('slotsAvailable').textContent  = slots.slotsAvailable || 0;
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
    const now      = new Date();
    let filtered   = [];

    if (tab === 'active') {
        filtered = allRequests.filter(r =>
            r.status === 'accepted' && new Date(r.expires_at) > now
        );
    } else if (tab === 'pending') {
        filtered = allRequests.filter(r => r.status === 'pending');
    } else if (tab === 'completed') {
        filtered = allRequests.filter(r =>
            r.status === 'accepted' && new Date(r.expires_at) <= now
        );
    } else if (tab === 'rejected') {
        filtered = allRequests.filter(r => r.status === 'rejected');
    }

    renderCards(filtered, tab);
}

// ===== RENDER CARDS =====
function renderCards(requests, tab) {
    const container = document.getElementById('connectionsContent');
    container.innerHTML = '';

    if (requests.length === 0) {
        const messages = {
            active:    { icon: 'fa-handshake', text: 'No active mentors yet.', link: true },
            pending:   { icon: 'fa-clock',     text: 'No pending requests.', link: true },
            completed: { icon: 'fa-check-circle', text: 'No completed connections yet.', link: false },
            rejected:  { icon: 'fa-times-circle', text: 'No rejected requests.', link: false }
        };
        const m = messages[tab];
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${m.icon}"></i>
                <p>${m.text}</p>
                ${m.link ? '<a href="search-alumni.html" class="btn-find"><i class="fas fa-search"></i> Find Alumni</a>' : ''}
            </div>`;
        return;
    }

    requests.forEach(req => {
        const alumni    = req.alumni || {};
        const avatarSrc = alumni.profile_photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=54&background=2563eb&color=fff`;

        const now       = new Date();
        const cardClass = tab === 'active'    ? 'active-card'    :
                         tab === 'pending'   ? 'pending-card'   :
                         tab === 'completed' ? 'completed-card' : 'rejected-card';

        const statusLabel = tab === 'active'    ? '✅ Active'    :
                           tab === 'pending'   ? '⏳ Pending'   :
                           tab === 'completed' ? '✔️ Completed' : '❌ Rejected';

        const statusClass = tab === 'active'    ? 'status-active'    :
                           tab === 'pending'   ? 'status-pending'   :
                           tab === 'completed' ? 'status-completed' : 'status-rejected';

        // Timer bar for active connections
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

        const viewBtn = `
            <button class="btn-view" onclick="viewAlumniProfile(${alumni.alumni_id})">
                <i class="fas fa-user"></i> View Profile
            </button>`;

        const chatBtn = tab === 'active' ? `
            <button class="btn-chat" disabled title="Coming soon">
                <i class="fas fa-comments"></i> Chat (Coming Soon)
            </button>` : '';

        const div = document.createElement('div');
        div.className = `connection-card ${cardClass}`;
        div.innerHTML = `
            <div class="person-info">
                <img src="${avatarSrc}" alt="${alumni.full_name}"
                     onerror="this.src='https://ui-avatars.com/api/?name=A&size=54&background=2563eb&color=fff'">
                <div>
                    <div class="person-name">${alumni.full_name || 'Unknown'}</div>
                    <div class="person-meta">
                        ${alumni.designation ? alumni.designation + ' at ' + (alumni.company || '') : (alumni.company || '-')}
                        <br>${alumni.branch || ''}
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
                    <i class="fas fa-calendar"></i> ${formatDate(req.created_at)}
                </span>
                <div class="card-btns">
                    ${viewBtn}
                    ${chatBtn}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function viewAlumniProfile(alumniUserId) {
    window.location.href = `view-alumni-profile.html?id=${alumniUserId}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ===== LOGOUT =====
document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

loadConnections();