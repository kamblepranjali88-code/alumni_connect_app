// frontend/js/admin-add-events.js
const BASE_URL = 'https://alumni-connect-backend-yy97.onrender.com/api';
const adminId  = sessionStorage.getItem('userId');
const userType = sessionStorage.getItem('userType') || sessionStorage.getItem('user_type');

// Guard — redirect if not admin
if (userType !== 'admin') {
    alert('Access denied. Admin only.');
    window.location.href = 'login.html';
}

let currentEventId   = null;
let currentEventName = '';
let allRegistrations = [];

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Toggle location label based on mode ──────────────────────────────────────
function toggleLocation() {
    const mode  = document.getElementById('eventMode').value;
    const label = document.getElementById('locationLabel');
    const input = document.getElementById('eventLocation');
    if (mode === 'Online') {
        label.textContent = 'Meeting Link (Google Meet / Zoom)';
        input.placeholder = 'https://meet.google.com/...';
    } else {
        label.textContent = 'Venue / Location';
        input.placeholder = 'e.g. Seminar Hall, Main Building';
    }
}

// ── Create Event ──────────────────────────────────────────────────────────────
document.getElementById('addEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    const payload = {
        title:                  document.getElementById('eventTitle').value.trim(),
        description:            document.getElementById('eventDesc').value.trim(),
        mode:                   document.getElementById('eventMode').value,
        location:               document.getElementById('eventLocation').value.trim(),
        event_date:             document.getElementById('eventDate').value,
        registration_deadline:  document.getElementById('eventDeadline').value,
        max_participants:       document.getElementById('eventMax').value || null,
        admin_id:               adminId
    };

    // Validate deadline is before event date
    if (new Date(payload.registration_deadline) >= new Date(payload.event_date)) {
        showToast('Registration deadline must be before the event date', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Create Event & Notify All';
        return;
    }

    try {
        const res  = await fetch(`${BASE_URL}/events/admin/create`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        showToast('✅ Event created! All users have been notified.', 'success');
        document.getElementById('addEventForm').reset();
        loadAdminEvents();

    } catch (err) {
        console.error('createEvent error:', err);
        showToast('❌ Failed to create event: ' + err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Create Event & Notify All';
    }
});

// ── Load Admin Events List ────────────────────────────────────────────────────
async function loadAdminEvents() {
    const container = document.getElementById('adminEventsList');
    container.innerHTML = `<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;

    try {
        const res  = await fetch(`${BASE_URL}/events/admin/all`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);
        renderAdminEvents(data.events);

    } catch (err) {
        container.innerHTML = `<p class="empty-text">Failed to load events.</p>`;
    }
}

function renderAdminEvents(events) {
    const container = document.getElementById('adminEventsList');

    if (!events || events.length === 0) {
        container.innerHTML = `<p class="empty-text"><i class="fas fa-calendar-times"></i> No events created yet.</p>`;
        return;
    }

    container.innerHTML = events.map(ev => {
        const dateStr = new Date(ev.event_date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const deadlineStr = new Date(ev.registration_deadline).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
        <div class="admin-event-item">
            <div class="admin-event-info">
                <div class="admin-event-title">${ev.title}</div>
                <div class="admin-event-meta">
                    <span><i class="fas fa-calendar"></i> ${dateStr}</span>
                    <span class="mode-tag ${ev.mode === 'Online' ? 'mode-online' : 'mode-offline'}">${ev.mode}</span>
                    <span><i class="fas fa-users"></i> ${ev.registered_count} registered
                        ${ev.max_participants ? `/ ${ev.max_participants}` : ''}
                    </span>
                    <span><i class="fas fa-clock"></i> Deadline: ${deadlineStr}</span>
                    ${!ev.is_active ? '<span class="inactive-tag">Removed</span>' : ''}
                </div>
            </div>
            <div class="admin-event-actions">
                <button class="btn-view-regs" onclick="openRegistrations(${ev.event_id}, '${ev.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-list"></i> Registrations (${ev.registered_count})
                </button>
                ${ev.is_active ? `
                <button class="btn-delete" onclick="deleteEvent(${ev.event_id})">
                    <i class="fas fa-trash"></i> Remove
                </button>` : ''}
            </div>
        </div>`;
    }).join('');
}

// ── Delete / Deactivate Event ─────────────────────────────────────────────────
async function deleteEvent(eventId) {
    if (!confirm('Remove this event? It will no longer appear for students and alumni.')) return;

    try {
        const res  = await fetch(`${BASE_URL}/events/admin/${eventId}`, { method: 'DELETE' });
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        showToast('Event removed.', 'success');
        loadAdminEvents();

    } catch (err) {
        showToast('Failed to remove event: ' + err.message, 'error');
    }
}

// ── View Registrations Modal ──────────────────────────────────────────────────
async function openRegistrations(eventId, eventName) {
    currentEventId   = eventId;
    currentEventName = eventName;

    document.getElementById('modalTitle').textContent = `Registrations — ${eventName}`;
    document.getElementById('regModal').style.display = 'flex';
    document.getElementById('regTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const res  = await fetch(`${BASE_URL}/events/admin/${eventId}/registrations`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        allRegistrations = data.registrations;
        renderRegistrationsTable(allRegistrations);

    } catch (err) {
        document.getElementById('regTableBody').innerHTML =
            '<tr><td colspan="5" style="text-align:center;color:#dc2626">Failed to load registrations</td></tr>';
    }
}

function renderRegistrationsTable(registrations) {
    const tbody  = document.getElementById('regTableBody');
    const count  = document.getElementById('regCount');
    count.textContent = `${registrations.length} registration${registrations.length !== 1 ? 's' : ''}`;

    if (registrations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">No registrations yet</td></tr>';
        return;
    }

    tbody.innerHTML = registrations.map((r, i) => {
        const regDate = new Date(r.registered_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return `
        <tr>
            <td>${i + 1}</td>
            <td>${r.full_name}</td>
            <td>${r.email}</td>
            <td><span class="type-badge type-${r.user_type}">${r.user_type}</span></td>
            <td>${regDate}</td>
        </tr>`;
    }).join('');
}

function closeModal() {
    document.getElementById('regModal').style.display = 'none';
    allRegistrations = [];
    currentEventId   = null;
}

// Close modal on overlay click
document.getElementById('regModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('regModal')) closeModal();
});

// ── Export to Excel (CSV) ─────────────────────────────────────────────────────
function exportToExcel() {
    if (!allRegistrations.length) {
        showToast('No data to export', 'error');
        return;
    }

    const headers = ['#', 'Full Name', 'Email', 'Type', 'Registered At'];
    const rows    = allRegistrations.map((r, i) => [
        i + 1,
        r.full_name,
        r.email,
        r.user_type,
        new Date(r.registered_at).toLocaleString('en-IN')
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${currentEventName.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('✅ Excel file downloaded!', 'success');
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadAdminEvents();
