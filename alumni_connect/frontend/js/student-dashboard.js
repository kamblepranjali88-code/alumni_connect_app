// student-dashboard.js

// This function will be called after backend integration
function loadStudentDashboard() {

    // Example API response (replace later with fetch)
    const dashboardData = {
        studentName: "Pranjali",
        alumniCount: 120,
        mentorshipLimit: "2 / Month",
        jobCount: 35,
        eventCount: 4,
        updates: [
            {
                icon: "fa-envelope",
                text: "Mentorship request accepted by Rahul Patil"
            },
            {
                icon: "fa-briefcase",
                text: "New internship posted by alumni at Infosys"
            },
            {
                icon: "fa-calendar-alt",
                text: "Alumni–Student Meet scheduled on 25 March"
            }
        ]
    };

    // Populate data
    document.getElementById("student-name").innerText =
        `Welcome, ${dashboardData.studentName}`;

    document.getElementById("alumniCount").innerText =
        dashboardData.alumniCount;

    document.getElementById("mentorshipLimit").innerText =
        dashboardData.mentorshipLimit;

    document.getElementById("jobCount").innerText =
        dashboardData.jobCount;

    document.getElementById("eventCount").innerText =
        dashboardData.eventCount;

    // Recent Updates
    const updatesList = document.getElementById("recentUpdates");
    updatesList.innerHTML = "";

    dashboardData.updates.forEach(update => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas ${update.icon}"></i> ${update.text}`;
        updatesList.appendChild(li);
    });
}

// Call on page load
document.addEventListener("DOMContentLoaded", loadStudentDashboard);