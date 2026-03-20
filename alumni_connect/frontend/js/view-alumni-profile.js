const BASE_URL = 'http://localhost:5000/api/alumni';

const urlParams = new URLSearchParams(window.location.search);
const alumniId  = urlParams.get('id');
const studentId = sessionStorage.getItem('userId');

if (!alumniId) {
    alert('No alumni selected!');
    window.location.href = 'search-alumni.html';
}

if (!studentId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

// ===== FETCH ALUMNI PROFILE =====
async function loadAlumniProfile() {
    try {
        const response = await fetch(`${BASE_URL}/profile/${alumniId}`);
        if (!response.ok) throw new Error('Failed to load profile');
        const alumni = await response.json();
        displayProfile(alumni);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading profile. Please try again.');
        window.location.href = 'search-alumni.html';
    }
}

// ===== DISPLAY PROFILE =====
function displayProfile(alumni) {
    // Hero info
    document.getElementById('displayFullName').textContent    = alumni.full_name || '-';
    document.getElementById('displayDesignation').textContent = alumni.designation || '-';
    document.getElementById('displayCompany').textContent     = alumni.company || '-';
    document.getElementById('displayBranch').textContent      = alumni.branch || '-';
    document.getElementById('displayGradYear').textContent    = alumni.graduation_year || '-';

    // Avatar
    document.getElementById('avatarImg').src = alumni.profile_photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=150&background=2563eb&color=fff`;

    // Mentorship badges
    if (alumni.available_for_mentorship) {
        document.getElementById('mentorshipBadge').style.display    = 'inline-flex';
        document.getElementById('notAvailableBadge').style.display  = 'none';
        document.getElementById('sendRequestBtn').style.display     = 'flex';
    } else {
        document.getElementById('mentorshipBadge').style.display    = 'none';
        document.getElementById('notAvailableBadge').style.display  = 'inline-flex';
        document.getElementById('sendRequestBtn').style.display     = 'none';
    }

    // Professional info
    document.getElementById('displayCompany2').textContent     = alumni.company || '-';
    document.getElementById('displayDesignation2').textContent = alumni.designation || '-';
    document.getElementById('displayExperience').textContent   = alumni.experience_years ? alumni.experience_years + ' years' : '-';
    document.getElementById('displayIndustry').textContent     = alumni.industry || '-';
    document.getElementById('displayEmail').textContent        = alumni.email || '-';

    // Mentorship info
    document.getElementById('displayMentorship').textContent = alumni.available_for_mentorship ? '✅ Yes' : '❌ No';
    document.getElementById('displayMaxMentees').textContent = alumni.max_mentees || '-';
    document.getElementById('displayContact').textContent    = alumni.preferred_contact || 'Not specified';

    // Bio
    document.getElementById('displayBio').textContent = alumni.bio || 'No bio added yet.';

    // Skills tags
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

// ===== SEND REQUEST =====
document.getElementById('sendRequestBtn').addEventListener('click', () => {
    alert('✅ Mentorship request sent successfully!');
});

// ===== LOGOUT =====
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

loadAlumniProfile();