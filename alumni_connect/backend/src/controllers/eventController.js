// backend/src/controllers/eventController.js
const { supabase } = require('../config/supabase');
const { sendEventNotification } = require('../utils/emailService');

// ===== CREATE EVENT (Admin only) =====

const createEvent = async (req, res) => {
    try {
        const {
            title, description, mode, location,
            event_date, registration_deadline,
            max_participants, admin_id
        } = req.body;

        if (!title || !description || !mode || !event_date || !registration_deadline) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        const { data: event, error } = await supabase
            .from('events')
            .insert({
                title, description, mode,
                location:              location || null,
                event_date:            new Date(event_date).toISOString(),
                registration_deadline: new Date(registration_deadline).toISOString(),
                max_participants:      max_participants || null,
                created_by:            admin_id,
                is_active:             true
            })
            .select()
            .single();

        if (error) throw error;

        // ✅ Respond to admin IMMEDIATELY — don't wait for emails
        res.status(201).json({ success: true, event });

        // 🔥 Fire emails in background AFTER response is sent
        notifyAllUsers(event).catch(err =>
            console.error('⚠️ Background email notification failed:', err.message)
        );

    } catch (err) {
        console.error('createEvent error:', err);
        res.status(500).json({ message: 'Failed to create event' });
    }
};

// ===== GET ALL ACTIVE EVENTS =====
const getEvents = async (req, res) => {
    try {
        const { user_id, user_type } = req.query;

        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .eq('is_active', true)
            .order('event_date', { ascending: true });

        if (error) throw error;

        // If user is logged in, check which events they registered for
        let registeredEventIds = new Set();
        if (user_id && user_type) {
            const { data: regs } = await supabase
                .from('event_registrations')
                .select('event_id')
                .eq('user_id', user_id);

            if (regs) regs.forEach(r => registeredEventIds.add(r.event_id));
        }

        // Enrich with registration count + user's registration status
        const enriched = await Promise.all(events.map(async (ev) => {
            const { count } = await supabase
                .from('event_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', ev.event_id);

            const now      = new Date();
            const deadline = new Date(ev.registration_deadline);
            const isOpen   = deadline > now;
            const isFull   = ev.max_participants && count >= ev.max_participants;

            return {
                ...ev,
                registered_count: count || 0,
                is_registered:    registeredEventIds.has(ev.event_id),
                is_open:          isOpen,
                is_full:          isFull
            };
        }));

        res.json({ success: true, events: enriched });

    } catch (err) {
        console.error('getEvents error:', err);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
};

// ===== GET ALL EVENTS FOR ADMIN (including inactive) =====
const getAdminEvents = async (req, res) => {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: false });

        if (error) throw error;

        const enriched = await Promise.all(events.map(async (ev) => {
            const { count } = await supabase
                .from('event_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', ev.event_id);

            return { ...ev, registered_count: count || 0 };
        }));

        res.json({ success: true, events: enriched });

    } catch (err) {
        console.error('getAdminEvents error:', err);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
};

// ===== REGISTER FOR EVENT =====
const registerForEvent = async (req, res) => {
    try {
        const { event_id, user_id, user_type } = req.body;

        // Get event details
        const { data: event, error: evErr } = await supabase
            .from('events')
            .select('*')
            .eq('event_id', event_id)
            .single();

        if (evErr || !event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check deadline
        if (new Date(event.registration_deadline) < new Date()) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        // Check capacity
        if (event.max_participants) {
            const { count } = await supabase
                .from('event_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event_id);

            if (count >= event.max_participants) {
                return res.status(400).json({ message: 'Event is full' });
            }
        }

        // Get user details for name + email
        let full_name = '', email = '';
        if (user_type === 'student') {
            const { data: s } = await supabase
                .from('students').select('full_name, email').eq('user_id', user_id).single();
            full_name = s?.full_name || '';
            email     = s?.email     || '';
        } else if (user_type === 'alumni') {
            const { data: a } = await supabase
                .from('alumni').select('full_name, email').eq('user_id', user_id).single();
            full_name = a?.full_name || '';
            email     = a?.email     || '';
        }

        // Insert registration
        const { data: reg, error } = await supabase
            .from('event_registrations')
            .insert({ event_id, user_id, user_type, full_name, email })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ message: 'You are already registered for this event' });
            }
            throw error;
        }

        res.json({ success: true, registration: reg });

    } catch (err) {
        console.error('registerForEvent error:', err);
        res.status(500).json({ message: 'Failed to register for event' });
    }
};

// ===== DELETE / DEACTIVATE EVENT (Admin) =====
const deleteEvent = async (req, res) => {
    try {
        const { event_id } = req.params;

        await supabase
            .from('events')
            .update({ is_active: false })
            .eq('event_id', event_id);

        res.json({ success: true, message: 'Event removed' });

    } catch (err) {
        console.error('deleteEvent error:', err);
        res.status(500).json({ message: 'Failed to delete event' });
    }
};

// ===== GET REGISTRATIONS FOR AN EVENT (Admin — for Excel export) =====
const getEventRegistrations = async (req, res) => {
    try {
        const { event_id } = req.params;

        const { data: registrations, error } = await supabase
            .from('event_registrations')
            .select('*')
            .eq('event_id', event_id)
            .order('registered_at', { ascending: true });

        if (error) throw error;

        res.json({ success: true, registrations });

    } catch (err) {
        console.error('getEventRegistrations error:', err);
        res.status(500).json({ message: 'Failed to fetch registrations' });
    }
};

// ===== HELPER: Notify all students and alumni when event is created =====
const notifyAllUsers = async (event) => {
    // Get all student emails
    const { data: students } = await supabase
        .from('students')
        .select('full_name, email');

    // Get all alumni emails
    const { data: alumni } = await supabase
        .from('alumni')
        .select('full_name, email');

    const allUsers = [
        ...(students || []),
        ...(alumni   || [])
    ];

    console.log(`[Events] Sending notification to ${allUsers.length} users`);

    // Send in batches to avoid overwhelming the mail server
    for (const user of allUsers) {
        try {
            await sendEventNotification({
                toEmail:   user.email,
                toName:    user.full_name,
                eventTitle: event.title,
                eventDate:  event.event_date,
                eventMode:  event.mode,
                eventDesc:  event.description,
                deadline:   event.registration_deadline
            });
        } catch (e) {
            console.error(`⚠️ Failed to notify ${user.email}:`, e.message);
        }
    }
};

module.exports = {
    createEvent,
    getEvents,
    getAdminEvents,
    registerForEvent,
    deleteEvent,
    getEventRegistrations
};