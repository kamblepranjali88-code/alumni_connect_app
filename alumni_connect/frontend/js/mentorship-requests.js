const BASE_URL = 'http://localhost:5000/api';
const alumniId = sessionStorage.getItem('userId');

if (!alumniId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

async function loadRequests() {
    try {
        const response = await fetch(`${BASE_URL}/requests/alumni/${alumniId}`);
        if (!response.ok) throw new Error('Failed to load');
        const requests = await response.json();
        renderRequests(requests);
        updateStats(requests);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('requestsList').innerHTML =
            '<p class="error-text">❌ Error loading requests.</p>';
    }
}

function updateStats(requests) {
    document.getElementById('pendingCount').textContent  = requests.filter(r => r.status === 'pending').length;
    document.getElementById('activeCount').textContent   = requests.filter(r => r.status === 'accepted').length;
    document.getElementById('rejectedCount').textContent = requests.filter(r => r.status === 'rejected').length;
}

function renderRequests(requests) {
    const container = document.getElementById('requestsList');
    container.innerHTML = '';

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No mentorship requests yet.</p>
            </div>`;
        return;
    }

    const sorted = [...requests].sort((a, b) => {
        const order = { pending: 0, accepted: 1, rejected: 2 };
        return order[a.status] - order[b.status];
    });

    sorted.forEach(req => {
        const student   = req.student || {};
        const avatarSrc = student.profile_photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'S')}&size=52&background=2563eb&color=fff`;

        const statusClass = `status-${req.status}`;
        const statusLabel = req.status === 'pending'  ? '⏳ Pending'  :
                           req.status === 'accepted' ? '✅ Active'   : '❌ Rejected';

        // Action buttons — only for pending
        const actionBtns = req.status === 'pending' ? `
            <div class="action-btns">
                <button class="accept-btn" onclick="handleRequest(${req.request_id}, 'accept')">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="reject-btn" onclick="handleRequest(${req.request_id}, 'reject')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>` : '';

        const now       = new Date();
        const isExpired = req.expires_at && new Date(req.expires_at) < now;
        const expiryInfo = req.expires_at && req.status === 'accepted' ? `
            <div class="expiry-info ${isExpired ? 'expired' : 'active'}">
                <i class="fas fa-clock"></i>
                ${isExpired
                    ? 'Connection ended on ' + formatDate(req.expires_at)
                    : 'Active until ' + formatDate(req.expires_at)}
            </div>` : '';

        const div = document.createElement('div');
        div.className = `request-card card-${req.status}`;
        div.id        = `req-${req.request_id}`;
        div.innerHTML = `
            <div class="request-student-info">
                <img src="${avatarSrc}" alt="${student.full_name}"
                     onerror="this.src='https://ui-avatars.com/api/?name=S&size=52&background=2563eb&color=fff'">
                <div>
                    <div class="student-name">${student.full_name || 'Unknown'}</div>
                    <div class="student-meta">
                        ${student.branch || '-'} • Year ${student.year || '-'}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="request-message">
                <i class="fas fa-quote-left"></i> ${req.message}
            </div>
            ${expiryInfo}
            <div class="request-footer">
                <span class="request-date">
                    <i class="fas fa-calendar"></i> ${formatDate(req.created_at)}
                </span>
                <div class="action-btns">
                    <button class="view-profile-btn" onclick="viewStudentProfile(${student.student_id})">
                        <i class="fas fa-user"></i> View Profile
                    </button>
                    ${actionBtns}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function viewStudentProfile(studentId) {
    window.location.href = `view-student-profile.html?id=${studentId}`;
}

async function handleRequest(requestId, action) {
    const confirmMsg = action === 'accept'
        ? '✅ Accept this request? Connection will be active for 15 days and student will be notified via email.'
        : '❌ Reject this request? Student will be notified via email.';

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${BASE_URL}/requests/${requestId}/${action}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ ' + result.message);
            loadRequests();
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Network error.');
    }
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

loadRequests();