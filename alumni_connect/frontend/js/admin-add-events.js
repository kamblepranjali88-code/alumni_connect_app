let adminEvents = [
    {
        title: "Alumni–Student Career Meetup",
        date: "2026-03-25",
        mode: "Offline",
        venue: "Auditorium",
        description: "Interact with alumni and discuss career paths"
    }
];

const adminEventsList = document.getElementById("adminEventsList");
const eventForm = document.getElementById("eventForm");

/* Render events */
function renderAdminEvents() {
    adminEventsList.innerHTML = "";

    if (adminEvents.length === 0) {
        adminEventsList.innerHTML = "<p>No events added yet.</p>";
        return;
    }

    adminEvents.forEach(event => {
        adminEventsList.innerHTML += `
            <div class="admin-event">
                <h3>${event.title}</h3>
                <div class="meta">${event.date} • ${event.venue}</div>
                <span class="mode">${event.mode}</span>
            </div>
        `;
    });
}

/* Submit event */
eventForm.addEventListener("submit", e => {
    e.preventDefault();

    const newEvent = {
        title: eventTitle.value,
        date: eventDate.value,
        mode: eventMode.value,
        venue: eventVenue.value,
        description: eventDescription.value
    };

    adminEvents.unshift(newEvent);
    renderAdminEvents();
    eventForm.reset();

    /*
    BACKEND READY:
    POST /api/admin/events
    */
});

/* Initial load */
renderAdminEvents();