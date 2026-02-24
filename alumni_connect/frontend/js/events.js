const events = [
    {
        id: 1,
        title: "Alumni–Student Career Meetup",
        date: "25 March 2026",
        mode: "Offline",
        description: "Interact with alumni and gain insights into career paths.",
        registered: false
    },
    {
        id: 2,
        title: "Resume Building Workshop",
        date: "2 April 2026",
        mode: "Online",
        description: "Learn how to build an ATS-friendly resume.",
        registered: true
    },
    {
        id: 3,
        title: "Mock Interview Session",
        date: "10 April 2026",
        mode: "Online",
        description: "Practice mock interviews with experienced alumni.",
        registered: false
    }
];

const eventsGrid = document.getElementById("eventsGrid");

function renderEvents() {
    eventsGrid.innerHTML = "";

    events.forEach(event => {
        eventsGrid.innerHTML += `
            <div class="event-card">
                <div>
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-meta">
                        <i class="fas fa-calendar"></i> ${event.date} • ${event.mode}
                    </div>
                    <p class="event-description">${event.description}</p>
                </div>

                <div class="event-footer">
                    <span class="event-type">${event.mode}</span>
                    <button class="register-btn ${
                        event.registered ? "registered" : ""
                    }"
                    ${event.registered ? "disabled" : ""}
                    onclick="registerEvent(${event.id})">
                        ${event.registered ? "Registered" : "Register"}
                    </button>
                </div>
            </div>
        `;
    });
}

function registerEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    event.registered = true;
    renderEvents();

    /*
    BACKEND READY:
    POST /api/events/register
    */
}

renderEvents();