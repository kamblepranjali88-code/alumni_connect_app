// ===============================
// ADMIN DASHBOARD JS
// ===============================

// Detect environment (local vs deployed)
const API_BASE =
    window.location.hostname === "localhost"
        ? "http://localhost:5000/api"
        : "https://your-backend-domain.com/api"; // CHANGE THIS

let userChart = null;
let mentorshipChart = null;
let jobChart = null;
let eventChart = null;


// ===============================
// AUTH CHECK
// ===============================
function checkAuth() {

    const token = localStorage.getItem("adminToken");

    if (!token) {

        alert("Session expired. Please login again.");

        window.location.href = "admin-login.html";

        return false;
    }

    return token;
}


// ===============================
// FETCH DASHBOARD DATA
// ===============================
async function fetchDashboardData() {

    const token = checkAuth();

    if (!token) return;

    try {

        const response = await fetch(`${API_BASE}/admin/dashboard`, {

            method: "GET",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }

        });

        if (response.status === 401) {

            localStorage.removeItem("adminToken");

            alert("Session expired. Please login again.");

            window.location.href = "admin-login.html";

            return;
        }

        if (!response.ok) {
            throw new Error(`Server error (${response.status})`);
        }

        return await response.json();

    } catch (error) {

        console.error("Dashboard API Error:", error);

        throw error;
    }
}


// ===============================
// RENDER STATS
// ===============================
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


// ===============================
// RENDER ALERTS
// ===============================
function renderAlerts(alerts) {

    const ul = document.getElementById("adminUpdates");

    if (!ul) return;

    ul.innerHTML = "";

    if (!alerts || alerts.length === 0) {

        const li = document.createElement("li");

        li.innerHTML =
            `<i class="fas fa-info-circle"></i> No updates available`;

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


// ===============================
// DESTROY OLD CHARTS
// ===============================
function destroyCharts() {

    if (userChart) userChart.destroy();
    if (mentorshipChart) mentorshipChart.destroy();
    if (jobChart) jobChart.destroy();
    if (eventChart) eventChart.destroy();
}


// ===============================
// RENDER CHARTS
// ===============================
function renderCharts(data) {

    destroyCharts();

    // USER DISTRIBUTION
    userChart = new Chart(document.getElementById("userChart"), {

        type: "doughnut",

        data: {
            labels: ["Students", "Alumni"],

            datasets: [{
                data: [
                    data.students ?? 0,
                    data.alumni ?? 0
                ],

                backgroundColor: [
                    "#3b82f6",
                    "#10b981"
                ]
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


    // MENTORSHIP ACTIVITY
    mentorshipChart = new Chart(document.getElementById("mentorshipChart"), {

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


    // JOB CHART
    jobChart = new Chart(document.getElementById("jobChart"), {

        type: "pie",

        data: {
            labels: ["Internships", "Full-Time"],

            datasets: [{
                data: [
                    data.jobs?.internships ?? 0,
                    data.jobs?.fullTime ?? 0
                ],

                backgroundColor: [
                    "#f59e0b",
                    "#ef4444"
                ]
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


    // EVENT TREND
    eventChart = new Chart(document.getElementById("eventChart"), {

        type: "line",

        data: {

            labels: data.eventTrend?.labels || [
                "Jan",
                "Feb",
                "Mar",
                "Apr"
            ],

            datasets: [{
                label: "Events Conducted",

                data: data.eventTrend?.values || [0, 0, 0, 0],

                borderColor: "#22c55e",

                tension: 0.3,

                fill: false
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


// ===============================
// LOADING STATE
// ===============================
function showLoading(state) {

    const loader = document.getElementById("dashboardLoader");

    if (!loader) return;

    loader.style.display = state ? "block" : "none";
}


// ===============================
// LOAD DASHBOARD
// ===============================
async function loadDashboard() {

    showLoading(true);

    try {

        const data = await fetchDashboardData();

        if (!data) return;

        renderStats(data);

        renderAlerts(data.alerts);

        renderCharts(data);

    } catch (error) {

        console.error("Dashboard Load Failed:", error);

        const alerts = document.getElementById("adminUpdates");

        if (alerts) {

            alerts.innerHTML =
                `<li style="color:red">
                <i class="fas fa-circle-exclamation"></i>
                Failed to load dashboard data
            </li>`;
        }

    } finally {

        showLoading(false);
    }
}


// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

    // Refresh every minute
    setInterval(loadDashboard, 60000);

});