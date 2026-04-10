// ===== INITIALIZE VARIABLES =====
const BASE_URL = 'https://alumni-connect-backend-yy97.onrender.com/api';

// Get IDs from URL and session
const urlParams = new URLSearchParams(window.location.search);
const alumniUserId = urlParams.get('id');
const studentUserId = sessionStorage.getItem('userId');

// Validation
if (!alumniUserId) {
    alert('No alumni selected!');
    window.location.href = 'search-alumni.html';
}

if (!studentUserId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

let alumniData = null;

// ===== FETCH ALUMNI PROFILE =====
async function loadAlumniProfile() {
    try {
        console.log('Fetching profile for user_id:', alumniUserId);
        
        const response = await fetch(`${BASE_URL}/alumni/profile/${alumniUserId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        alumniData = await response.json();
        console.log('Profile data:', alumniData);
        
        displayProfile(alumniData);

        const sendBtn = document.getElementById('sendRequestBtn');
        if (alumniData.available_for_mentorship) {
            sendBtn.style.display = 'flex';
        }

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
    document.getElementById('displayFullName').textContent = alumni.full_name || '-';
    document.getElementById('displayDesignation').textContent = alumni.designation || '-';
    document.getElementById('displayCompany').textContent = alumni.company || '-';
    document.getElementById('displayBranch').textContent = alumni.branch || '-';
    document.getElementById('displayGradYear').textContent = alumni.graduation_year || '-';

    const avatarImg = document.getElementById('avatarImg');
    if (avatarImg) {
        avatarImg.src = alumni.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'A')}&size=150&background=2563eb&color=fff`;
    }

    const mentorshipBadge = document.getElementById('mentorshipBadge');
    const notAvailableBadge = document.getElementById('notAvailableBadge');
    
    if (alumni.available_for_mentorship) {
        if (mentorshipBadge) mentorshipBadge.style.display = 'inline-flex';
        if (notAvailableBadge) notAvailableBadge.style.display = 'none';
    } else {
        if (mentorshipBadge) mentorshipBadge.style.display = 'none';
        if (notAvailableBadge) notAvailableBadge.style.display = 'inline-flex';
    }

    // Helper function to safely set text content
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('displayCompany2', alumni.company || '-');
    setText('displayDesignation2', alumni.designation || '-');
    setText('displayExperience', alumni.experience_years ? alumni.experience_years + ' years' : '-');
    setText('displayIndustry', alumni.industry || '-');
    setText('displayEmail', alumni.email || '-');
    setText('displayMentorship', alumni.available_for_mentorship ? '✅ Yes' : '❌ No');
    setText('displayMaxMentees', alumni.max_mentees || '-');
    setText('displayContact', alumni.preferred_contact || 'Not specified');
    setText('displayBio', alumni.bio || 'No bio added yet.');

    // Skills
    const skillsContainer = document.getElementById('displaySkills');
    if (skillsContainer) {
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
    }

    // Mentorship areas
    const areasContainer = document.getElementById('displayMentorshipAreas');
    if (areasContainer) {
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
    }

    // Social links
    const linkedinLink = document.getElementById('linkedinLink');
    const linkedinText = document.getElementById('linkedinText');
    if (alumni.linkedin && linkedinLink && linkedinText) {
        linkedinLink.href = alumni.linkedin;
        linkedinText.textContent = alumni.linkedin.replace('https://', '');
    } else if (linkedinText) {
        linkedinText.textContent = 'Not added';
    }

    const githubLink = document.getElementById('githubLink');
    const githubText = document.getElementById('githubText');
    if (alumni.github && githubLink && githubText) {
        githubLink.href = alumni.github;
        githubText.textContent = alumni.github.replace('https://', '');
    } else if (githubText) {
        githubText.textContent = 'Not added';
    }

    const portfolioLink = document.getElementById('portfolioLink');
    const portfolioText = document.getElementById('portfolioText');
    if (alumni.portfolio && portfolioLink && portfolioText) {
        portfolioLink.href = alumni.portfolio;
        portfolioText.textContent = alumni.portfolio.replace('https://', '');
    } else if (portfolioText) {
        portfolioText.textContent = 'Not added';
    }
}

// ===== MODAL FUNCTIONS =====
const sendRequestBtn = document.getElementById('sendRequestBtn');
if (sendRequestBtn) {
    sendRequestBtn.addEventListener('click', () => {
        document.getElementById('requestModal').style.display = 'flex';
    });
}

const closeModal = document.getElementById('closeModal');
if (closeModal) {
    closeModal.addEventListener('click', () => {
        document.getElementById('requestModal').style.display = 'none';
        const messageTextarea = document.getElementById('requestMessage');
        if (messageTextarea) messageTextarea.value = '';
    });
}

const submitRequest = document.getElementById('submitRequest');
if (submitRequest) {
    submitRequest.addEventListener('click', async () => {
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
                    alumni_id: alumniData.alumni_id,
                    message
                })
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('requestModal').style.display = 'none';
                alert('✅ ' + result.message);
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
}

// Close modal when clicking cancel button
const closeModal2 = document.getElementById('closeModal2');
if (closeModal2) {
    closeModal2.addEventListener('click', () => {
        document.getElementById('requestModal').style.display = 'none';
    });
}

// ===== START =====
loadAlumniProfile();
