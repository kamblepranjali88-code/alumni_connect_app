// admin-dashboard.js

document.addEventListener("DOMContentLoaded", () => {

    // Mock backend response (replace with API later)
    const data = {
        adminName: "Admin",
        students: 1240,
        alumni: 320,
        pendingVerifications: 6,
        events: 3,
        mentorships: {
            active: 180,
            completed: 420
        },
        jobs: {
            internships: 90,
            fullTime: 65
        },
        alerts: [
            { icon: "fa-user-clock", text: "6 alumni registrations pending verification" },
            { icon: "fa-calendar-check", text: "New event scheduled for April" },
            { icon: "fa-triangle-exclamation", text: "Mentorship limit reached by some students" }
        ]
    };

    // Populate text data
    document.getElementById("admin-name").innerText = `Welcome, ${data.adminName}`;
    document.getElementById("studentCount").innerText = data.students;
    document.getElementById("alumniCount").innerText = data.alumni;
    document.getElementById("pendingVerifications").innerText = data.pendingVerifications;
    document.getElementById("eventCount").innerText = data.events;

    // Alerts
    const alerts = document.getElementById("adminUpdates");
    alerts.innerHTML = "";
    data.alerts.forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas ${a.icon}"></i> ${a.text}`;
        alerts.appendChild(li);
    });

    // ===== CHARTS =====

    new Chart(document.getElementById("userChart"), {
        type: "doughnut",
        data: {
            labels: ["Students", "Alumni"],
            datasets: [{
                data: [data.students, data.alumni],
                backgroundColor: ["#3b82f6", "#10b981"]
            }]
        },
        options: {
            plugins: { title: { display: true, text: "User Distribution" } }
        }
    });

    new Chart(document.getElementById("mentorshipChart"), {
        type: "bar",
        data: {
            labels: ["Active", "Completed"],
            datasets: [{
                label: "Mentorship Sessions",
                data: [data.mentorships.active, data.mentorships.completed],
                backgroundColor: "#6366f1"
            }]
        },
        options: {
            plugins: { title: { display: true, text: "Mentorship Activity" } }
        }
    });

    new Chart(document.getElementById("jobChart"), {
        type: "pie",
        data: {
            labels: ["Internships", "Full-Time"],
            datasets: [{
                data: [data.jobs.internships, data.jobs.fullTime],
                backgroundColor: ["#f59e0b", "#ef4444"]
            }]
        },
        options: {
            plugins: { title: { display: true, text: "Job Opportunities" } }
        }
    });

    new Chart(document.getElementById("eventChart"), {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr"],
            datasets: [{
                label: "Events Conducted",
                data: [1, 2, 3, data.events],
                borderColor: "#22c55e",
                fill: false
            }]
        },
        options: {
            plugins: { title: { display: true, text: "Events Trend" } }
        }
    });

});
