const BASE_URL     = 'http://localhost:5000/api';
const urlParams    = new URLSearchParams(window.location.search);
const alumniUserId = urlParams.get('id');  // this is user_id of alumni
const studentUserId = sessionStorage.getItem('userId'); // this is user_id of student

if (!alumniUserId) {
    alert('No alumni selected!');
    window.location.href = 'search-alumni.html';
}

if (!studentUserId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

let alumniData = null; // store alumni data for later use

// ===== FETCH ALUMNI PROFILE =====
async function loadAlumniProfile() {
    try {
        const response = await fetch(`${BASE_URL}/alumni/profile/${alumniUserId}`);
        if (!response.ok) throw new Error('Failed to load profile');
        alumniData = await response.json();
        displayProfile(alumniData);

        // Show/hide send request button
        const sendBtn = document.getElementById('sendRequestBtn');
        if (alumniData.available_for_mentorship) {
            sendBtn.style.display = 'flex';
        }

        // Check student slots
        await checkStudentSlots();

    } catch (error) {
        console.error('Error:', error);
        alert('Error loading profile. Please try again.');
        window.location.href = 'search-alumni.html';
    }
}

// ===== CHECK STUDENT SLOTS =====
async function checkStudentSlots() {
    try {
        const response = await fetch(`${BASE_URL}/requests/slots/${studentUserId}`);
        const slots = await response.json();

        const sendBtn = document.getElementById('sendRequestBtn');

        if (!slots.canSend) {
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<i class="fas fa-lock"></i> No Slots Available';
            sendBtn.title = `You have ${slots.activeCount} active mentor(s) and ${slots.pendingCount} pending request(s)`;
        }
    } catch (error) {
        console.error('Error checking slots:', error);
    }
}

// ===== DISPLAY PROFILE =====
function displayProfile(alumni) {
    document.getElementById('displayFullName').textContent    = alumni.full_name || '-';
    document.getElementById('displayDesignation').textContent = alumni.designation || '-';
    document.getElementById('displayCompany').textContent     = alumni.company || '-';
    document.getElementById('displayBranch').textContent      = alumni.branch || '-';
    document.getElementById('displayGradYear').textContent    = alumni.graduation_year || '-';

    document.getElementById('avatarImg').src = alumni.profile_photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=150&background=2563eb&color=fff`;

    if (alumni.available_for_mentorship) {
        document.getElementById('mentorshipBadge').style.display   = 'inline-flex';
        document.getElementById('notAvailableBadge').style.display = 'none';
    } else {
        document.getElementById('mentorshipBadge').style.display   = 'none';
        document.getElementById('notAvailableBadge').style.display = 'inline-flex';
    }

    document.getElementById('displayCompany2').textContent     = alumni.company || '-';
    document.getElementById('displayDesignation2').textContent = alumni.designation || '-';
    document.getElementById('displayExperience').textContent   = alumni.experience_years ? alumni.experience_years + ' years' : '-';
    document.getElementById('displayIndustry').textContent     = alumni.industry || '-';
    document.getElementById('displayEmail').textContent        = alumni.email || '-';
    document.getElementById('displayMentorship').textContent   = alumni.available_for_mentorship ? '✅ Yes' : '❌ No';
    document.getElementById('displayMaxMentees').textContent   = alumni.max_mentees || '-';
    document.getElementById('displayContact').textContent      = alumni.preferred_contact || 'Not specified';
    document.getElementById('displayBio').textContent          = alumni.bio || 'No bio added yet.';

    // Skills
    const skillsContainer = document.getElementById('displaySkills');
    skillsContainer.innerHTML = '';
    const skills = Array.isArray(alumni.skills) ? alumni.skills : [];
    if (skills.length > 0 && skills[0] !== '') {
        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = skill.trim();
            skillsContainer.appendChild(tag);
        });
    } else {
        skillsContainer.innerHTML = '<span class="tag">No skills added</span>';
    }

    // Mentorship areas
    const areasContainer = document.getElementById('displayMentorshipAreas');
    areasContainer.innerHTML = '';
    const areas = Array.isArray(alumni.mentorship_areas) ? alumni.mentorship_areas : [];
    if (areas.length > 0 && areas[0] !== '') {
        areas.forEach(area => {
            const tag = document.createElement('span');
            tag.className = 'tag mentorship-tag';
            tag.textContent = area.trim();
            areasContainer.appendChild(tag);
        });
    } else {
        areasContainer.innerHTML = '<span class="tag">Not specified</span>';
    }

    // Social links
    if (alumni.linkedin) {
        document.getElementById('linkedinLink').href = alumni.linkedin;
        document.getElementById('linkedinText').textContent = alumni.linkedin.replace('https://', '');
    } else {
        document.getElementById('linkedinText').textContent = 'Not added';
    }

    if (alumni.github) {
        document.getElementById('githubLink').href = alumni.github;
        document.getElementById('githubText').textContent = alumni.github.replace('https://', '');
    } else {
        document.getElementById('githubText').textContent = 'Not added';
    }

    if (alumni.portfolio) {
        document.getElementById('portfolioLink').href = alumni.portfolio;
        document.getElementById('portfolioText').textContent = alumni.portfolio.replace('https://', '');
    } else {
        document.getElementById('portfolioText').textContent = 'Not added';
    }
}

// ===== SEND REQUEST — Show modal =====
document.getElementById('sendRequestBtn').addEventListener('click', () => {
    document.getElementById('requestModal').style.display = 'flex';
});

// ===== CLOSE MODAL =====
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('requestModal').style.display = 'none';
    document.getElementById('requestMessage').value = '';
});

// ===== SUBMIT REQUEST =====
document.getElementById('submitRequest').addEventListener('click', async () => {
    const message = document.getElementById('requestMessage').value.trim();

    if (!message || message.length < 10) {
        alert('⚠️ Please write a message of at least 10 characters explaining why you want mentorship.');
        return;
    }

    const submitBtn = document.getElementById('submitRequest');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/requests/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: parseInt(studentUserId),
                alumni_id:  alumniData.alumni_id,
                message
            })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('requestModal').style.display = 'none';
            alert('✅ ' + result.message);
            // Refresh slot info
            await checkStudentSlots();
        } else {
            alert('❌ ' + result.message);
        }

    } catch (error) {
        console.error('Error sending request:', error);
        alert('❌ Network error. Make sure server is running.');
    } finally {
        submitBtn.textContent = 'Send Request';
        submitBtn.disabled = false;
    }
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

loadAlumniProfile();