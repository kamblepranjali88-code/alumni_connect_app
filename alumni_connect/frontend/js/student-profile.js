const BASE_URL = 'https://alumni-connect-backend-yy97.onrender.com/api';

const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn  = document.getElementById('cancelEditBtn');
const profileView    = document.getElementById('profileView');
const profileEdit    = document.getElementById('profileEdit');
const profileForm    = document.getElementById('profileForm');
const photoInput     = document.getElementById('photoInput');
const photoPreview   = document.getElementById('editAvatarImg'); // edit form preview
const avatarImg      = document.getElementById('avatarImg');     // hero avatar

const yearLabels = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
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
        const response = await fetch(`${BASE_URL}/auth/student/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to load profile');
        const student = await response.json();
        displayProfile(student);
        fillEditForm(student);
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

// ===== DISPLAY PROFILE IN VIEW MODE =====
function displayProfile(student) {
    const yearText = yearLabels[student.year] || student.year + ' Year';

    // Hero section
    document.getElementById('displayFullName').textContent   = student.full_name || '-';
    document.getElementById('displayRollNumber').textContent = student.roll_number || '-';
    document.getElementById('displayBranch').textContent     = student.branch || '-';
    document.getElementById('displayYear').textContent       = yearText;

    // Basic info card
    document.getElementById('displayFullName2').textContent = student.full_name || '-';
    document.getElementById('displayEmail').textContent     = student.email || '-';
    document.getElementById('displayBranch2').textContent   = student.branch || '-';
    document.getElementById('displayYear2').textContent     = yearText;

    // Goals
    document.getElementById('displayGoals').textContent = student.goals || 'No goals added yet.';

    // Avatar — use stored photo or generate initials avatar
    const avatarSrc = student.profile_photo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'User')}&size=150&background=2563eb&color=fff`;
    avatarImg.src = avatarSrc;
    if (photoPreview) photoPreview.src = avatarSrc;

    // Skills/Interests tags
    const tagsContainer = document.getElementById('displayInterests');
    tagsContainer.innerHTML = '';
    const interests = Array.isArray(student.interests)
        ? student.interests
        : (student.interests ? student.interests.split(',') : []);

    if (interests.length > 0 && interests[0] !== '') {
        interests.forEach(skill => {
            const s = skill.trim();
            if (s) {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = s;
                tagsContainer.appendChild(tag);
            }
        });
    } else {
        tagsContainer.innerHTML = '<span class="tag">No skills added</span>';
    }

    // Social links
    const linkedinLink = document.getElementById('linkedinLink');
    const githubLink   = document.getElementById('githubLink');
    const linkedinText = document.getElementById('linkedinText');
    const githubText   = document.getElementById('githubText');

    if (student.linkedin) {
        linkedinLink.href = student.linkedin;
        linkedinText.textContent = student.linkedin.replace('https://', '');
    } else {
        linkedinText.textContent = 'Not added';
    }

    if (student.github) {
        githubLink.href = student.github;
        githubText.textContent = student.github.replace('https://', '');
    } else {
        githubText.textContent = 'Not added';
    }
}

// ===== FILL EDIT FORM WITH CURRENT DATA =====
function fillEditForm(student) {
    document.getElementById('editFullName').value   = student.full_name || '';
    document.getElementById('editRollNumber').value = student.roll_number || '';
    document.getElementById('editEmail').value      = student.email || '';
    document.getElementById('editGoals').value      = student.goals || '';
    document.getElementById('editLinkedin').value   = student.linkedin || '';
    document.getElementById('editGithub').value     = student.github || '';

    const branchSelect = document.getElementById('editBranch');
    if (branchSelect) branchSelect.value = student.branch || '';

    const yearSelect = document.getElementById('editYear');
    if (yearSelect) yearSelect.value = student.year || '';

    const interests = Array.isArray(student.interests)
        ? student.interests.join(', ')
        : (student.interests || '');
    document.getElementById('editInterests').value = interests;
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

// ===== PHOTO UPLOAD WITH SIZE VALIDATION =====
if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('❌ Invalid file type!\nPlease upload an image file (JPG, PNG, etc.)');
            photoInput.value = '';
            return;
        }

        // Validate file size — max 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert(
                '❌ Photo is too large!\n\n' +
                'Please upload a photo that is:\n' +
                '• Less than 5MB in size\n' +
                '• Recommended size: 200x200 pixels\n' +
                '• Supported formats: JPG, PNG\n\n' +
                'Tip: Use a compressed/resized photo.'
            );
            photoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedPhotoUrl = event.target.result;
            if (photoPreview) photoPreview.src = uploadedPhotoUrl; // update edit preview
            avatarImg.src = uploadedPhotoUrl;                      // update hero avatar
            console.log('✅ Photo selected and previewed');
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

        uploadedPhotoUrl = 'REMOVE'; // special flag to remove photo from DB
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
    if (photoPreview) photoPreview.src = avatarImg.src; // sync current photo to edit preview
});

// ===== CANCEL =====
cancelEditBtn.addEventListener('click', () => {
    profileView.style.display = 'flex';
    profileEdit.style.display = 'none';
    editProfileBtn.style.display = 'inline-flex';
    uploadedPhotoUrl = null;
});

// ===== SAVE CHANGES TO BACKEND =====
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName  = document.getElementById('editFullName').value.trim();
    const email     = document.getElementById('editEmail').value.trim();
    const branch    = document.getElementById('editBranch').value;
    const year      = parseInt(document.getElementById('editYear').value);
    const interests = document.getElementById('editInterests').value.trim();
    const goals     = document.getElementById('editGoals').value.trim();
    const linkedin  = document.getElementById('editLinkedin').value.trim();
    const github    = document.getElementById('editGithub').value.trim();

    const saveBtn = profileForm.querySelector('.save-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        let profile_photo = null;

        if (uploadedPhotoUrl === 'REMOVE') {
            profile_photo = null; // remove photo from DB
        } else if (uploadedPhotoUrl) {
            console.log('🔄 Compressing image...');
            profile_photo = await compressImage(uploadedPhotoUrl);
            console.log('✅ Image compressed');
        } else {
            // Keep existing photo — only if it's a base64 image
            profile_photo = avatarImg.src.startsWith('data:') ? avatarImg.src : null;
        }

        const response = await fetch(`${BASE_URL}/auth/student/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email,
                branch,
                year,
                interests: interests ? interests.split(',').map(s => s.trim()) : [],
                goals,
                linkedin,
                github,
                profile_photo
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            if (response.status === 413) {
                alert('❌ Photo is still too large after compression.\nPlease choose a smaller photo (under 1MB).');
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

        // Refresh view
        displayProfile(result.student);

        // Back to view mode
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
