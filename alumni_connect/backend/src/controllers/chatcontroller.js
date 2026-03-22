// backend/src/controllers/chatController.js
const { supabase } = require('../config/supabase');

// ── Convert user_id → student_id / alumni_id ──────────────────────────────────
const getStudentId = async (userId) => {
    const { data } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', userId)
        .single();
    return data?.student_id || null;
};

const getAlumniId = async (userId) => {
    const { data } = await supabase
        .from('alumni')
        .select('alumni_id')
        .eq('user_id', userId)
        .single();
    return data?.alumni_id || null;
};


// ── GET ALL ACTIVE ROOMS  (sidebar list) ──────────────────────────────────────
// GET /api/chat/my-rooms?user_id=5&user_type=student
const getMyRooms = async (req, res) => {
    const { user_id, user_type } = req.query;

    if (!user_id || !user_type) {
        return res.status(400).json({ error: 'user_id and user_type are required' });
    }

    try {
        // Auto-expire rooms past their expiry
        await supabase
            .from('chat_rooms')
            .update({ is_active: false })
            .lt('expires_at', new Date().toISOString())
            .eq('is_active', true);

        // Step 1: Convert user_id → student_id or alumni_id
        let actualId  = null;
        let filterCol = '';

        if (user_type === 'student') {
            actualId  = await getStudentId(user_id);
            filterCol = 'student_id';
        } else if (user_type === 'alumni') {
            actualId  = await getAlumniId(user_id);
            filterCol = 'alumni_id';
        } else {
            return res.status(400).json({ error: 'Invalid user_type' });
        }

        if (!actualId) {
            console.log(`[Chat] No ${user_type} found for user_id=${user_id}`);
            return res.status(404).json({ error: `${user_type} profile not found` });
        }

        console.log(`[Chat] user_id=${user_id} → ${filterCol}=${actualId}`);

        // Step 2: Get all active rooms for this user
        const { data: rooms, error: roomsErr } = await supabase
            .from('chat_rooms')
            .select('room_id, request_id, student_id, alumni_id, created_at, expires_at, is_active')
            .eq(filterCol, actualId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (roomsErr) throw roomsErr;

        console.log(`[Chat] Found ${rooms?.length || 0} room(s)`);

        if (!rooms || rooms.length === 0) {
            return res.json({ success: true, rooms: [] });
        }

        // Step 3: For each room, fetch the other person's profile separately
        //         (avoid Supabase join issues — use explicit queries like requestController does)
        const enriched = await Promise.all(
            rooms.map(async (room) => {

                // Fetch the other person's details
                let otherProfile = null;

                if (user_type === 'student') {
                    // Student wants to see alumni info
                    const { data: alumni } = await supabase
                        .from('alumni')
                        .select('alumni_id, user_id, full_name, designation, company, profile_photo, branch')
                        .eq('alumni_id', room.alumni_id)
                        .single();
                    otherProfile = alumni;
                } else {
                    // Alumni wants to see student info
                    const { data: student } = await supabase
                        .from('students')
                        .select('student_id, user_id, full_name, branch, year, profile_photo')
                        .eq('student_id', room.student_id)
                        .single();
                    otherProfile = student;
                }

                // Last message preview
                const { data: lastMsg } = await supabase
                    .from('chat_messages')
                    .select('message_text, sent_at, sender_type')
                    .eq('room_id', room.room_id)
                    .order('sent_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Unread count — messages FROM the other party
                const otherSenderType = user_type === 'student' ? 'alumni' : 'student';
                const { count: unread } = await supabase
                    .from('chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('room_id', room.room_id)
                    .eq('sender_type', otherSenderType)
                    .eq('is_read', false);

                // Days remaining
                const now = new Date();
                const exp = new Date(room.expires_at);
                const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));

                // Return with the correct key the frontend expects:
                // student side expects room.alumni
                // alumni side expects room.students
                return {
                    ...room,
                    alumni:         user_type === 'student' ? otherProfile : undefined,
                    students:       user_type === 'alumni'  ? otherProfile : undefined,
                    last_message:   lastMsg || null,
                    unread_count:   unread  || 0,
                    days_remaining: daysRemaining,
                };
            })
        );

        console.log(`[Chat] Returning ${enriched.length} enriched room(s)`);
        return res.json({ success: true, rooms: enriched });

    } catch (err) {
        console.error('[Chat] getMyRooms error:', err);
        return res.status(500).json({ error: 'Failed to fetch rooms', detail: err.message });
    }
};


// ── GET MESSAGES FOR A ROOM ───────────────────────────────────────────────────
// GET /api/chat/:room_id/messages?user_id=5&user_type=student
const getRoomMessages = async (req, res) => {
    const { room_id } = req.params;
    const { user_id, user_type } = req.query;

    try {
        const { data: room, error: roomErr } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('room_id', room_id)
            .single();

        if (roomErr || !room) {
            return res.status(404).json({ error: 'Chat room not found' });
        }

        // Convert user_id → actual id for participant check
        let actualId = null;
        if (user_type === 'student') {
            actualId = await getStudentId(user_id);
        } else {
            actualId = await getAlumniId(user_id);
        }

        const isParticipant =
            (user_type === 'student' && room.student_id === actualId) ||
            (user_type === 'alumni'  && room.alumni_id  === actualId);

        if (!isParticipant) {
            return res.status(403).json({ error: 'Access denied to this room' });
        }

        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', room_id)
            .order('sent_at', { ascending: true });

        if (error) throw error;

        const now = new Date();
        const exp = new Date(room.expires_at);
        const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));

        return res.json({ success: true, messages, room, daysRemaining });

    } catch (err) {
        console.error('[Chat] getRoomMessages error:', err);
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
};


// ── MARK MESSAGES AS READ ─────────────────────────────────────────────────────
// POST /api/chat/:room_id/read   body: { user_type }
const markAsRead = async (req, res) => {
    const { room_id } = req.params;
    const { user_type } = req.body;

    try {
        const otherSenderType = user_type === 'student' ? 'alumni' : 'student';

        await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('room_id', room_id)
            .eq('sender_type', otherSenderType)
            .eq('is_read', false);

        return res.json({ success: true });

    } catch (err) {
        console.error('[Chat] markAsRead error:', err);
        return res.status(500).json({ error: 'Failed to mark as read' });
    }
};


// ── TOTAL UNREAD FOR NAV BADGE ────────────────────────────────────────────────
// GET /api/chat/unread-count?user_id=5&user_type=student
const getUnreadCount = async (req, res) => {
    const { user_id, user_type } = req.query;

    if (!user_id || !user_type) {
        return res.status(400).json({ error: 'user_id and user_type are required' });
    }

    try {
        let actualId  = null;
        let filterCol = '';

        if (user_type === 'student') {
            actualId  = await getStudentId(user_id);
            filterCol = 'student_id';
        } else {
            actualId  = await getAlumniId(user_id);
            filterCol = 'alumni_id';
        }

        if (!actualId) return res.json({ success: true, total_unread: 0 });

        const { data: rooms } = await supabase
            .from('chat_rooms')
            .select('room_id')
            .eq(filterCol, actualId)
            .eq('is_active', true);

        if (!rooms || rooms.length === 0) {
            return res.json({ success: true, total_unread: 0 });
        }

        const roomIds         = rooms.map(r => r.room_id);
        const otherSenderType = user_type === 'student' ? 'alumni' : 'student';

        const { count: totalUnread } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
            .eq('sender_type', otherSenderType)
            .eq('is_read', false);

        return res.json({ success: true, total_unread: totalUnread || 0 });

    } catch (err) {
        console.error('[Chat] getUnreadCount error:', err);
        return res.status(500).json({ error: 'Failed to get unread count' });
    }
};


// ── CREATE ROOM ON ACCEPT (called from requestController) ─────────────────────
const createChatOnAccept = async (requestId, studentId, alumniId) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15);

    const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
            request_id: requestId,
            student_id: studentId,
            alumni_id:  alumniId,
            expires_at: expiresAt.toISOString(),
            is_active:  true,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};


module.exports = {
    getMyRooms,
    getRoomMessages,
    markAsRead,
    getUnreadCount,
    createChatOnAccept,
};