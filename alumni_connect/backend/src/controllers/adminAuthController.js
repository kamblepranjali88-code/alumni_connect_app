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

        // Validate inputs
        if (!userId || !password) {
            return res.status(400).json({
                message: "User ID and password required"
            });
        }

        // Ensure ADMIN_ prefix (case-insensitive check)
        if (!userId.toUpperCase().startsWith("ADMIN_")) {
            return res.status(401).json({
                message: "Invalid Admin ID format"
            });
        }

        // Extract email — case-insensitive prefix strip
        const email = userId.replace(/^ADMIN_/i, "").trim().toLowerCase();
        console.log("Extracted email:", email);

        // Query DB
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

        // Compare password
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

module.exports = { adminLogin };



