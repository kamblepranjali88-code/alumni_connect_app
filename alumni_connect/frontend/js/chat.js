// frontend/js/chat.js
'use strict';

const STATE = {
  userId: null,
  userType: null,
  userName: null,
  userPhoto: null,
  rooms: [],
  activeRoomId: null,
  socket: null,
  typingTimer: null,
  isTyping: false,
  onlineUsers: new Set(),
};

const SERVER = 'http://localhost:5000';

function el(id) { return document.getElementById(id); }

function formatTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function avatarUrl(photo, name) {
  if (photo) return photo;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0a66c2&color=fff&size=100`;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function showToast(msg, type = '') {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function scrollToBottom() {
  const area = el('messagesArea');
  if (area) area.scrollTop = area.scrollHeight;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  STATE.userId = sessionStorage.getItem('userId');
  STATE.userType = sessionStorage.getItem('userType') || sessionStorage.getItem('user_type');
  STATE.userName = sessionStorage.getItem('fullName') || sessionStorage.getItem('full_name') || 'User';
  STATE.userPhoto = sessionStorage.getItem('profilePhoto') || sessionStorage.getItem('profile_photo') || null;

  console.log('[Chat] userId:', STATE.userId, '| userType:', STATE.userType);

  if (!STATE.userId || !STATE.userType) {
    window.location.href = 'login.html';
    return;
  }

  const navImg = el('navAvatarImg');
  if (navImg) navImg.src = avatarUrl(STATE.userPhoto, STATE.userName);

  const subtitle = el('sidebarSubtitle');
  if (subtitle) subtitle.textContent = STATE.userType === 'student' ? 'Your Mentors (max 2)' : 'Your Mentees (max 3)';

  if (STATE.userType === 'alumni') updateNavbarForAlumni();

  await loadRooms();
  initSocket();

  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room_id');
  if (roomParam) openRoom(parseInt(roomParam));
}

function updateNavbarForAlumni() {
  const navLinks = el('navLinks');
  if (!navLinks) return;
  navLinks.innerHTML = `
    <a href="alumni-dashboard.html" class="nav-link"><i class="fas fa-home"></i> Dashboard</a>
    <a href="alumni-profile.html"   class="nav-link"><i class="fas fa-user"></i> Profile</a>
    <a href="my-connections-alumni.html" class="nav-link"><i class="fas fa-handshake"></i> Connections</a>
    <a href="chat.html" class="nav-link active">
      <i class="fas fa-comments"></i> Chat
      <span class="nav-badge" id="navUnreadBadge" style="display:none">0</span>
    </a>
  `;
}

// ── Load Rooms ────────────────────────────────────────────────────────────────
async function loadRooms() {
  try {
    const res = await fetch(`${SERVER}/api/chat/my-rooms?user_id=${STATE.userId}&user_type=${STATE.userType}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    STATE.rooms = data.rooms;
    renderSidebar(STATE.rooms);
    loadNavUnread();
  } catch (err) {
    console.error('loadRooms error:', err);
    const list = el('contactList');
    if (list) list.innerHTML = `
      <div class="sidebar-empty">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load conversations. Please refresh.</p>
      </div>`;
  }
}

async function loadNavUnread() {
  try {
    const res = await fetch(`${SERVER}/api/chat/unread-count?user_id=${STATE.userId}&user_type=${STATE.userType}`);
    const data = await res.json();
    updateNavBadge(data.total_unread || 0);
  } catch (_) { }
}

function updateNavBadge(count) {
  const badge = el('navUnreadBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count > 9 ? '9+' : count;
}

// ── Render Sidebar ────────────────────────────────────────────────────────────
function renderSidebar(rooms) {
  const list = el('contactList');
  if (!list) return;

  if (!rooms || rooms.length === 0) {
    list.innerHTML = `
      <div class="sidebar-empty">
        <i class="fas fa-comments"></i>
        <p>No active mentorship chats.<br>Chats open when a request is accepted.</p>
      </div>`;
    return;
  }

  list.innerHTML = rooms.map(room => {
    const other = STATE.userType === 'student' ? room.alumni : room.students;
    const name = other?.full_name || 'Unknown';
    const photo = avatarUrl(other?.profile_photo, name);
    const tag = STATE.userType === 'student'
      ? `<span class="contact-tag tag-mentor">Mentor</span>`
      : `<span class="contact-tag tag-mentee">Mentee</span>`;
    const subInfo = STATE.userType === 'student'
      ? `${other?.designation || ''} ${other?.company ? '@ ' + other.company : ''}`
      : `${other?.branch || ''} ${other?.year ? '• Year ' + other.year : ''}`;
    const lastText = room.last_message
      ? (room.last_message.sender_type === STATE.userType ? '✓ ' : '') + room.last_message.message_text
      : 'Start the conversation...';
    const lastTime = room.last_message ? formatTime(room.last_message.sent_at) : '';
    const unreadBadge = room.unread_count > 0 ? `<span class="contact-unread">${room.unread_count}</span>` : '';
    const daysTag = room.days_remaining <= 3 ? `<span class="contact-days"><i class="fas fa-clock"></i> ${room.days_remaining}d left</span>` : '';
    const isActive = STATE.activeRoomId === room.room_id ? 'active' : '';
    const isOnline = STATE.onlineUsers.has(String(other?.user_id)) ? '<span class="contact-online"></span>' : '';

    return `
      <div class="contact-item ${isActive}" id="contact_${room.room_id}" onclick="openRoom(${room.room_id})">
        <div class="contact-avatar">
          <img src="${photo}" alt="${escapeHtml(name)}">${isOnline}
        </div>
        <div class="contact-body">
          <div class="contact-name">${escapeHtml(name)}</div>
          <div style="font-size:11px;color:var(--gray-400);margin-bottom:2px">${escapeHtml(subInfo)}</div>
          ${tag}
          <div class="contact-preview">${escapeHtml(lastText)}</div>
        </div>
        <div class="contact-meta">
          <span class="contact-time">${lastTime}</span>
          ${unreadBadge}${daysTag}
        </div>
      </div>`;
  }).join('');
}

function filterContacts() {
  const q = (el('searchInput')?.value || '').toLowerCase();
  const filtered = STATE.rooms.filter(room => {
    const other = STATE.userType === 'student' ? room.alumni : room.students;
    return (other?.full_name || '').toLowerCase().includes(q);
  });
  renderSidebar(filtered);
}

// ── Open Room ─────────────────────────────────────────────────────────────────
async function openRoom(roomId) {
  if (STATE.activeRoomId === roomId) return;
  hideSidebar();
  STATE.activeRoomId = roomId;

  document.querySelectorAll('.contact-item').forEach(e => e.classList.remove('active'));
  const contactEl = el(`contact_${roomId}`);
  if (contactEl) contactEl.classList.add('active');

  const room = STATE.rooms.find(r => r.room_id === roomId);
  if (!room) return;

  const other = STATE.userType === 'student' ? room.alumni : room.students;
  const name = other?.full_name || 'User';
  const photo = avatarUrl(other?.profile_photo, name);
  const subInfo = STATE.userType === 'student'
    ? `${other?.designation || ''} ${other?.company ? '@ ' + other.company : ''}`
    : `${other?.branch || ''} ${other?.year ? '• Year ' + other.year : ''}`;

  if (el('chatAvatar')) el('chatAvatar').src = photo;
  if (el('chatName')) el('chatName').textContent = name;
  if (el('chatSubInfo')) el('chatSubInfo').textContent = subInfo;
  if (el('emptyState')) el('emptyState').style.display = 'none';
  if (el('chatWindow')) el('chatWindow').style.display = 'flex';
  if (el('messagesLoading')) el('messagesLoading').style.display = 'flex';
  if (el('messagesList')) el('messagesList').innerHTML = '';
  if (el('messageInput')) el('messageInput').value = '';
  if (el('charCount')) el('charCount').textContent = '0 / 2000';
  if (el('sendBtn')) el('sendBtn').disabled = true;
  if (el('typingIndicator')) el('typingIndicator').style.display = 'none';

  if (STATE.socket) {
    STATE.socket.emit('join_room', {
      room_id: roomId, user_id: parseInt(STATE.userId), user_type: STATE.userType
    });
  }

  try {
    const res = await fetch(`${SERVER}/api/chat/${roomId}/messages?user_id=${STATE.userId}&user_type=${STATE.userType}`);
    const data = await res.json();
    if (el('messagesLoading')) el('messagesLoading').style.display = 'none';
    if (!data.success) throw new Error(data.error);

    renderMessages(data.messages, other, photo);

    const days = data.daysRemaining;
    if (el('expiryText')) el('expiryText').textContent = `${days} day${days !== 1 ? 's' : ''} left`;
    if (el('expiryBadge')) el('expiryBadge').className = 'expiry-badge ' + (days <= 3 ? 'urgent' : days > 10 ? 'safe' : '');
    if (el('chatExpiryNote')) el('chatExpiryNote').textContent = days <= 3 ? `⚠ Chat expires in ${days} days` : '';

    if (days === 0 || !room.is_active) {
      if (el('expiredOverlay')) el('expiredOverlay').style.display = 'flex';
    }

    await fetch(`${SERVER}/api/chat/${roomId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_type: STATE.userType }),
    });

    const roomState = STATE.rooms.find(r => r.room_id === roomId);
    if (roomState) roomState.unread_count = 0;
    renderSidebar(STATE.rooms);
    loadNavUnread();

  } catch (err) {
    console.error('openRoom error:', err);
    if (el('messagesLoading')) el('messagesLoading').style.display = 'none';
    if (el('messagesList')) el('messagesList').innerHTML =
      `<div style="text-align:center;color:var(--gray-400);padding:40px">Failed to load messages.</div>`;
  }
}

// ── Render Messages ───────────────────────────────────────────────────────────
function renderMessages(messages, other, otherPhoto) {
  const list = el('messagesList');
  if (!list) return;
  list.innerHTML = '';

  if (!messages || messages.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;color:var(--gray-400);padding:40px;font-size:14px">
        <i class="fas fa-comments" style="font-size:28px;margin-bottom:12px;display:block;opacity:0.4"></i>
        No messages yet — start the conversation!
      </div>`;
    return;
  }

  let lastDate = null;
  messages.forEach(msg => {
    // System message = session ended divider
    if (msg.sender_type === 'system' && msg.message_text === 'SESSION_ENDED') {
      appendSessionDivider(msg);
      return;
    }

    const msgDate = formatDate(msg.sent_at);
    if (msgDate !== lastDate) {
      lastDate = msgDate;
      const sep = document.createElement('div');
      sep.className = 'date-separator';
      sep.innerHTML = `<span>${msgDate}</span>`;
      list.appendChild(sep);
    }
    appendBubble(msg, otherPhoto);
  });

  scrollToBottom();
}

// ── Append session ended divider ──────────────────────────────────────────────
function appendSessionDivider(msg) {
  const list = el('messagesList');
  if (!list) return;
  if (el(`sys_${msg.message_id}`)) return;

  const div = document.createElement('div');
  div.className = 'session-divider';
  div.id = `sys_${msg.message_id}`;
  div.innerHTML = `
    <div class="session-divider-label">
      <i class="fas fa-check-circle"></i>
      Session ended · ${formatDate(msg.sent_at)} ${formatTime(msg.sent_at)}
    </div>`;
  list.appendChild(div);
}

function appendBubble(msg, otherPhoto) {
  const list = el('messagesList');
  if (!list) return;
  if (msg.sender_type === 'system') return; // handled separately
  const isMine = msg.sender_type === STATE.userType;
  if (el(`msg_${msg.message_id}`)) return;

  const row = document.createElement('div');
  row.className = `msg-row ${isMine ? 'mine' : ''}`;
  row.id = `msg_${msg.message_id}`;

  const tick = isMine ? `<i class="fas fa-check-double msg-tick ${msg.is_read ? 'read' : ''}"></i>` : '';

  row.innerHTML = `
    ${!isMine ? `<img src="${otherPhoto || ''}" class="msg-avatar" alt="avatar">` : ''}
    <div class="msg-bubble ${isMine ? 'outgoing' : 'incoming'}">
      ${escapeHtml(msg.message_text)}
      <span class="msg-time">${formatTime(msg.sent_at)} ${tick}</span>
    </div>`;
  list.appendChild(row);
}

// ── Send Message ──────────────────────────────────────────────────────────────
function sendMessage() {
  const input = el('messageInput');
  const content = input ? input.value.trim() : '';
  if (!content || !STATE.activeRoomId || !STATE.socket) return;

  STATE.socket.emit('send_message', {
    room_id: STATE.activeRoomId,
    sender_user_id: parseInt(STATE.userId),
    sender_type: STATE.userType,
    message_text: content,
  });

  if (input) input.value = '';
  if (el('charCount')) el('charCount').textContent = '0 / 2000';
  if (el('sendBtn')) el('sendBtn').disabled = true;
  stopTyping();
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function handleTyping() {
  const input = el('messageInput');
  const val = input ? input.value : '';
  if (el('charCount')) el('charCount').textContent = `${val.length} / 2000`;
  if (el('sendBtn')) el('sendBtn').disabled = val.trim().length === 0;

  if (!STATE.socket || !STATE.activeRoomId) return;
  if (!STATE.isTyping) {
    STATE.isTyping = true;
    STATE.socket.emit('typing', { room_id: STATE.activeRoomId, user_id: parseInt(STATE.userId), user_type: STATE.userType });
  }
  clearTimeout(STATE.typingTimer);
  STATE.typingTimer = setTimeout(stopTyping, 2000);
}

function stopTyping() {
  if (!STATE.isTyping) return;
  STATE.isTyping = false;
  if (STATE.socket && STATE.activeRoomId)
    STATE.socket.emit('stop_typing', { room_id: STATE.activeRoomId });
}

// ── End Session ───────────────────────────────────────────────────────────────
function confirmEndSession() {
  if (el('endSessionModal')) el('endSessionModal').style.display = 'flex';
}

function closeEndSessionModal() {
  if (el('endSessionModal')) el('endSessionModal').style.display = 'none';
}

function endSession() {
  closeEndSessionModal();
  if (!STATE.activeRoomId || !STATE.socket) return;

  STATE.socket.emit('end_session', {
    room_id: STATE.activeRoomId,
    user_id: parseInt(STATE.userId),
    user_type: STATE.userType,
  });
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────
function initSocket() {
  STATE.socket = io(SERVER, { transports: ['websocket', 'polling'] });

  STATE.socket.on('connect', () => {
    console.log('[Socket] Connected:', STATE.socket.id);
    STATE.socket.emit('register_user', { user_id: parseInt(STATE.userId) });
  });

  STATE.socket.on('disconnect', () => console.log('[Socket] Disconnected'));

  STATE.socket.on('new_message', (msg) => {
    if (msg.room_id !== STATE.activeRoomId) return;

    const room = STATE.rooms.find(r => r.room_id === msg.room_id);
    const other = room ? (STATE.userType === 'student' ? room.alumni : room.students) : null;
    const otherPhoto = avatarUrl(other?.profile_photo, other?.full_name);

    appendBubble(msg, otherPhoto);
    scrollToBottom();
    if (el('typingIndicator')) el('typingIndicator').style.display = 'none';

    if (room) {
      room.last_message = { message_text: msg.message_text, sent_at: msg.sent_at, sender_type: msg.sender_type };
      renderSidebar(STATE.rooms);
    }
  });

  // Session ended — show divider to both users instantly
  STATE.socket.on('session_ended', ({ session_number, ended_by, system_message }) => {
    if (system_message) appendSessionDivider(system_message);
    scrollToBottom();
    showToast(`Session ${session_number} ended. Next message will notify your ${STATE.userType === 'student' ? 'mentor' : 'mentee'} by email.`, 'success');
  });

  STATE.socket.on('message_notification', ({ room_id, sender_type, preview }) => {
    if (room_id === STATE.activeRoomId) return;
    const room = STATE.rooms.find(r => r.room_id === room_id);
    if (room) {
      room.unread_count = (room.unread_count || 0) + 1;
      room.last_message = { message_text: preview, sent_at: new Date().toISOString(), sender_type };
    }
    renderSidebar(STATE.rooms);
    loadNavUnread();
    const other = room ? (STATE.userType === 'student' ? room.alumni : room.students) : null;
    showToast(`New message from ${other?.full_name || 'Someone'}`);
  });

  STATE.socket.on('typing', () => {
    if (!STATE.activeRoomId) return;
    const room = STATE.rooms.find(r => r.room_id === STATE.activeRoomId);
    const other = room ? (STATE.userType === 'student' ? room.alumni : room.students) : null;
    if (el('typingName')) el('typingName').textContent = other?.full_name || 'Someone';
    if (el('typingIndicator')) el('typingIndicator').style.display = 'flex';
    scrollToBottom();
  });

  STATE.socket.on('stop_typing', () => {
    if (el('typingIndicator')) el('typingIndicator').style.display = 'none';
  });

  STATE.socket.on('user_joined', ({ user_id }) => {
    STATE.onlineUsers.add(String(user_id));
    if (el('onlineDot')) el('onlineDot').classList.add('visible');
    if (el('chatSubInfo')) el('chatSubInfo').textContent = '● Online';
  });

  STATE.socket.on('user_left', ({ user_id }) => {
    STATE.onlineUsers.delete(String(user_id));
    if (el('onlineDot')) el('onlineDot').classList.remove('visible');
    const room = STATE.rooms.find(r => r.room_id === STATE.activeRoomId);
    if (room && el('chatSubInfo')) {
      const other = STATE.userType === 'student' ? room.alumni : room.students;
      el('chatSubInfo').textContent = STATE.userType === 'student'
        ? `${other?.designation || ''} ${other?.company ? '@ ' + other.company : ''}`
        : `${other?.branch || ''} ${other?.year ? '• Year ' + other.year : ''}`;
    }
  });

  STATE.socket.on('chat_expired', () => {
    if (el('expiredOverlay')) el('expiredOverlay').style.display = 'flex';
  });

  STATE.socket.on('error', ({ message }) => showToast(message, 'error'));
}

// ── Mobile ────────────────────────────────────────────────────────────────────
function showSidebar() { el('chatSidebar')?.classList.remove('hidden'); }
function hideSidebar() { if (window.innerWidth <= 768) el('chatSidebar')?.classList.add('hidden'); }
function closeSidebar() { el('chatSidebar')?.classList.add('hidden'); }

function closeExpiredOverlay() {
  if (el('expiredOverlay')) el('expiredOverlay').style.display = 'none';
  if (el('messageInput')) { el('messageInput').disabled = true; el('messageInput').placeholder = 'This chat has expired.'; }
  if (el('sendBtn')) el('sendBtn').disabled = true;
  if (el('btnEndSession')) el('btnEndSession').style.display = 'none';
}

function logout() {
  sessionStorage.clear();
  if (STATE.socket) STATE.socket.disconnect();
  window.location.href = 'login.html';
}