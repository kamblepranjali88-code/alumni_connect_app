// backend/src/socket/chatSocket.js
// ─────────────────────────────────────────────────────────────────────────────
// KEY FIX: user_id from frontend (users table) must be converted to
//          student_id / alumni_id before checking chat_rooms participation
// ─────────────────────────────────────────────────────────────────────────────
const { supabase } = require('../config/supabase');

// socket.id → { user_id, user_type, room_id }
const connectedUsers = new Map();

// ── Helpers: convert user_id → student_id / alumni_id ────────────────────────
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

const initChatSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // ── Register personal notification room ──────────────────────────────
        // Frontend emits: socket.emit('register_user', { user_id })
        socket.on('register_user', ({ user_id }) => {
            socket.join(`user_${user_id}`);
            console.log(`[Socket] User ${user_id} registered personal room`);
        });

        // ── Join a chat room ──────────────────────────────────────────────────
        // Frontend emits: socket.emit('join_room', { room_id, user_id, user_type })
        socket.on('join_room', async ({ room_id, user_id, user_type }) => {
            try {
                // Fetch the room
                const { data: room, error } = await supabase
                    .from('chat_rooms')
                    .select('room_id, student_id, alumni_id, is_active, expires_at')
                    .eq('room_id', room_id)
                    .single();

                if (error || !room) {
                    socket.emit('error', { message: 'Chat room not found' });
                    return;
                }

                if (!room.is_active || new Date(room.expires_at) < new Date()) {
                    socket.emit('chat_expired', { message: 'This mentorship chat has expired.' });
                    return;
                }

                // Convert user_id → actual table id for participant check
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
                    socket.emit('error', { message: 'Access denied to this room' });
                    return;
                }

                // Leave previous room if switching
                const prev = connectedUsers.get(socket.id);
                if (prev?.room_id && prev.room_id !== room_id) {
                    socket.leave(`room_${prev.room_id}`);
                    socket.to(`room_${prev.room_id}`).emit('user_left', { user_id, user_type });
                }

                // Join the new room
                socket.join(`room_${room_id}`);
                connectedUsers.set(socket.id, { user_id, user_type, room_id });

                // Mark other party's messages as read on join
                const otherSenderType = user_type === 'student' ? 'alumni' : 'student';
                await supabase
                    .from('chat_messages')
                    .update({ is_read: true })
                    .eq('room_id', room_id)
                    .eq('sender_type', otherSenderType)
                    .eq('is_read', false);

                // Notify others in room that this user joined
                socket.to(`room_${room_id}`).emit('user_joined', { user_id, user_type });

                console.log(`[Socket] User ${user_id} (${user_type}) joined room ${room_id}`);

            } catch (err) {
                console.error('[Socket] join_room error:', err);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // ── Send a message ────────────────────────────────────────────────────
        // Frontend emits: socket.emit('send_message', { room_id, sender_user_id, sender_type, message_text })
        socket.on('send_message', async ({ room_id, sender_user_id, sender_type, message_text }) => {
            try {
                if (!message_text || !message_text.trim()) return;

                // Verify room is still active
                const { data: room } = await supabase
                    .from('chat_rooms')
                    .select('is_active, expires_at, student_id, alumni_id')
                    .eq('room_id', room_id)
                    .single();

                if (!room || !room.is_active || new Date(room.expires_at) < new Date()) {
                    socket.emit('chat_expired', { message: 'This mentorship chat has expired.' });
                    return;
                }

                // Insert message — sender_user_id is the users.user_id
                const { data: message, error } = await supabase
                    .from('chat_messages')
                    .insert({
                        room_id,
                        sender_user_id,   // users.user_id — fine to store as-is
                        sender_type,
                        message_text: message_text.trim(),
                        is_read: false,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Broadcast to everyone in this room
                io.to(`room_${room_id}`).emit('new_message', message);

                // Notify the other user's personal room for badge/toast
                // We need their user_id (from users table), not student_id/alumni_id
                // Look up the other person's user_id
                let otherUserRow = null;
                if (sender_type === 'student') {
                    const { data } = await supabase
                        .from('alumni')
                        .select('user_id')
                        .eq('alumni_id', room.alumni_id)
                        .single();
                    otherUserRow = data;
                } else {
                    const { data } = await supabase
                        .from('students')
                        .select('user_id')
                        .eq('student_id', room.student_id)
                        .single();
                    otherUserRow = data;
                }

                if (otherUserRow?.user_id) {
                    io.to(`user_${otherUserRow.user_id}`).emit('message_notification', {
                        room_id,
                        sender_type,
                        preview: message_text.trim().substring(0, 60),
                    });
                }

            } catch (err) {
                console.error('[Socket] send_message error:', err);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // ── Typing indicators ─────────────────────────────────────────────────
        socket.on('typing', ({ room_id, user_id, user_type }) => {
            socket.to(`room_${room_id}`).emit('typing', { user_id, user_type });
        });

        socket.on('stop_typing', ({ room_id }) => {
            socket.to(`room_${room_id}`).emit('stop_typing');
        });

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const info = connectedUsers.get(socket.id);
            if (info?.room_id) {
                socket.to(`room_${info.room_id}`).emit('user_left', {
                    user_id:   info.user_id,
                    user_type: info.user_type,
                });
            }
            connectedUsers.delete(socket.id);
            console.log(`[Socket] Disconnected: ${socket.id}`);
        });
    });
};

module.exports = { initChatSocket };