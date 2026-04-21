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
            return res.status(400).json({
                message: "User ID and password required"
            });
        }

        if (!userId.toUpperCase().startsWith("ADMIN_")) {
            return res.status(401).json({
                message: "Invalid Admin ID format"
            });
        }

        const email = userId.replace(/^ADMIN_/i, "").trim().toLowerCase();
        console.log("Extracted email:", email);

        const { data: admin, error } = await supabase
            .from("admin_users")
            .select("*")
            .eq("email", email)
            .single();

        console.log("DB query error:", error);
        console.log("Admin found:", admin ? `YES — ${admin.email}` : "NO");

        if (error || !admin) {
            return res.status(401).json({
                message: "Invalid Admin ID or password"
            });
        }

        console.log("Hash from DB:", admin.password_hash);
        const isValid = await bcrypt.compare(password, admin.password_hash);
        console.log("bcrypt compare result:", isValid);

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid Admin ID or password"
            });
        }

        console.log(`✅ Admin login successful: ${admin.email}`);

        return res.json({
            admin_id: admin.admin_id,
            full_name: admin.full_name,
            email: admin.email,
            user_type: "admin",
            login_count: 1
        });

    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({
            message: "Server error"
        });
    }
};


// ===== ADMIN DASHBOARD =====
const getAdminDashboard = async (req, res) => {
    try {
        // Total Students
        const { count: students } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });

        // Total Alumni
        const { count: alumni } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true });

        // Pending Verifications
        const { count: pendingVerifications } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', false);

        // Upcoming Events
        const { count: events } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', new Date().toISOString());

        // Mentorship counts
        const { count: activeMentorships } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: completedMentorships } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Jobs
        const { count: internships } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('job_type', 'internship');

        const { count: fullTime } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('job_type', 'full-time');

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
                internships: internships || 0,
                fullTime:    fullTime || 0
            },
            eventTrend: {
                labels: ["Jan", "Feb", "Mar", "Apr"],
                values: [0, 0, 0, 0]
            },
            alerts: []
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { adminLogin, getAdminDashboard };