// frontend/js/navbar.js
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in navbar for every page.
// Add ONE line to your HTML body:  <div id="navbar-placeholder"></div>
// Add ONE script before </body>:   <script src="../js/navbar.js"></script>
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    const userType   = sessionStorage.getItem('userType')
                    || sessionStorage.getItem('user_type')
                    || 'guest';

    const currentPage = window.location.pathname.split('/').pop();

    function active(page) {
        return currentPage === page ? 'class="active"' : '';
    }

    // ── Link sets per role ────────────────────────────────────────────────────
    const studentLinks = `
        <a href="student-dashboard.html"      ${active('student-dashboard.html')}>Dashboard</a>
        <a href="student-profile.html"        ${active('student-profile.html')}>My Profile</a>
        <a href="search-alumni.html"          ${active('search-alumni.html')}>Search Alumni</a>
        <a href="my-connections-student.html" ${active('my-connections-student.html')}>My Connections</a>
        <a href="chat.html"                   ${active('chat.html')}>Chat</a>
        <a href="job-opportunities.html"      ${active('job-opportunities.html')}>Jobs</a>
        <a href="events.html"                 ${active('events.html')}>Events</a>
        <a href="student-forum.html"          ${active('student-forum.html')}>Forum</a>
        <a href="#" class="logout" id="navLogout">Logout</a>
    `;

    const alumniLinks = `
        <a href="alumni-dashboard.html"       ${active('alumni-dashboard.html')}>Dashboard</a>
        <a href="alumni-profile.html"         ${active('alumni-profile.html')}>My Profile</a>
        <a href="mentorship-requests.html"    ${active('mentorship-requests.html')}>Requests</a>
        <a href="my-connections-alumni.html"  ${active('my-connections-alumni.html')}>My Connections</a>
        <a href="chat.html"                   ${active('chat.html')}>Chat</a>
        <a href="alumni-post-job.html"        ${active('alumni-post-job.html')}>Post Job</a>
        <a href="events.html"                 ${active('events.html')}>Events</a>
        <a href="#" class="logout" id="navLogout">Logout</a>
    `;

    const adminLinks = `
        <a href="admin-dashboard.html"        ${active('admin-dashboard.html')}>Dashboard</a>
        <a href="admin-add-events.html"       ${active('admin-add-events.html')}>Add Events</a>
        <a href="#" class="logout" id="navLogout">Logout</a>
    `;

    const guestLinks = `
        <a href="login.html">Login</a>
        <a href="role_select.html">Register</a>
    `;

    // ── Brand per role ────────────────────────────────────────────────────────
    const icons = {
        student: 'fa-user-graduate',
        alumni:  'fa-user-tie',
        admin:   'fa-shield-halved',
        guest:   'fa-graduation-cap'
    };

    const subtitles = {
        student: 'Student Portal',
        alumni:  'Alumni Portal',
        admin:   'Admin Panel',
        guest:   'Connect & Grow'
    };

    const links    = { student: studentLinks, alumni: alumniLinks, admin: adminLinks, guest: guestLinks };
    const icon     = icons[userType]    || icons.guest;
    const subtitle = subtitles[userType]|| subtitles.guest;
    const navLinks = links[userType]    || links.guest;

    // ── Build the full navbar HTML ────────────────────────────────────────────
    const navbarHTML = `
        <header class="navbar">
            <div class="brand">
                <i class="fas ${icon}"></i>
                <div>
                    <div class="brand-title">Tech University</div>
                    <div class="brand-subtitle">${subtitle}</div>
                </div>
            </div>
            <nav class="nav-links">
                ${navLinks}
            </nav>
        </header>
    `;

    // ── Inject ────────────────────────────────────────────────────────────────
    // Use outerHTML so the placeholder <div> is fully replaced by <header>
    // This avoids a wrapper div breaking the fixed positioning
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) {
        console.warn('[navbar.js] No element with id="navbar-placeholder" found.');
        return;
    }

    placeholder.outerHTML = navbarHTML;

    // ── Logout handler ────────────────────────────────────────────────────────
    // Must query AFTER outerHTML replacement since the old element is gone
    const logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }

})();