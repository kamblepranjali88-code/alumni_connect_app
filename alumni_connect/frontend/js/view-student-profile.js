const BASE_URL = 'http://localhost:5000/api';
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

if (!studentId) {
    alert('No student selected!');
    window.location.href = 'mentorship-requests.html';
}

async function loadStudentProfile() {
    try {
        const response = await fetch(`${BASE_URL}/auth/student/profile/${studentId}`);
        if (!response.ok) throw new Error('Failed to load');
        const student = await response.json();
        displayProfile(student);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading student profile.');
        window.location.href = 'mentorship-requests.html';
    }
}

function displayProfile(student) {
    const yearLabels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };

    document.getElementById('displayFullName').textContent  = student.full_name || '-';
    document.getElementById('displayFullName2').textContent = student.full_name || '-';
    document.getElementById('displayBranch').textContent    = student.branch || '-';
    document.getElementById('displayBranch2').textContent   = student.branch || '-';
    document.getElementById('displayYear').textContent      = yearLabels[student.year] || student.year || '-';
    document.getElementById('displayYear2').textContent     = yearLabels[student.year] || student.year || '-';
    document.getElementById('displayRollNumber').textContent = student.roll_number || '-';
    document.getElementById('displayEmail').textContent     = student.email || '-';
    document.getElementById('displayEmail2').textContent    = student.email || '-';
    document.getElementById('displayGoals').textContent     = student.goals || 'No goals added yet.';

    // Avatar
    document.getElementById('avatarImg').src = student.profile_photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'S')}&size=150&background=2563eb&color=fff`;

    // Interests/Skills
    const container = document.getElementById('displayInterests');
    container.innerHTML = '';
    const interests = Array.isArray(student.interests) ? student.interests : [];
    if (interests.length > 0 && interests[0] !== '') {
        interests.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = skill.trim();
            container.appendChild(tag);
        });
    } else {
        container.innerHTML = '<span class="tag">No skills added</span>';
    }

    // Social links
    if (student.linkedin) {
        document.getElementById('linkedinLink').href = student.linkedin;
        document.getElementById('linkedinText').textContent = student.linkedin.replace('https://', '');
    } else {
        document.getElementById('linkedinText').textContent = 'Not added';
    }

    if (student.github) {
        document.getElementById('githubLink').href = student.github;
        document.getElementById('githubText').textContent = student.github.replace('https://', '');
    } else {
        document.getElementById('githubText').textContent = 'Not added';
    }
}

document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = 'login.html';
});

loadStudentProfile();