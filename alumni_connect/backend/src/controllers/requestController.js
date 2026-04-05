// backend/src/controllers/requestController.js
const { supabase } = require('../config/supabase');
const {
    sendRequestNotification,
    sendAcceptNotification,
    sendRejectNotification
} = require('../utils/emailService');

const MAX_SLOTS       = 2;
const CONNECTION_DAYS = 15;

const getStudentId = async (userId) => {
    const { data } = await supabase
        .from('students').select('student_id').eq('user_id', userId).single();
    return data?.student_id || null;
};

const getAlumniId = async (userId) => {
    const { data } = await supabase
        .from('alumni').select('alumni_id').eq('user_id', userId).single();
    return data?.alumni_id || null;
};

const checkAvailableSlots = async (studentId) => {
    const { data: pending } = await supabase
        .from('mentorship_requests').select('request_id')
        .eq('student_id', studentId).eq('status', 'pending');

    const { data: active } = await supabase
        .from('mentorship_requests').select('request_id')
        .eq('student_id', studentId).eq('status', 'accepted')
        .gt('expires_at', new Date().toISOString());

    const pendingCount   = pending?.length  || 0;
    const activeCount    = active?.length   || 0;
    const slotsUsed      = pendingCount + activeCount;
    const slotsAvailable = MAX_SLOTS - slotsUsed;
    return { pendingCount, activeCount, slotsUsed, slotsAvailable, canSend: slotsAvailable > 0 };
};

// ===== SEND REQUEST =====
const sendRequest = async (req, res) => {
    try {
        const { student_id, alumni_id, message } = req.body;
        if (!student_id || !alumni_id)
            return res.status(400).json({ message: 'student_id and alumni_id are required' });
        if (!message || message.trim().length < 10)
            return res.status(400).json({ message: 'Please write a message of at least 10 characters' });

        const actualStudentId = await getStudentId(student_id);
        if (!actualStudentId) return res.status(404).json({ message: 'Student not found' });

        const { data: student } = await supabase
            .from('students').select('student_id, full_name, branch, year, email')
            .eq('student_id', actualStudentId).single();

        const { data: alumni } = await supabase
            .from('alumni').select('alumni_id, full_name, email, available_for_mentorship')
            .eq('alumni_id', alumni_id).single();

        if (!alumni) return res.status(404).json({ message: 'Alumni not found' });
        if (!alumni.available_for_mentorship)
            return res.status(400).json({ message: 'This alumni is not available for mentorship' });

        const slots = await checkAvailableSlots(actualStudentId);
        if (!slots.canSend)
            return res.status(400).json({
                message: `You have ${slots.activeCount} active mentor(s) and ${slots.pendingCount} pending request(s). Maximum is ${MAX_SLOTS}.`
            });

        const { data: existing } = await supabase
            .from('mentorship_requests').select('request_id, status')
            .eq('student_id', actualStudentId).eq('alumni_id', alumni_id)
            .in('status', ['pending', 'accepted']).maybeSingle();

        if (existing)
            return res.status(400).json({
                message: existing.status === 'pending'
                    ? 'You already have a pending request to this alumni'
                    : 'You are already connected with this alumni'
            });

        const { data: newRequest, error } = await supabase
            .from('mentorship_requests')
            .insert([{ student_id: actualStudentId, alumni_id, message: message.trim(), status: 'pending' }])
            .select().single();

        if (error) return res.status(500).json({ message: 'Error sending request' });

        try {
            await sendRequestNotification(alumni.email, alumni.full_name,
                student.full_name, student.branch, student.year, message.trim());
        } catch (e) { console.error('Email failed:', e.message); }

        res.status(200).json({ message: `Mentorship request sent to ${alumni.full_name} successfully!`, request: newRequest });

    } catch (error) {
        console.error('Send request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET STUDENT REQUESTS =====
const getStudentRequests = async (req, res) => {
    try {
        const { studentId } = req.params;
        const actualStudentId = await getStudentId(studentId);
        if (!actualStudentId) return res.status(404).json({ message: 'Student not found' });

        const { data: requests, error } = await supabase
            .from('mentorship_requests').select('*')
            .eq('student_id', actualStudentId).order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: error.message });

        const now      = new Date();
        const enriched = await Promise.all(requests.map(async (r) => {
            const { data: alumni } = await supabase
                .from('alumni').select('alumni_id, full_name, company, designation, branch, profile_photo')
                .eq('alumni_id', r.alumni_id).single();

            let room_id = null;
            if (r.status === 'accepted') {
                const { data: chatRoom } = await supabase
                    .from('chat_rooms').select('room_id').eq('request_id', r.request_id).maybeSingle();
                room_id = chatRoom?.room_id || null;
            }

            return { ...r, alumni, room_id, is_expired: r.expires_at && new Date(r.expires_at) < now };
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET ALUMNI REQUESTS =====
const getAlumniRequests = async (req, res) => {
    try {
        const { alumniId } = req.params;
        const actualAlumniId = await getAlumniId(alumniId);
        if (!actualAlumniId) return res.status(404).json({ message: 'Alumni not found' });

        const { data: requests, error } = await supabase
            .from('mentorship_requests').select('*')
            .eq('alumni_id', actualAlumniId).order('created_at', { ascending: false });

        if (error) return res.status(500).json({ message: error.message });

        const enriched = await Promise.all(requests.map(async (r) => {
            const { data: student } = await supabase
                .from('students').select('student_id, full_name, email, branch, year, profile_photo')
                .eq('student_id', r.student_id).single();

            let room_id = null;
            if (r.status === 'accepted') {
                const { data: chatRoom } = await supabase
                    .from('chat_rooms').select('room_id').eq('request_id', r.request_id).maybeSingle();
                room_id = chatRoom?.room_id || null;
            }

            return { ...r, student, room_id };
        }));

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== ACCEPT REQUEST =====
const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const { data: request, error: fetchError } = await supabase
            .from('mentorship_requests').select('*').eq('request_id', requestId).single();

        if (fetchError || !request)
            return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending')
            return res.status(400).json({ message: 'Request is no longer pending' });

        const { data: student } = await supabase
            .from('students').select('full_name, email, branch, year').eq('student_id', request.student_id).single();
        const { data: alumni } = await supabase
            .from('alumni').select('full_name, company, designation').eq('alumni_id', request.alumni_id).single();

        const acceptedAt = new Date();
        const expiresAt  = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15);

        const { data, error } = await supabase
            .from('mentorship_requests')
            .update({ status: 'accepted', accepted_at: acceptedAt.toISOString(), expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() })
            .eq('request_id', requestId).select().single();

        if (error) return res.status(500).json({ message: 'Error accepting request' });

        // ── Create chat room ──────────────────────────────────────────────────
        let newRoomId = null;
        try {
            const { data: existingRoom } = await supabase
                .from('chat_rooms').select('room_id').eq('request_id', requestId).maybeSingle();

            if (!existingRoom) {
                const { data: newRoom, error: roomError } = await supabase
                    .from('chat_rooms')
                    .insert({
                        request_id: parseInt(requestId),
                        student_id: request.student_id,
                        alumni_id:  request.alumni_id,
                        expires_at: expiresAt.toISOString(),
                        is_active:  true
                    })
                    .select().single();

                if (roomError) {
                    console.error('⚠️ Chat room creation failed:', roomError.message);
                } else {
                    newRoomId = newRoom.room_id;
                    console.log(`✅ Chat room ${newRoomId} created`);

                    // ── Create the FIRST session row for this room ────────────
                    // session_number = 1, is_active = true
                    // The first message from student will detect this and send email
                    const { error: sessionError } = await supabase
                        .from('chat_sessions')
                        .insert({
                            room_id:        newRoomId,
                            session_number: 1,
                            is_active:      true
                        });

                    if (sessionError) {
                        console.error('⚠️ Session creation failed:', sessionError.message);
                    } else {
                        console.log(`✅ Session 1 created for room ${newRoomId}`);
                    }
                }
            } else {
                console.log(`ℹ️ Chat room already exists for request ${requestId}`);
            }
        } catch (roomErr) {
            console.error('⚠️ Chat room error:', roomErr.message);
        }

        try {
            await sendAcceptNotification(student.email, student.full_name,
                alumni.full_name, alumni.company, alumni.designation, expiresAt.toISOString());
        } catch (e) { console.error('Email failed:', e.message); }

        res.json({ message: 'Request accepted! Connection active for 15 days.', request: data });

    } catch (error) {
        console.error('Accept error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== REJECT REQUEST =====
const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const { data: request, error: fetchError } = await supabase
            .from('mentorship_requests').select('*').eq('request_id', requestId).single();

        if (fetchError || !request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request is no longer pending' });

        const { data: student } = await supabase
            .from('students').select('full_name, email').eq('student_id', request.student_id).single();
        const { data: alumni } = await supabase
            .from('alumni').select('full_name').eq('alumni_id', request.alumni_id).single();

        const { data, error } = await supabase
            .from('mentorship_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('request_id', requestId).select().single();

        if (error) return res.status(500).json({ message: 'Error rejecting request' });

        try {
            await sendRejectNotification(student.email, student.full_name, alumni.full_name);
        } catch (e) { console.error('Email failed:', e.message); }

        res.json({ message: 'Request rejected.', request: data });

    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ===== GET SLOT INFO =====
const getSlotInfo = async (req, res) => {
    try {
        const { studentId } = req.params;
        const actualStudentId = await getStudentId(studentId);
        if (!actualStudentId) return res.status(404).json({ message: 'Student not found' });
        const slots = await checkAvailableSlots(actualStudentId);
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { sendRequest, getStudentRequests, getAlumniRequests, acceptRequest, rejectRequest, getSlotInfo };