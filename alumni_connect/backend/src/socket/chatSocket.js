// backend/src/socket/chatSocket.js
const { supabase } = require('../config/supabase');
const { sendFirstMessageNotification } = require('../utils/emailService');

const connectedUsers = new Map();

const getStudentId = async (userId) => {
    const { data } = await supabase.from('students').select('student_id').eq('user_id', userId).single();
    return data?.student_id || null;
};

const getAlumniId = async (userId) => {
    const { data } = await supabase.from('alumni').select('alumni_id').eq('user_id', userId).single();
    return data?.alumni_id || null;
};

// Returns { isFirst, sessionId, sessionNumber } for the current active session
const getSessionInfo = async (roomId) => {
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('session_id, session_number')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!session) return { isFirst: false, sessionId: null, sessionNumber: 1 };

    const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('session_id', session.session_id)
        .neq('sender_type', 'system');

    return {
        isFirst:       (count || 0) === 0,
        sessionId:     session.session_id,
        sessionNumber: session.session_number
    };
};

const initChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on('register_user', ({ user_id }) => {
            socket.join(`user_${user_id}`);
        });

        socket.on('join_room', async ({ room_id, user_id, user_type }) => {
            try {
                const { data: room, error } = await supabase
                    .from('chat_rooms')
                    .select('room_id, student_id, alumni_id, is_active, expires_at')
                    .eq('room_id', room_id).single();

                if (error || !room) { socket.emit('error', { message: 'Chat room not found' }); return; }
                if (!room.is_active || new Date(room.expires_at) < new Date()) {
                    socket.emit('chat_expired', { message: 'This mentorship chat has expired.' }); return;
                }

                const actualId = user_type === 'student' ? await getStudentId(user_id) : await getAlumniId(user_id);
                const isParticipant =
                    (user_type === 'student' && room.student_id === actualId) ||
                    (user_type === 'alumni'  && room.alumni_id  === actualId);

                if (!isParticipant) { socket.emit('error', { message: 'Access denied' }); return; }

                const prev = connectedUsers.get(socket.id);
                if (prev?.room_id && prev.room_id !== room_id) {
                    socket.leave(`room_${prev.room_id}`);
                    socket.to(`room_${prev.room_id}`).emit('user_left', { user_id, user_type });
                }

                socket.join(`room_${room_id}`);
                connectedUsers.set(socket.id, { user_id, user_type, room_id });

                const otherType = user_type === 'student' ? 'alumni' : 'student';
                await supabase.from('chat_messages').update({ is_read: true })
                    .eq('room_id', room_id).eq('sender_type', otherType).eq('is_read', false);

                socket.to(`room_${room_id}`).emit('user_joined', { user_id, user_type });

            } catch (err) {
                console.error('[Socket] join_room error:', err);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        socket.on('send_message', async ({ room_id, sender_user_id, sender_type, message_text }) => {
            try {
                if (!message_text?.trim()) return;

                const { data: room } = await supabase
                    .from('chat_rooms')
                    .select('is_active, expires_at, student_id, alumni_id')
                    .eq('room_id', room_id).single();

                if (!room?.is_active || new Date(room.expires_at) < new Date()) {
                    socket.emit('chat_expired', { message: 'This mentorship chat has expired.' }); return;
                }

                // Get session info — check if first message of this session
                const { isFirst, sessionId, sessionNumber } = await getSessionInfo(room_id);

                // Insert message linked to current session
                const { data: message, error } = await supabase
                    .from('chat_messages')
                    .insert({
                        room_id,
                        sender_user_id,
                        sender_type,
                        message_text: message_text.trim(),
                        is_read:      false,
                        session_id:   sessionId
                    })
                    .select().single();

                if (error) throw error;

                io.to(`room_${room_id}`).emit('new_message', message);

                // Notify other user's personal room
                let otherUserRow = null;
                if (sender_type === 'student') {
                    const { data } = await supabase.from('alumni').select('user_id').eq('alumni_id', room.alumni_id).single();
                    otherUserRow = data;
                } else {
                    const { data } = await supabase.from('students').select('user_id').eq('student_id', room.student_id).single();
                    otherUserRow = data;
                }
                if (otherUserRow?.user_id) {
                    io.to(`user_${otherUserRow.user_id}`).emit('message_notification', {
                        room_id, sender_type, preview: message_text.trim().substring(0, 60)
                    });
                }

                // Send email only when student sends FIRST message of a session
                if (isFirst && sender_type === 'student') {
                    try {
                        const { data: student } = await supabase.from('students')
                            .select('full_name, email').eq('student_id', room.student_id).single();
                        const { data: alumni } = await supabase.from('alumni')
                            .select('full_name, email').eq('alumni_id', room.alumni_id).single();

                        if (student && alumni) {
                            await sendFirstMessageNotification({
                                alumniEmail:    alumni.email,
                                alumniName:     alumni.full_name,
                                studentName:    student.full_name,
                                studentEmail:   student.email,
                                messagePreview: message_text.trim().substring(0, 120),
                                sessionNumber
                            });
                        }
                    } catch (emailErr) {
                        console.error('[Socket] Email failed (non-blocking):', emailErr.message);
                    }
                }

            } catch (err) {
                console.error('[Socket] send_message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('end_session', async ({ room_id, user_id, user_type }) => {
            try {
                const { data: session } = await supabase
                    .from('chat_sessions')
                    .select('session_id, session_number')
                    .eq('room_id', room_id).eq('is_active', true)
                    .order('started_at', { ascending: false })
                    .limit(1).maybeSingle();

                if (!session) { socket.emit('error', { message: 'No active session to end' }); return; }

                // End current session
                await supabase.from('chat_sessions')
                    .update({ is_active: false, ended_at: new Date().toISOString() })
                    .eq('session_id', session.session_id);

                // System message as divider
                const { data: sysMsg } = await supabase.from('chat_messages')
                    .insert({
                        room_id,
                        sender_user_id: parseInt(user_id),
                        sender_type:    'system',
                        message_text:   'SESSION_ENDED',
                        is_read:        true,
                        session_id:     session.session_id
                    })
                    .select().single();

                // Create next session ready for future use
                const nextNumber = session.session_number + 1;
                await supabase.from('chat_sessions').insert({
                    room_id,
                    session_number: nextNumber,
                    is_active:      true
                });

                io.to(`room_${room_id}`).emit('session_ended', {
                    session_number: session.session_number,
                    next_session:   nextNumber,
                    ended_by:       user_type,
                    system_message: sysMsg
                });

                console.log(`[Socket] Session ${session.session_id} ended in room ${room_id}`);

            } catch (err) {
                console.error('[Socket] end_session error:', err);
                socket.emit('error', { message: 'Failed to end session' });
            }
        });

        socket.on('typing', ({ room_id, user_id, user_type }) => {
            socket.to(`room_${room_id}`).emit('typing', { user_id, user_type });
        });

        socket.on('stop_typing', ({ room_id }) => {
            socket.to(`room_${room_id}`).emit('stop_typing');
        });

        socket.on('disconnect', () => {
            const info = connectedUsers.get(socket.id);
            if (info?.room_id) {
                socket.to(`room_${info.room_id}`).emit('user_left', {
                    user_id: info.user_id, user_type: info.user_type
                });
            }
            connectedUsers.delete(socket.id);
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });
};

module.exports = { initChatSocket };