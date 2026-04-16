const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/updates/recent
router.get('/recent', async (req, res) => {
    try {
        const { data: events } = await supabase
            .from('events')
            .select('title, event_date')
            .order('event_date', { ascending: false })
            .limit(3);

        const { data: jobs } = await supabase
            .from('jobs')
            .select('title')
            .order('created_at', { ascending: false })
            .limit(2);

        const updates = [];

        if (events) {
            events.forEach(e => updates.push({
                message: `📅 Upcoming Event: ${e.title}`
            }));
        }

        if (jobs) {
            jobs.forEach(j => updates.push({
                message: `💼 New Job Posted: ${j.title}`
            }));
        }

        return res.json(updates);

    } catch (err) {
        console.error("Updates error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;