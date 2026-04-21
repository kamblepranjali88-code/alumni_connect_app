const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        // Alumni count
        const { count: alumniCount, error: e1 } = await supabase
            .from('alumni')
            .select('*', { count: 'exact', head: true });

        // Students count (from users table)
        const { count: studentCount, error: e2 } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Active mentorship requests
        const { count: activeMentorship, error: e3 } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Completed mentorship requests
        const { count: completedMentorship, error: e4 } = await supabase
            .from('mentorship_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        // Internship jobs
        const { count: internshipCount, error: e5 } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('job_type', 'internship');

        // Full-time jobs
        const { count: fulltimeCount, error: e6 } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('job_type', 'full-time');

        // Upcoming events
        const { count: eventCount, error: e7 } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .gte('event_date', new Date().toISOString());

        if (e1 || e2 || e3 || e4 || e5 || e6 || e7) {
            throw e1 || e2 || e3 || e4 || e5 || e6 || e7;
        }

        return res.json({
            students:         studentCount   || 0,
            alumni:           alumniCount    || 0,
            events:           eventCount     || 0,
            job_count:        (internshipCount || 0) + (fulltimeCount || 0),
            mentorship_limit: '3 / Month',
            mentorships: {
                active:    activeMentorship    || 0,
                completed: completedMentorship || 0,
            },
            jobs: {
                internships: internshipCount || 0,
                fullTime:    fulltimeCount   || 0,
            },
        });

    } catch (err) {
        console.error('Stats error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;