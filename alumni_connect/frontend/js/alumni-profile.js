const BASE_URL = 'http://localhost:5000/api/alumni';

const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn  = document.getElementById('cancelEditBtn');
const profileView    = document.getElementById('profileView');
const profileEdit    = document.getElementById('profileEdit');
const profileForm    = document.getElementById('profileForm');
const photoInput     = document.getElementById('photoInput');
const photoPreview   = document.getElementById('editAvatarImg');
const avatarImg      = document.getElementById('avatarImg');

let uploadedPhotoUrl = null;

// ===== GET USER ID FROM SESSION =====
const userId = sessionStorage.getItem('userId');
if (!userId) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
}

// ===== FETCH PROFILE FROM BACKEND =====
async function loadProfile() {
    try {
        const response = await fetch(`${BASE_URL}/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to load profile');
        const alumni = await response.json();
        displayProfile(alumni);
        fillEditForm(alumni);
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

// ===== DISPLAY PROFILE IN VIEW MODE =====
function displayProfile(alumni) {
    // Hero section
    document.getElementById('displayFullName').textContent    = alumni.full_name || '-';
    document.getElementById('displayDesignation').textContent = alumni.designation || '-';
    document.getElementById('displayCompany').textContent     = alumni.company || '-';
    document.getElementById('displayBranch').textContent      = alumni.branch || '-';

    // Mentorship badge
    const badge = document.getElementById('mentorshipBadge');
    if (alumni.available_for_mentorship) {
        badge.style.display = 'inline-flex';
    } else {
        badge.style.display = 'none';
    }

    // Basic info card
    document.getElementById('displayFullName2').textContent = alumni.full_name || '-';
    document.getElementById('displayEmail').textContent     = alumni.email || '-';
    document.getElementById('displayBranch2').textContent   = alumni.branch || '-';
    document.getElementById('displayGradYear').textContent  = alumni.graduation_year || '-';

    // Professional info
    document.getElementById('displayCompany2').textContent    = alumni.company || '-';
    document.getElementById('displayDesignation2').textContent = alumni.designation || '-';
    document.getElementById('displayExperience').textContent  = alumni.experience_years ? alumni.experience_years + ' years' : '-';
    document.getElementById('displayIndustry').textContent    = alumni.industry || '-';

    // Mentorship info
    document.getElementById('displayMentorship').textContent  = alumni.available_for_mentorship ? '✅ Yes' : '❌ No';
    document.getElementById('displayMaxMentees').textContent  = alumni.max_mentees || '-';
    document.getElementById('displayContact').textContent     = alumni.preferred_contact || '-';

    // Mentorship areas tags
    const mentorshipContainer = document.getElementById('displayMentorshipAreas');
    mentorshipContainer.innerHTML = '';
    const areas = Array.isArray(alumni.mentorship_areas) ? alumni.mentorship_areas : [];
    if (areas.length > 0 && areas[0] !== '') {
        areas.forEach(area => {
            const tag = document.createElement('span');
            tag.className = 'tag mentorship-tag';
            tag.textContent = area.trim();
            mentorshipContainer.appendChild(tag);
        });
    } else {
        mentorshipContainer.innerHTML = '<span class="tag">Not specified</span>';
    }

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

    // Bio
    document.getElementById('displayBio').textContent = alumni.bio || 'No bio added yet.';

    // Avatar
    const avatarSrc = alumni.profile_photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(alumni.full_name || 'User')}&size=150&background=2563eb&color=fff`;
    avatarImg.src = avatarSrc;
    if (photoPreview) photoPreview.src = avatarSrc;

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

// ===== FILL EDIT FORM =====
function fillEditForm(alumni) {
    document.getElementById('editFullName').value  = alumni.full_name || '';
    document.getElementById('editEmail').value     = alumni.email || '';
    document.getElementById('editGradYear').value  = alumni.graduation_year || '';
    document.getElementById('editCompany').value   = alumni.company || '';
    document.getElementById('editDesignation').value = alumni.designation || '';
    document.getElementById('editExperience').value = alumni.experience_years || '';
    document.getElementById('editBio').value       = alumni.bio || '';
    document.getElementById('editLinkedin').value  = alumni.linkedin || '';
    document.getElementById('editGithub').value    = alumni.github || '';
    document.getElementById('editPortfolio').value = alumni.portfolio || '';
    document.getElementById('editMaxMentees').value = alumni.max_mentees || '';

    const branchSelect = document.getElementById('editBranch');
    if (branchSelect) branchSelect.value = alumni.branch || '';

    const industrySelect = document.getElementById('editIndustry');
    if (industrySelect) industrySelect.value = alumni.industry || '';

    const contactSelect = document.getElementById('editPreferredContact');
    if (contactSelect) contactSelect.value = alumni.preferred_contact || '';

    const mentorshipSelect = document.getElementById('editAvailableForMentorship');
    if (mentorshipSelect) mentorshipSelect.value = alumni.available_for_mentorship ? 'true' : 'false';

    const skills = Array.isArray(alumni.skills) ? alumni.skills.join(', ') : '';
    document.getElementById('editSkills').value = skills;

    const areas = Array.isArray(alumni.mentorship_areas) ? alumni.mentorship_areas.join(', ') : '';
    document.getElementById('editMentorshipAreas').value = areas;
}

// ===== COMPRESS IMAGE =====
function compressImage(base64, maxWidth = 300) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
    });
}

// ===== PHOTO UPLOAD =====
if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('❌ Please upload an image file (JPG, PNG, etc.)');
            photoInput.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Photo too large!\n• Max size: 5MB\n• Recommended: 200x200 pixels');
            photoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedPhotoUrl = event.target.result;
            if (photoPreview) photoPreview.src = uploadedPhotoUrl;
            avatarImg.src = uploadedPhotoUrl;
        };
        reader.readAsDataURL(file);
    });
}

// ===== REMOVE PHOTO =====
const removePhotoBtn = document.getElementById('removePhotoBtn');
if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
        const fullName = document.getElementById('editFullName').value || 'User';
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=150&background=2563eb&color=fff`;
        uploadedPhotoUrl = 'REMOVE';
        if (photoPreview) photoPreview.src = defaultAvatar;
        avatarImg.src = defaultAvatar;
        photoInput.value = '';
        alert('✅ Photo will be removed when you save.');
    });
}

// ===== SHOW EDIT MODE =====
editProfileBtn.addEventListener('click', () => {
    profileView.style.display = 'none';
    profileEdit.style.display = 'flex';
    editProfileBtn.style.display = 'none';
    if (photoPreview) photoPreview.src = avatarImg.src;
});

// ===== CANCEL =====
cancelEditBtn.addEventListener('click', () => {
    profileView.style.display = 'flex';
    profileEdit.style.display = 'none';
    editProfileBtn.style.display = 'inline-flex';
    uploadedPhotoUrl = null;
});

// ===== SAVE CHANGES =====
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName       = document.getElementById('editFullName').value.trim();
    const branch         = document.getElementById('editBranch').value;
    const gradYear       = parseInt(document.getElementById('editGradYear').value);
    const company        = document.getElementById('editCompany').value.trim();
    const designation    = document.getElementById('editDesignation').value.trim();
    const experience     = parseInt(document.getElementById('editExperience').value) || 0;
    const industry       = document.getElementById('editIndustry').value;
    const bio            = document.getElementById('editBio').value.trim();
    const skillsInput    = document.getElementById('editSkills').value.trim();
    const areasInput     = document.getElementById('editMentorshipAreas').value.trim();
    const maxMentees     = parseInt(document.getElementById('editMaxMentees').value) || 3;
    const prefContact    = document.getElementById('editPreferredContact').value;
    const availMentoring = document.getElementById('editAvailableForMentorship').value === 'true';
    const linkedin       = document.getElementById('editLinkedin').value.trim();
    const github         = document.getElementById('editGithub').value.trim();
    const portfolio      = document.getElementById('editPortfolio').value.trim();

    const saveBtn = profileForm.querySelector('.save-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        // Handle photo
        let profile_photo = null;
        if (uploadedPhotoUrl === 'REMOVE') {
            profile_photo = null;
        } else if (uploadedPhotoUrl) {
            profile_photo = await compressImage(uploadedPhotoUrl);
        } else {
            profile_photo = avatarImg.src.startsWith('data:') ? avatarImg.src : null;
        }

        const response = await fetch(`${BASE_URL}/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name:                fullName,
                branch,
                graduation_year:          gradYear,
                company,
                designation,
                experience_years:         experience,
                industry,
                bio,
                skills:                   skillsInput ? skillsInput.split(',').map(s => s.trim()) : [],
                mentorship_areas:         areasInput ? areasInput.split(',').map(s => s.trim()) : [],
                max_mentees:              maxMentees,
                preferred_contact:        prefContact,
                available_for_mentorship: availMentoring,
                linkedin,
                github,
                portfolio,
                profile_photo
            })
        });

        if (!response.ok) {
            if (response.status === 413) {
                alert('❌ Photo too large. Please choose a smaller photo.');
            } else {
                alert('❌ Error saving profile. Please try again.');
            }
            return;
        }

        const result = await response.json();

        // Update avatar
        if (profile_photo) {
            avatarImg.src = profile_photo;
        } else {
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=150&background=2563eb&color=fff`;
        }

        displayProfile(result.alumni);

        profileView.style.display = 'flex';
        profileEdit.style.display = 'none';
        editProfileBtn.style.display = 'inline-flex';
        uploadedPhotoUrl = null;

        alert('✅ Profile saved successfully!');

    } catch (error) {
        console.error('Save error:', error);
        alert('❌ Network error. Make sure server is running.');
    } finally {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        saveBtn.disabled = false;
    }
});

// ===== LOAD PROFILE ON PAGE LOAD =====
loadProfile();