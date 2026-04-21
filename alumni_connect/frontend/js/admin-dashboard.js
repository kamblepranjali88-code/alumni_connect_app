// ===============================
// ADMIN DASHBOARD JS
// ===============================

const API_BASE = 'https://alumni-connect-backend-yy97.onrender.com/api';

let userChart = null;
let mentorshipChart = null;
let jobChart = null;
let eventChart = null;


// ===============================
// AUTH CHECK
// ===============================
function checkAuth() {
    const token = sessionStorage.getItem("userId");

    if (!token || sessionStorage.getItem("userType") !== "admin") {
        alert("Session expired. Please login again.");
        window.location.href = "../html/login.html";
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
        const response = await fetch(`${API_BASE}/stats/dashboard`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            sessionStorage.clear();
            localStorage.clear();
            alert("Session expired. Please login again.");
            window.location.href = "../html/login.html";
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
    const adminNameEl = document.getElementById("admin-name");
    if (adminNameEl) {
        adminNameEl.innerText = `Welcome, ${sessionStorage.getItem("fullName") || data.adminName || "Admin"}`;
    }

    if (document.getElementById("studentCount"))
        document.getElementById("studentCount").innerText = data.students ?? 0;

    if (document.getElementById("alumniCount"))
        document.getElementById("alumniCount").innerText = data.alumni ?? 0;

    if (document.getElementById("pendingVerifications"))
        document.getElementById("pendingVerifications").innerText = data.pendingVerifications ?? 0;

    if (document.getElementById("eventCount"))
        document.getElementById("eventCount").innerText = data.events ?? 0;
}


// ===============================
// RENDER ALERTS
// ===============================
function renderAlerts(alerts) {
    const ul = document.getElementById("adminUpdates");
    if (!ul) return;

    ul.innerHTML = "";

    if (!alerts || alerts.length === 0) {
        ul.innerHTML = `<li><i class="fas fa-info-circle"></i> No updates available</li>`;
        return;
    }

    alerts.forEach(alert => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fas ${alert.icon}"></i> ${alert.text}`;
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
    const userCtx = document.getElementById("userChart");
    if (userCtx) {
        userChart = new Chart(userCtx, {
            type: "doughnut",
            data: {
                labels: ["Students", "Alumni"],
                datasets: [{
                    data: [data.students ?? 0, data.alumni ?? 0],
                    backgroundColor: ["#3b82f6", "#10b981"]
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: "User Distribution" } }
            }
        });
    }

    // MENTORSHIP ACTIVITY
    const mentorCtx = document.getElementById("mentorshipChart");
    if (mentorCtx) {
        mentorshipChart = new Chart(mentorCtx, {
            type: "bar",
            data: {
                labels: ["Active", "Completed"],
                datasets: [{
                    label: "Mentorship Sessions",
                    data: [data.mentorships?.active ?? 0, data.mentorships?.completed ?? 0],
                    backgroundColor: "#6366f1"
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: "Mentorship Activity" } }
            }
        });
    }

    // JOB CHART
    const jobCtx = document.getElementById("jobChart");
    if (jobCtx) {
        jobChart = new Chart(jobCtx, {
            type: "pie",
            data: {
                labels: ["Internships", "Full-Time"],
                datasets: [{
                    data: [data.jobs?.internships ?? 0, data.jobs?.fullTime ?? 0],
                    backgroundColor: ["#f59e0b", "#ef4444"]
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: "Job Opportunities" } }
            }
        });
    }

    // EVENT TREND
    const eventCtx = document.getElementById("eventChart");
    if (eventCtx) {
        eventChart = new Chart(eventCtx, {
            type: "line",
            data: {
                labels: data.eventTrend?.labels || ["Jan", "Feb", "Mar", "Apr"],
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
                plugins: { title: { display: true, text: "Events Trend" } }
            }
        });
    }
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
            alerts.innerHTML = `<li style="color:red">
                <i class="fas fa-circle-exclamation"></i>
                Failed to load dashboard data. Check backend connection.
            </li>`;
        }
    } finally {
        showLoading(false);
    }
}


// ===============================
// LOGOUT
// ===============================
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "../html/login.html";
}


// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    setInterval(loadDashboard, 60000);
});