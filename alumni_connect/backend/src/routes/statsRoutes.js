const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { count: alumni_count } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true });

        const { count: job_count } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        const { count: event_count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', new Date().toISOString());

        return res.json({
            alumni_count:      alumni_count || 0,
            job_count:         job_count || 0,
            event_count:       event_count || 0,
            mentorship_limit:  '3 / Month'
        });

    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;