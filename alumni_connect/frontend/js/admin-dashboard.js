// admin-dashboard.js

// ===== API BASE URL (works for local + deployed) =====
const API_BASE =
    window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://your-backend-domain.com/api"; // change to your deployed backend

let userChartInstance = null;
let mentorshipChartInstance = null;
let jobChartInstance = null;
let eventChartInstance = null;


// ===== FETCH DASHBOARD DATA =====
async function fetchDashboardData() {

    const token = localStorage.getItem("adminToken");

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = "login.html";
        return;
    }

    try {

        const res = await fetch(`${API_BASE}/admin/dashboard`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {

            if (res.status === 401) {
                alert("Session expired. Please login again.");
                localStorage.removeItem("adminToken");
                window.location.href = "login.html";
                return;
            }

            throw new Error(`Failed to load dashboard (${res.status})`);
        }

        return await res.json();

    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}


// ===== RENDER STATS =====
function renderStats(data) {

    document.getElementById("admin-name").innerText =
        `Welcome, ${data.adminName || "Admin"}`;

    document.getElementById("studentCount").innerText =
        data.students ?? 0;

    document.getElementById("alumniCount").innerText =
        data.alumni ?? 0;

    document.getElementById("pendingVerifications").innerText =
        data.pendingVerifications ?? 0;

    document.getElementById("eventCount").innerText =
        data.events ?? 0;
}


// ===== RENDER ALERTS =====
function renderAlerts(alerts) {

    const ul = document.getElementById("adminUpdates");

    if (!ul) return;

    ul.innerHTML = "";

    if (!alerts || alerts.length === 0) {

        const li = document.createElement("li");
        li.innerHTML = `<i class="fas fa-circle-info"></i> No updates available`;
        ul.appendChild(li);
        return;
    }

    alerts.forEach(alert => {

        const li = document.createElement("li");

        li.innerHTML =
            `<i class="fas ${alert.icon}"></i> ${alert.text}`;

        ul.appendChild(li);
    });
}


// ===== DESTROY OLD CHARTS =====
function destroyCharts() {

    [userChartInstance, mentorshipChartInstance, jobChartInstance, eventChartInstance]
        .forEach(chart => {
            if (chart) chart.destroy();
        });
}


// ===== RENDER CHARTS =====
function renderCharts(data) {

    destroyCharts();

    // ===== USER DISTRIBUTION =====
    userChartInstance = new Chart(document.getElementById("userChart"), {

        type: "doughnut",

        data: {
            labels: ["Students", "Alumni"],
            datasets: [{
                data: [
                    data.students ?? 0,
                    data.alumni ?? 0
                ],
                backgroundColor: ["#3b82f6", "#10b981"]
            }]
        },

        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "User Distribution"
                }
            }
        }
    });


    // ===== MENTORSHIP ACTIVITY =====
    mentorshipChartInstance = new Chart(document.getElementById("mentorshipChart"), {

        type: "bar",

        data: {
            labels: ["Active", "Completed"],
            datasets: [{
                label: "Mentorship Sessions",
                data: [
                    data.mentorships?.active ?? 0,
                    data.mentorships?.completed ?? 0
                ],
                backgroundColor: "#6366f1"
            }]
        },

        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Mentorship Activity"
                }
            }
        }
    });


    // ===== JOB OPPORTUNITIES =====
    jobChartInstance = new Chart(document.getElementById("jobChart"), {

        type: "pie",

        data: {
            labels: ["Internships", "Full-Time"],
            datasets: [{
                data: [
                    data.jobs?.internships ?? 0,
                    data.jobs?.fullTime ?? 0
                ],
                backgroundColor: ["#f59e0b", "#ef4444"]
            }]
        },

        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Job Opportunities"
                }
            }
        }
    });


    // ===== EVENT TREND =====
    eventChartInstance = new Chart(document.getElementById("eventChart"), {

        type: "line",

        data: {
            labels: data.eventTrend?.labels || ["Jan", "Feb", "Mar", "Apr"],
            datasets: [{
                label: "Events Conducted",
                data: data.eventTrend?.values || [0, 0, 0, 0],
                borderColor: "#22c55e",
                fill: false,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Events Trend"
                }
            }
        }
    });
}


// ===== LOADING STATE =====
function showLoading(isLoading) {

    const loader = document.getElementById("dashboardLoader");

    if (!loader) return;

    loader.style.display = isLoading ? "block" : "none";
}


// ===== LOAD DASHBOARD =====
async function loadDashboard() {

    showLoading(true);

    try {

        const data = await fetchDashboardData();

        if (!data) return;

        renderStats(data);
        renderAlerts(data.alerts);
        renderCharts(data);

    } catch (err) {

        console.error("Dashboard load error:", err);

        const alertsEl = document.getElementById("adminUpdates");

        if (alertsEl) {
            alertsEl.innerHTML =
                `<li style="color:red;">
                    <i class="fas fa-circle-exclamation"></i>
                    Failed to load dashboard
                </li>`;
        }

    } finally {

        showLoading(false);
    }
}


// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

    // Auto refresh dashboard every 60 seconds
    setInterval(loadDashboard, 60000);

});