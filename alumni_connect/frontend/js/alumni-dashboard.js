// alumni-dashboard.js

function loadAlumniDashboard() {

    // Mock backend response (replace later with API)
    const dashboardData = {
        alumniName: "Rahul Patil",
        mentorshipRequests: 5,
        activeMentorships: 2,
        jobsPosted: 3,
        eventCount: 2,
        updates: [
            {
                icon: "fa-envelope",
                text: "New mentorship request from Ananya Sharma"
            },
            {
                icon: "fa-comments",
                text: "Mentorship chat session started with Rohan Desai"
            },
            {
                icon: "fa-calendar-alt",
                text: "Alumni–Student Meet scheduled on 28 March"
            }
        ]
    };

    // Populate header
    document.getElementById("alumni-name").innerText =
        `Welcome, ${dashboardData.alumniName}`;

    // Populate stats
    document.getElementById("requestCount").innerText =
        dashboardData.mentorshipRequests;

    document.getElementById("activeMentorships").innerText =
        dashboardData.activeMentorships;

    document.getElementById("jobsPosted").innerText =
        dashboardData.jobsPosted;

    document.getElementById("eventCount").innerText =
        dashboardData.eventCount;

    // Populate recent updates
    const updatesList = document.getElementById("alumniUpdates");
    updatesList.innerHTML = "";

    dashboardData.updates.forEach(update => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas ${update.icon}"></i> ${update.text}`;
        updatesList.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", loadAlumniDashboard);