const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const alumniResult = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true });

        const jobsResult = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true });

        const eventsResult = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', new Date().toISOString());

        if (alumniResult.error) throw alumniResult.error;
        if (jobsResult.error) throw jobsResult.error;
        if (eventsResult.error) throw eventsResult.error;

        return res.json({
            alumni_count: alumniResult.count || 0,
            job_count: jobsResult.count || 0,
            event_count: eventsResult.count || 0,
            mentorship_limit: '3 / Month'
        });

    } catch (err) {
        console.error('Stats error:', err);
        return res.status(500).json({
            alumni_count: 0,
            job_count: 0,
            event_count: 0,
            mentorship_limit: '0 / Month',
            message: 'Server error'
        });
    }
});

module.exports = router;