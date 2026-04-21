// backend/src/controllers/adminAuthController.js

const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

// ===== ADMIN LOGIN =====
const adminLogin = async (req, res) => {
    try {
        const { userId, password } = req.body;

        console.log("=== ADMIN LOGIN ATTEMPT ===");
        console.log("Raw userId received:", userId);
        console.log("Password received:", password ? "YES (hidden)" : "NO");

        if (!userId || !password) {
            return res.status(400).json({ message: "User ID and password required" });
        }

        if (!userId.toUpperCase().startsWith("ADMIN_")) {
            return res.status(401).json({ message: "Invalid Admin ID format" });
        }

        const email = userId.replace(/^ADMIN_/i, "").trim().toLowerCase();
        console.log("Extracted email:", email);

        const { data: admin, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ message: "Invalid Admin ID or password" });
        }

        const isValid = await bcrypt.compare(password, admin.password_hash);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid Admin ID or password" });
        }

        return res.json({
            admin_id: admin.admin_id,
            full_name: admin.full_name,
            email: admin.email,
            user_type: "admin",
            login_count: 1
        });

    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// ===== ADMIN DASHBOARD =====
const getAdminDashboard = async (req, res) => {
    try {
        const { count: students } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        const { count: alumni } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true });

        const { count: pendingVerifications } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', false);

        const { count: events } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', new Date().toISOString());

        const { count: activeMentorships } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'accepted');

        const { count: completedMentorships } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'rejected');

        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        // Event trend — count events per month for last 6 months
        const { data: eventRows } = await supabase
            .from('events')
            .select('event_date');

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCounts = {};

        (eventRows || []).forEach(row => {
            if (!row.event_date) return;
            const d = new Date(row.event_date);
            const key = monthNames[d.getMonth()];
            monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
        });

        const trendLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendValues = trendLabels.map(m => monthlyCounts[m] || 0);

        return res.json({
            students:             students || 0,
            alumni:               alumni || 0,
            pendingVerifications: pendingVerifications || 0,
            events:               events || 0,
            mentorships: {
                active:    activeMentorships || 0,
                completed: completedMentorships || 0
            },
            jobs: {
                internships: totalJobs || 0,
                fullTime:    0
            },
            eventTrend: {
                labels: trendLabels,
                values: trendValues
            },
            alerts: []
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { adminLogin, getAdminDashboard };