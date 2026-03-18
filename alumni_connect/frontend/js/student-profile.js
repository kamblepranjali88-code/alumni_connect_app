const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn  = document.getElementById('cancelEditBtn');
const profileView    = document.getElementById('profileView');
const profileEdit    = document.getElementById('profileEdit');
const profileForm    = document.getElementById('profileForm');
const photoInput     = document.getElementById('photoInput');
const photoPreview   = document.getElementById('photoPreview');
const avatarImg      = document.getElementById('avatarImg');

let uploadedPhotoUrl = null;

// ===== PHOTO UPLOAD PREVIEW =====
photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedPhotoUrl = event.target.result;
        photoPreview.src = uploadedPhotoUrl;
    };
    reader.readAsDataURL(file);
});

// ===== SHOW EDIT MODE =====
editProfileBtn.addEventListener('click', () => {
    profileView.style.display = 'none';
    profileEdit.style.display = 'flex';
    editProfileBtn.style.display = 'none';
    photoPreview.src = avatarImg.src;
});

// ===== CANCEL =====
cancelEditBtn.addEventListener('click', () => {
    profileView.style.display = 'flex';
    profileEdit.style.display = 'none';
    editProfileBtn.style.display = 'inline-flex';
    uploadedPhotoUrl = null;
});

// ===== SAVE CHANGES =====
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName  = document.getElementById('editFullName').value.trim();
    const email     = document.getElementById('editEmail').value.trim();
    const branch    = document.getElementById('editBranch').value;
    const year      = document.getElementById('editYear').value;
    const interests = document.getElementById('editInterests').value.trim();
    const goals     = document.getElementById('editGoals').value.trim();
    const linkedin  = document.getElementById('editLinkedin').value.trim();
    const github    = document.getElementById('editGithub').value.trim();

    const yearLabels = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };

    // Update avatar
    const newAvatarSrc = uploadedPhotoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=150&background=2563eb&color=fff`;
    avatarImg.src = newAvatarSrc;

    // Update view fields
    document.getElementById('displayFullName').textContent  = fullName;
    document.getElementById('displayFullName2').textContent = fullName;
    document.getElementById('displayEmail').textContent     = email;
    document.getElementById('displayBranch').textContent    = branch;
    document.getElementById('displayBranch2').textContent   = branch;
    document.getElementById('displayYear').textContent      = yearLabels[year];
    document.getElementById('displayYear2').textContent     = yearLabels[year];
    document.getElementById('displayGoals').textContent     = goals || 'No goals added yet.';

    // Update skills tags
    const tagsContainer = document.getElementById('displayInterests');
    tagsContainer.innerHTML = '';
    if (interests) {
        interests.split(',').forEach(skill => {
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

    // Update social links
    if (linkedin) {
        document.getElementById('linkedinLink').href = linkedin;
        document.getElementById('linkedinText').textContent = linkedin.replace('https://', '');
    } else {
        document.getElementById('linkedinText').textContent = 'Not added';
    }

    if (github) {
        document.getElementById('githubLink').href = github;
        document.getElementById('githubText').textContent = github.replace('https://', '');
    } else {
        document.getElementById('githubText').textContent = 'Not added';
    }

    // Back to view
    profileView.style.display = 'flex';
    profileEdit.style.display = 'none';
    editProfileBtn.style.display = 'inline-flex';
    uploadedPhotoUrl = null;

    alert('✅ Profile saved successfully!');
});