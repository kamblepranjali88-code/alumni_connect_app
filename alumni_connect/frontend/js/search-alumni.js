const BASE_URL = 'http://localhost:5000/api';

const list               = document.getElementById('alumniList');
const searchInput        = document.getElementById('searchInput');
const filterBranch       = document.getElementById('filterBranch');
const filterYear         = document.getElementById('filterYear');
const filterAvailability = document.getElementById('filterAvailability');

const studentId = sessionStorage.getItem('userId');

if (!studentId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

let selectedAlumni   = null;
let studentRequests  = []; // stores student's existing requests

// ===== LOAD STUDENT REQUESTS FIRST =====
async function loadStudentRequests() {
    try {
        const response = await fetch(`${BASE_URL}/requests/student/${studentId}`);
        if (response.ok) {
            studentRequests = await response.json();
        }
    } catch (error) {
        console.error('Error loading student requests:', error);
    }
}

// ===== GET CONNECTION STATUS FOR ALUMNI =====
function getConnectionStatus(alumniId) {
    const now = new Date();
    const req = studentRequests.find(r => r.alumni?.alumni_id === alumniId);
    if (!req) return null;

    if (req.status === 'accepted' && new Date(req.expires_at) > now) return 'connected';
    if (req.status === 'accepted' && new Date(req.expires_at) <= now) return 'expired';
    if (req.status === 'pending') return 'pending';
    if (req.status === 'rejected') return 'rejected';
    return null;
}

// ===== FETCH ALUMNI FROM DB =====
async function fetchAlumni() {
    try {
        const params = new URLSearchParams();
        const search       = searchInput.value.trim();
        const branch       = filterBranch.value;
        const year         = filterYear.value;
        const availability = filterAvailability.value;

        if (search)       params.append('search', search);
        if (branch)       params.append('branch', branch);
        if (year)         params.append('graduation_year', year);
        if (availability) params.append('available_for_mentorship', availability);

        list.innerHTML = '<p class="loading-text">Loading alumni...</p>';

        const response = await fetch(`${BASE_URL}/alumni/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch alumni');

        const alumniData = await response.json();
        renderAlumni(alumniData);

    } catch (error) {
        console.error('Error:', error);
        list.innerHTML = '<p class="error-text">❌ Error loading alumni.</p>';
    }
}

// ===== RENDER ALUMNI CARDS =====
function renderAlumni(data) {
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<p class="no-results">No alumni found matching your search.</p>';
        return;
    }

    data.forEach(alumni => {
        const avatarSrc      = alumni.profile_photo ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=60&background=2563eb&color=fff`;
        const isAvailable    = alumni.available_for_mentorship;
        const connStatus     = getConnectionStatus(alumni.alumni_id);

        // Connection status badge
        let connBadge = '';
        let requestBtnHtml = '';

        if (connStatus === 'connected') {
            connBadge      = '<span class="conn-badge connected"><i class="fas fa-link"></i> Connected</span>';
            requestBtnHtml = '<button class="request-btn" disabled>Connected</button>';
        } else if (connStatus === 'pending') {
            connBadge      = '<span class="conn-badge pending-conn"><i class="fas fa-clock"></i> Request Sent</span>';
            requestBtnHtml = '<button class="request-btn" disabled>Pending</button>';
        } else if (connStatus === 'expired') {
            connBadge      = '<span class="conn-badge expired-conn"><i class="fas fa-history"></i> Previously Connected</span>';
            requestBtnHtml = isAvailable
                ? `<button class="request-btn" onclick="openRequestModal(${alumni.alumni_id}, '${alumni.full_name?.replace(/'/g, "\\'")}')">Request Again</button>`
                : '<button class="request-btn" disabled>Not Available</button>';
        } else {
            requestBtnHtml = isAvailable
                ? `<button class="request-btn" onclick="openRequestModal(${alumni.alumni_id}, '${alumni.full_name?.replace(/'/g, "\\'")}')">Request</button>`
                : '<button class="request-btn" disabled>Not Available</button>';
        }

        list.innerHTML += `
            <div class="alumni-item">
                <div class="alumni-avatar">
                    <img src="${avatarSrc}" alt="${alumni.full_name}"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=60&background=2563eb&color=fff'">
                </div>
                <div class="alumni-info">
                    <span class="alumni-name">${alumni.full_name || 'Unknown'}</span>
                    <span class="alumni-meta">
                        ${alumni.designation ? alumni.designation + ' at ' + (alumni.company || '') : (alumni.company || 'Not specified')}
                        <br>${alumni.branch || ''} • Passout ${alumni.graduation_year || ''}
                    </span>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <span class="badge ${isAvailable ? 'available' : 'unavailable'}">
                            ${isAvailable ? '✅ Available for Mentorship' : '❌ Not Available'}
                        </span>
                        ${connBadge}
                    </div>
                </div>
                <div class="actions">
                    <button class="view-btn" onclick="viewProfile(${alumni.user_id})">
                        View Profile
                    </button>
                    ${requestBtnHtml}
                </div>
            </div>
        `;
    });
}

// ===== VIEW PROFILE =====
function viewProfile(alumniUserId) {
    window.location.href = `view-alumni-profile.html?id=${alumniUserId}`;
}

// ===== OPEN REQUEST MODAL =====
async function openRequestModal(alumniId, alumniName) {
    try {
        const response = await fetch(`${BASE_URL}/requests/slots/${studentId}`);
        const slots    = await response.json();

        if (!slots.canSend) {
            alert(`❌ You cannot send more requests.\n\nYou have ${slots.activeCount} active mentor(s) and ${slots.pendingCount} pending request(s).\nMaximum allowed is 2.`);
            return;
        }

        selectedAlumni = { alumniId, alumniName };
        document.getElementById('modalAlumniName').textContent = alumniName;
        document.getElementById('requestMessage').value = '';
        document.getElementById('requestModal').style.display = 'flex';

    } catch (error) {
        alert('❌ Network error. Please try again.');
    }
}

// ===== CLOSE MODAL =====
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('requestModal').style.display = 'none';
    selectedAlumni = null;
});

// ===== SUBMIT REQUEST =====
document.getElementById('submitRequest').addEventListener('click', async () => {
    const message = document.getElementById('requestMessage').value.trim();

    if (!message || message.length < 10) {
        alert('⚠️ Please write a message of at least 10 characters.');
        return;
    }

    if (!selectedAlumni) return;

    const submitBtn = document.getElementById('submitRequest');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled    = true;

    try {
        const response = await fetch(`${BASE_URL}/requests/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: parseInt(studentId),
                alumni_id:  selectedAlumni.alumniId,
                message
            })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('requestModal').style.display = 'none';
            selectedAlumni = null;
            alert('✅ ' + result.message);
            // Reload requests and alumni
            await loadStudentRequests();
            fetchAlumni();
        } else {
            alert('❌ ' + result.message);
        }

    } catch (error) {
        alert('❌ Network error.');
    } finally {
        submitBtn.textContent = 'Send Request';
        submitBtn.disabled    = false;
    }
});

// ===== FILTERS =====
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchAlumni, 500);
});

filterBranch.addEventListener('change', fetchAlumni);
filterYear.addEventListener('change', fetchAlumni);
filterAvailability.addEventListener('change', fetchAlumni);

document.getElementById('clearFilters').addEventListener('click', () => {
    searchInput.value        = '';
    filterBranch.value       = '';
    filterYear.value         = '';
    filterAvailability.value = '';
    fetchAlumni();
});

// ===== LOGOUT =====
document.querySelector('.logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

// ===== INIT =====
async function init() {
    await loadStudentRequests(); // load requests first
    await fetchAlumni();          // then load alumni with connection status
}

init();