// frontend/js/events.js
const BASE_URL  = 'http://localhost:5000/api';
const userId    = sessionStorage.getItem('userId');
const userType  = sessionStorage.getItem('userType') || sessionStorage.getItem('user_type');

let allEvents = [];

// ── Load events from backend ──────────────────────────────────────────────────
async function loadEvents() {
    const grid = document.getElementById('eventsGrid');
    grid.innerHTML = `<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Loading events...</div>`;

    try {
        const url = userId && userType
            ? `${BASE_URL}/events?user_id=${userId}&user_type=${userType}`
            : `${BASE_URL}/events`;

        const res  = await fetch(url);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        allEvents = data.events;
        renderEvents(allEvents);

    } catch (err) {
        console.error('loadEvents error:', err);
        grid.innerHTML = `<p class="error-text">❌ Failed to load events. Please refresh.</p>`;
    }
}

// ── Render event cards ────────────────────────────────────────────────────────
function renderEvents(events) {
    const grid = document.getElementById('eventsGrid');
    grid.innerHTML = '';

    if (!events || events.length === 0) {
        grid.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <p>No upcoming events at the moment. Check back soon!</p>
            </div>`;
        return;
    }

    events.forEach(event => {
        const eventDate   = new Date(event.event_date);
        const deadline    = new Date(event.registration_deadline);
        const now         = new Date();
        const isPast      = eventDate < now;
        const deadlinePassed = deadline < now;

        const dateStr     = eventDate.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const timeStr     = eventDate.toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });
        const deadlineStr = deadline.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const daysLeft    = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        const urgentClass = daysLeft <= 3 && !deadlinePassed ? 'deadline-urgent' : '';

        let btnHtml = '';
        if (event.is_registered) {
            btnHtml = `<button class="register-btn registered" disabled>
                           <i class="fas fa-check"></i> Registered
                       </button>`;
        } else if (deadlinePassed || isPast) {
            btnHtml = `<button class="register-btn closed" disabled>
                           <i class="fas fa-lock"></i> Closed
                       </button>`;
        } else if (event.is_full) {
            btnHtml = `<button class="register-btn closed" disabled>
                           <i class="fas fa-users"></i> Full
                       </button>`;
        } else {
            btnHtml = `<button class="register-btn" onclick="registerEvent(${event.event_id})">
                           <i class="fas fa-calendar-plus"></i> Register
                       </button>`;
        }

        const card = document.createElement('div');
        card.className = `event-card${isPast ? ' past-event' : ''}`;
        card.innerHTML = `
            <div class="event-card-top">
                <div class="event-mode-badge ${event.mode === 'Online' ? 'badge-online' : 'badge-offline'}">
                    <i class="fas ${event.mode === 'Online' ? 'fa-video' : 'fa-map-marker-alt'}"></i>
                    ${event.mode}
                </div>
                ${isPast ? '<div class="event-past-badge">Past</div>' : ''}
            </div>

            <h3 class="event-title">${event.title}</h3>

            <div class="event-meta">
                <span><i class="fas fa-calendar"></i> ${dateStr} at ${timeStr}</span>
                ${event.location ? `<span><i class="fas fa-map-pin"></i> ${event.location}</span>` : ''}
                <span><i class="fas fa-users"></i> ${event.registered_count} registered
                    ${event.max_participants ? `/ ${event.max_participants} max` : ''}
                </span>
            </div>

            <p class="event-description">${event.description}</p>

            <div class="event-footer">
                <div class="event-deadline ${urgentClass}">
                    <i class="fas fa-clock"></i>
                    ${deadlinePassed ? 'Registration closed' : `Register by ${deadlineStr}`}
                    ${!deadlinePassed && daysLeft <= 3 ? ` · <strong>${daysLeft}d left</strong>` : ''}
                </div>
                ${btnHtml}
            </div>
        `;
        grid.appendChild(card);
    });
}

// ── Register for event ────────────────────────────────────────────────────────
async function registerEvent(eventId) {
    if (!userId || !userType) {
        alert('Please log in to register for events.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const res  = await fetch(`${BASE_URL}/events/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ event_id: eventId, user_id: userId, user_type: userType })
        });
        const data = await res.json();

        if (!data.success) {
            alert(data.message || 'Registration failed');
            return;
        }

        // Update local state and re-render
        const event = allEvents.find(e => e.event_id === eventId);
        if (event) {
            event.is_registered    = true;
            event.registered_count = (event.registered_count || 0) + 1;
        }
        renderEvents(allEvents);

    } catch (err) {
        console.error('registerEvent error:', err);
        alert('Something went wrong. Please try again.');
    }
}

// ── Init ──────────────────────────────────────────────────────────────────────
loadEvents();